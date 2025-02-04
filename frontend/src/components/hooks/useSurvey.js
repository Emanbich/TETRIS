// hooks/useSurvey.js
import { useState, useEffect } from 'react';
import { startSurvey, submitResponses } from '../../API';
import { analyzeFeedback } from '../../services/nlpService';
import { SURVEY_CONFIG } from './../constants/config';
import { useQuestions } from './useQuestions';

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
          `[Question ${question.id} - ${question.type}] Réponse: ${numericResponse} > seuil (${threshold}) → Poids négatif: 0`
        );
        return 0;
      } else {
        // Pour donner un poids négatif à la valeur du seuil
        const weight = 1 - (numericResponse / (threshold + 1));
        
        console.log(
          `[Question ${question.id} - ${question.type}] Réponse: ${numericResponse}, Seuil: ${threshold}, Poids négatif: ${weight}`
        );
        return weight;
      }
    } else if (question.type === 'choice') {
      if (!question.options) return 0;
      let optionsArray = question.options;
      if (!Array.isArray(optionsArray)) {
        if (typeof optionsArray === 'string') {
          try {
            optionsArray = JSON.parse(optionsArray);
          } catch (error) {
            optionsArray = optionsArray.split(',');
          }
        } else {
          console.error(`Les options pour la question ${question.id} ne sont ni un tableau ni une chaîne.`);
          return 0;
        }
      }
      let chosenIndex;
      const responseAsNumber = parseInt(response, 10);
      if (!isNaN(responseAsNumber)) {
        chosenIndex = responseAsNumber;
      } else {
        chosenIndex = optionsArray.indexOf(response);
      }
      if (chosenIndex < 0) {
        console.log(`[Question ${question.id} - choice] Réponse non trouvée dans les options.`);
        return 0;
      }
      const threshold = Math.floor((optionsArray.length-1) / 2);
      if (chosenIndex <= threshold) {
        console.log(
          `[Question ${question.id} - choice] Réponse: ${response} (Index: ${chosenIndex}) est dans la partie positive → Poids négatif: 0`
        );
        return 0;
      } else {
        const denominator = optionsArray.length - threshold - 1;
        let weight;
        if (denominator <= 0) {
          weight = 1;
        } else {
          weight = (chosenIndex - threshold) / denominator;
        }
        console.log(
          `[Question ${question.id} - choice] Réponse: ${response} (Index: ${chosenIndex}), Seuil: ${threshold}, Poids négatif: ${weight}`
        );
        return weight;
      }
    }
    return 0;
  };
  
  // Initialisation du questionnaire
  useEffect(() => {
    const initializeSurvey = async () => {
      try {
        const response = await startSurvey();
        if (response && response.id) {
          setSurveyId(response.id);
        } else {
          console.error('Unable to start new survey.');
        }
      } catch (error) {
        console.error('Error initializing survey:', error);
      }
    };
    initializeSurvey();
  }, []);

  // Mise à jour de la réponse et calcul du score négatif pondéré
  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        optionalAnswer: prev[questionId]?.optionalAnswer || '',
        answer: value
      }
    }));
    setLastResponse({ questionId, answer: value });

    const shouldShowContact = () => {
      const updatedResponses = {
        ...responses,
        [questionId]: { answer: value }
      };

      console.log('--- Calcul du score négatif ---');
      console.log('Réponses mises à jour:', updatedResponses);

      let totalImportance = 0;
      let negativeImportance = 0;

      Object.keys(updatedResponses).forEach(key => {
        const qId = parseInt(key, 10);
        const questionObj = questions.find(q => q.id === qId);
        if (questionObj) {
          // On s'assure que l'importance est un nombre (par exemple, 10)
          const importance = parseFloat(questionObj.importance) || 0;
          totalImportance += importance;
          const negativeWeight = getNegativeWeight(questionObj, updatedResponses[qId].answer);
          negativeImportance += importance * negativeWeight;
          console.log(
            `Question ${qId}: importance=${importance}, réponse=${updatedResponses[qId].answer}, Poids négatif=${negativeWeight}`
          );
        }
      });

      console.log(`Total importance: ${totalImportance}`);
      console.log(`Importance négative pondérée: ${negativeImportance}`);

      if (totalImportance === 0) {
        console.log('Aucune importance totale calculée, ne pas afficher le formulaire.');
        return false;
      }
      const negativeScore = negativeImportance / totalImportance;
      const threshold = SURVEY_CONFIG.NEGATIVE_SCORE_THRESHOLD || 0.5;
      console.log(`Score négatif: ${negativeScore} (Seuil: ${threshold})`);
      return negativeScore >= threshold;
    };

    const contactVisibility = shouldShowContact();
    console.log(`Le formulaire de contact doit être affiché: ${contactVisibility}`);
    setShowContactButton(contactVisibility);
  };

  const handleOptionalAnswer = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        answer: prev[questionId]?.answer || '',
        optionalAnswer: value
      }
    }));
  };

  const handleSubmit = async () => {
    if (!surveyId) {
      console.error('Missing Survey ID!');
      return;
    }

    // Si nous sommes sur la dernière question et que le formulaire de contact est requis
    // mais non encore soumis ou ignoré, nous ne soumettons pas les réponses.
    if (currentStep === questions.length - 1 && showContactButton && !contactFormSkipped && !contactDetailsSubmitted) {
      console.log('Formulaire de contact requis, soumission différée.');
      return;
    }

    try {
      const success = await submitResponses(surveyId, responses);
      if (success) {
        if (responses[10]?.answer) {
          try {
            const analysis = await analyzeFeedback(responses[10].answer);
            const analysisResponse = await fetch('http://localhost:5000/api/feedback/analyze', {
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
              console.error('Failed to store analysis:', await analysisResponse.text());
            }
          } catch (error) {
            console.error('Error in feedback analysis:', error);
          }
        }
        setShowThankYou(true);
      } else {
        console.error('Failed to save responses.');
      }
    } catch (error) {
      console.error('Error submitting responses:', error);
    }
  };

  const handleNextStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setIsAnimating(false);
    }, SURVEY_CONFIG.ANIMATION_DURATION);
  };

  const handlePrevStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => Math.max(0, prev - 1));
      setIsAnimating(false);
    }, SURVEY_CONFIG.ANIMATION_DURATION);
  };

  const handleContactSubmit = async (contactData) => {
    try {
      const response = await fetch('http://localhost:5000/api/low-satisfaction', {
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
        throw new Error('Failed to submit contact details');
      }
      const success = await submitResponses(surveyId, responses);
      if (success) {
        setContactDetailsSubmitted(true);
        setShowThankYou(true);
      } else {
        console.error('Failed to submit survey responses');
      }
    } catch (error) {
      console.error('Error submitting contact details:', error);
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
