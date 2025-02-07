// hooks/useSurvey.js
import { useState, useEffect } from 'react';
import { startSurvey, submitResponses } from '../../API'; // <-- Assurez-vous que submitResponses accepte le score négatif
import { analyzeFeedback } from '../../services/nlpService';
import { SURVEY_CONFIG } from './../constants/config';
import { useQuestions } from './useQuestions';
import API_BASE_URL from "../config";

export const useSurvey = () => {
  const [surveyId, setSurveyId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [showThankYou, setShowThankYou] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showContactButton, setShowContactButton] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [contactFormSkipped, setContactFormSkipped] = useState(false);
  const [contactDetailsSubmitted, setContactDetailsSubmitted] = useState(false);

  const { questions, loading: questionsLoading } = useQuestions();

  const getNegativeWeight = (question, response) => {
    if (question.type === 'rating' || question.type === 'stars') {
      const numericResponse = parseInt(response, 10);
      const threshold = Math.floor(question.max / 2);

      if (numericResponse > threshold) {
        console.log(
          `[getNegativeWeight] [Question ${question.id} - ${question.type}] Réponse: ${numericResponse} > seuil (${threshold}) → Poids négatif: 0`
        );
        return 0;
      } else {
        const weight = 1 - numericResponse / (threshold + 1);
        console.log(
          `[getNegativeWeight] [Question ${question.id} - ${question.type}] Réponse: ${numericResponse}, Seuil: ${threshold}, Poids négatif=${weight}`
        );
        return weight;
      }
    } else if (question.type === 'choice') {
      if (!question.options) return 0;
      let optionsArray = question.options;

      // Conversion éventuelle du champ options en tableau
      if (!Array.isArray(optionsArray)) {
        if (typeof optionsArray === 'string') {
          try {
            optionsArray = JSON.parse(optionsArray);
          } catch (error) {
            optionsArray = optionsArray.split(',');
          }
        } else {
          console.error(`[getNegativeWeight] Les options pour la question ${question.id} ne sont ni un tableau ni une chaîne.`);
          return 0;
        }
      }

      // On détermine l'indice choisi
      let chosenIndex;
      const responseAsNumber = parseInt(response, 10);
      if (!isNaN(responseAsNumber)) {
        chosenIndex = responseAsNumber;
      } else {
        chosenIndex = optionsArray.indexOf(response);
      }
      if (chosenIndex < 0) {
        console.log(`[getNegativeWeight] [Question ${question.id} - choice] Réponse non trouvée dans les options.`);
        return 0;
      }

      const threshold = Math.floor((optionsArray.length - 1) / 2);
      if (chosenIndex <= threshold) {
        console.log(
          `[getNegativeWeight] [Question ${question.id} - choice] Réponse: ${response} (Index: ${chosenIndex}) <= seuil (${threshold}) → Poids négatif: 0`
        );
        return 0;
      } else {
        const denominator = optionsArray.length - threshold - 1;
        let weight = denominator <= 0 ? 1 : (chosenIndex - threshold) / denominator;
        console.log(
          `[getNegativeWeight] [Question ${question.id} - choice] Réponse: ${response} (Index: ${chosenIndex}), Seuil: ${threshold}, Poids négatif=${weight}`
        );
        return weight;
      }
    }
    return 0;
  };

  // Calcule le score négatif global
  const calculateNegativeScore = (responsesObject, questionsArray) => {
    let totalImportance = 0;
    let negativeImportance = 0;

    Object.keys(responsesObject).forEach(key => {
      const qId = parseInt(key, 10);
      const questionObj = questionsArray.find(q => q.id === qId);

      if (questionObj) {
        const importance = parseFloat(questionObj.importance) || 0;
        totalImportance += importance;

        const negativeWeight = getNegativeWeight(questionObj, responsesObject[qId].answer);
        negativeImportance += importance * negativeWeight;

        console.log(
          `[calculateNegativeScore] QID=${qId}, importance=${importance}, weight=${negativeWeight}`
        );
      }
    });

    if (totalImportance === 0) {
      console.log('[calculateNegativeScore] totalImportance = 0 → score négatif = 0');
      return 0;
    }

    const score = negativeImportance / totalImportance;
    console.log(`[calculateNegativeScore] negativeImportance=${negativeImportance}, totalImportance=${totalImportance}, scoreFinal=${score}`);
    return score;
  };

  // Lance un nouveau survey
  useEffect(() => {
    const initializeSurvey = async () => {
      try {
        console.log('[useEffect] startSurvey');
        const response = await startSurvey();
        if (response && response.id) {
          setSurveyId(response.id);
          console.log('[useEffect] Nouveau survey démarré. ID:', response.id);
        } else {
          console.error('[useEffect] Unable to start new survey: pas de response.id');
        }
      } catch (error) {
        console.error('[useEffect] Error initializing survey:', error);
      }
    };
    initializeSurvey();
  }, []);

  // handleResponse : l'utilisateur répond à une question
  const handleResponse = (questionId, value) => {
    console.log(`[handleResponse] QID=${questionId}, value="${value}"`);

    // On stocke la réponse
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        optionalAnswer: prev[questionId]?.optionalAnswer || '',
        answer: value
      }
    }));
    setLastResponse({ questionId, answer: value });

    // Vérification si on affiche le bouton de contact
    const shouldShowContact = () => {
      const updatedResponses = {
        ...responses,
        [questionId]: { answer: value }
      };
      const negativeScore = calculateNegativeScore(updatedResponses, questions);
      const threshold = SURVEY_CONFIG.NEGATIVE_SCORE_THRESHOLD || 0.5;
      console.log(`[handleResponse] negativeScore=${negativeScore}, threshold=${threshold}`);
      return negativeScore >= threshold;
    };

    const contactVisibility = shouldShowContact();
    console.log(`[handleResponse] Le formulaire de contact doit être affiché=${contactVisibility}`);
    setShowContactButton(contactVisibility);
  };

  const handleOptionalAnswer = (questionId, value) => {
    console.log(`[handleOptionalAnswer] QID=${questionId}, optionalValue="${value}"`);

    setResponses(prev => ({
      ...prev,
      [questionId]: {
        answer: prev[questionId]?.answer || '',
        optionalAnswer: value
      }
    }));
  };

  // Soumission finale
  const handleSubmit = async () => {
    console.log('[handleSubmit] Début de la soumission...');
    if (!surveyId) {
      console.error('[handleSubmit] Impossible de soumettre: surveyId manquant');
      return;
    }

    if (
      currentStep === questions.length - 1 &&
      showContactButton &&
      !contactFormSkipped &&
      !contactDetailsSubmitted
    ) {
      console.log('[handleSubmit] Le formulaire de contact est requis, et pas encore géré.');
      return;
    }

    try {
      // Calcul du score négatif
      const negativeScore = calculateNegativeScore(responses, questions);
      console.log('[handleSubmit] negativeScore calculé:', negativeScore);

      // Envoi au backend
      console.log('[handleSubmit] Appel de submitResponses...');
      const success = await submitResponses(surveyId, responses, negativeScore);

      console.log('[handleSubmit] submitResponses success=', success);
      if (success) {
        // Analyse NLP sur la question 10, si elle existe
        if (responses[10]?.answer) {
          console.log('[handleSubmit] Analyse NLP de la question 10...');
          try {
            const analysis = await analyzeFeedback(responses[10].answer);
            console.log('[handleSubmit] NLP analysis result:', analysis);

            console.log('[handleSubmit] Envoi de l analyse sur /api/feedback/analyze...');
            const analysisResponse = await fetch(`${API_BASE_URL}/api/feedback/analyze`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                survey_id: surveyId,
                analysis: analysis
              })
            });
            if (!analysisResponse.ok) {
              const errMsg = await analysisResponse.text();
              console.error('[handleSubmit] Failed to store analysis:', errMsg);
            } else {
              console.log('[handleSubmit] Analyse NLP stockée avec succès.');
            }
          } catch (error) {
            console.error('[handleSubmit] Erreur dans analyzeFeedback:', error);
          }
        }
        setShowThankYou(true);
        console.log('[handleSubmit] -> On affiche le Thank You');
      } else {
        console.error('[handleSubmit] Erreur de soumission (returned false).');
      }
    } catch (error) {
      console.error('[handleSubmit] Exception:', error);
    }
  };

  const handleNextStep = () => {
    console.log('[handleNextStep] Passage au step suivant...');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setIsAnimating(false);
    }, SURVEY_CONFIG.ANIMATION_DURATION);
  };

  const handlePrevStep = () => {
    console.log('[handlePrevStep] Retour au step précédent...');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => Math.max(0, prev - 1));
      setIsAnimating(false);
    }, SURVEY_CONFIG.ANIMATION_DURATION);
  };

  // Soumission du formulaire de contact
  const handleContactSubmit = async (contactData) => {
    console.log('[handleContactSubmit] contactData=', contactData);
    try {
      const response = await fetch(`${API_BASE_URL}/api/low-satisfaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: surveyId,
          ...contactData
        })
      });
      if (!response.ok) {
        throw new Error('[handleContactSubmit] Echec POST /api/low-satisfaction');
      }
      console.log('[handleContactSubmit] Contact enregistré. On re-soumet le questionnaire...');

      // On peut recalculer le score négatif si besoin, ou juste laisser la fct faire son boulot
      const success = await submitResponses(surveyId, responses);
      console.log('[handleContactSubmit] Contact + responses success?', success);

      if (success) {
        setContactDetailsSubmitted(true);
        setShowThankYou(true);
      } else {
        console.error('[handleContactSubmit] Echec de la soumission des réponses.');
      }
    } catch (error) {
      console.error('[handleContactSubmit] Erreur de soumission contact:', error);
    }
  };

  return {
    surveyId,
    currentStep,
    responses,
    showThankYou,
    showContactForm,
    showContactButton,
    isAnimating,
    lastResponse,
    questionsLoading,
    questions,
    handleResponse,
    handleOptionalAnswer,
    handleSubmit,
    handleNextStep,
    handlePrevStep,
    handleContactSubmit,
    setShowContactForm,
    contactFormSkipped,
    setContactFormSkipped
  };
};
