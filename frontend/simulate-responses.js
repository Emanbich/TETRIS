import fetch from 'node-fetch';
import API_BASE_URL from "../config";
// Constructive feedback suggestions in the insurance context
const feedbackSuggestions = [
    "Excellent service ! Peut-être ajouter des notifications par SMS pour le suivi des dossiers ?",
    "Très satisfait globalement. Une interface mobile native serait un plus.",
    "Service de qualité. Il serait bien d'avoir plus d'options de personnalisation des contrats.",
    "Excellent accompagnement. Une suggestion : proposer des webinaires de formation sur les nouveaux produits.",
    "Très professionnel. Une API pour l'intégration directe avec nos systèmes serait appréciable.",
    "Service remarquable ! Suggestion : ajouter un tableau de bord personnalisable.",
    "Très satisfait du service. Une application mobile serait un plus pour le suivi en temps réel.",
    "Qualité exceptionnelle. Peut-être ajouter plus de documentation sur les cas spécifiques ?",
    "Excellent support ! L'ajout d'une FAQ détaillée serait apprécié.",
    "Service très efficace. Suggestion : intégrer un système de notifications personnalisables."
];

// Optional comments for other questions
const optionalComments = [
    "Très satisfait du service",
    "Il y a encore des améliorations possibles",
    "Le service répond à mes attentes",
    "Certains aspects pourraient être optimisés",
    "Globalement une bonne expérience",
    null,  // Include null to sometimes not add optional comments
];

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getWeightedRandom = (options, weights) => {
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < options.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return options[i];
        }
    }
    return options[options.length - 1];
};

const getRandomOptionalComment = () => {
    return optionalComments[Math.floor(Math.random() * optionalComments.length)];
};

const generateSurveyResponse = () => {
    const recommendationScores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const recommendationWeights = [1, 1, 1, 1, 2, 2, 3, 4, 5, 6, 7];
    const recommendation = getWeightedRandom(recommendationScores, recommendationWeights);

    const satisfactionScores = [1, 2, 3, 4, 5];
    const satisfactionWeights = [1, 1, 2, 5, 6];
    const satisfaction = getWeightedRandom(satisfactionScores, satisfactionWeights);

    const speedOptions = ["Excellent", "Bon", "Moyen", "Insuffisant"];
    const speed = getWeightedRandom(speedOptions, [6, 4, 2, 1]);

    const matchOptions = ["Toujours", "Souvent", "Parfois", "Rarement"];
    const match = getWeightedRandom(matchOptions, [6, 4, 2, 1]);

    const clarityOptions = ["Très clair", "Clair", "Peu clair", "Pas clair du tout"];
    const clarity = getWeightedRandom(clarityOptions, [6, 4, 2, 1]);

    const simplicityOptions = ["Oui, très simple", "Plutôt simple", "Plutôt compliqué", "Très compliqué"];
    const simplicity = getWeightedRandom(simplicityOptions, [6, 4, 2, 1]);

    const deadlineOptions = ["Toujours", "Souvent", "Parfois", "Rarement"];
    const deadline = getWeightedRandom(deadlineOptions, [6, 4, 2, 1]);

    const supportOptions = ["Excellent", "Bon", "Moyen", "Insuffisant"];
    const support = getWeightedRandom(supportOptions, [6, 4, 2, 1]);

    const pricingOptions = ["Très compétitive", "Assez compétitive", "Peu compétitive", "Pas du tout compétitive"];
    const pricing = getWeightedRandom(pricingOptions, [6, 4, 2, 1]);

    const feedback = feedbackSuggestions[Math.floor(Math.random() * feedbackSuggestions.length)];

    const responses = [];
    
    // Add each response separately with its question_id and optional_answer
    responses.push({ question_id: 1, answer: recommendation.toString(), optional_answer: getRandomOptionalComment() });
    responses.push({ question_id: 2, answer: satisfaction.toString(), optional_answer: getRandomOptionalComment() });
    responses.push({ question_id: 3, answer: speed, optional_answer: getRandomOptionalComment() });
    responses.push({ question_id: 4, answer: match, optional_answer: getRandomOptionalComment() });
    responses.push({ question_id: 5, answer: clarity, optional_answer: getRandomOptionalComment() });
    responses.push({ question_id: 6, answer: simplicity, optional_answer: getRandomOptionalComment() });
    responses.push({ question_id: 7, answer: deadline, optional_answer: getRandomOptionalComment() });
    responses.push({ question_id: 8, answer: support, optional_answer: getRandomOptionalComment() });
    responses.push({ question_id: 9, answer: pricing, optional_answer: getRandomOptionalComment() });
    responses.push({ question_id: 10, answer: feedback, optional_answer: null });

    return responses;
};

const simulateSurveyResponses = async (count) => {
    console.log(`Starting simulation of ${count} survey responses...`);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < count; i++) {
        try {
            const surveyResponse = await fetch(`${API_BASE_URL}/api/start-survey`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Simulation ${i + 1}`
                })
            });

            if (!surveyResponse.ok) {
                throw new Error(`Failed to start survey: ${surveyResponse.status}`);
            }

            const surveyData = await surveyResponse.json();
            const surveyId = surveyData.id;

            const responses = generateSurveyResponse();
            
            // Format the request payload according to the backend's expectation
            const submitResponse = await fetch(`${API_BASE_URL}/api/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    survey_id: surveyId,
                    responses: responses
                })
            });

            if (!submitResponse.ok) {
                const errorText = await submitResponse.text();
                throw new Error(`Failed to submit responses: ${submitResponse.status}. ${errorText}`);
            }

            successCount++;
            console.log(`Successfully submitted survey ${i + 1}/${count}`);
            
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            errorCount++;
            console.error(`Error in survey ${i + 1}:`, error);
        }
    }

    console.log('\nSimulation completed!');
    console.log(`Successfully submitted: ${successCount} surveys`);
    console.log(`Failed submissions: ${errorCount} surveys`);
};

// Run the simulation
simulateSurveyResponses(50);