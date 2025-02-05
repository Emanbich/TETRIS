// API.js

export const startSurvey = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/start-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: 'Survey ' + new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        id: Number(data.id) 
      };
    } catch (error) {
      console.error('Error starting survey:', error);
      return null;
    }
  };
  


export const submitResponses = async (surveyId, responses, negativeScore) => {
  try {
    console.log('[submitResponses] Début, surveyId=', surveyId, ' negativeScore=', negativeScore);

    // Transforme l'objet responses en tableau
    const formattedResponses = Object.entries(responses).map(([questionId, data]) => {
      const { answer, optionalAnswer } = data;
      return {
        question_id: Number(questionId),
        answer,
        optional_answer: optionalAnswer || null,
      };
    });

    const payload = {
      survey_id: Number(surveyId),
      responses: formattedResponses
    };

    // On inclut negativeScore seulement s'il est défini
    if (typeof negativeScore !== 'undefined') {
      payload.negativeScore = negativeScore;
    }

    console.log('[submitResponses] Payload envoyé au backend :', payload);

    const response = await fetch('http://localhost:5000/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('[submitResponses] Réponse brute du backend :', response);

    if (!response.ok) {
      const errMsg = await response.text();
      console.error('[submitResponses] HTTP error, status=', response.status, ' message=', errMsg);
      return false;
    }

    // Essayons de lire la réponse JSON ou texte
    const serverResponse = await response.text();
    console.log('[submitResponses] Réponse du serveur (texte) :', serverResponse);
    // ou si vous attendez un JSON
    // const serverData = await response.json();
    // console.log('[submitResponses] Réponse du serveur (JSON) :', serverData);

    console.log('[submitResponses] Fin, success=true');
    return true;
  } catch (error) {
    console.error('[submitResponses] Erreur réseau ou fetch:', error);
    return false;
  }
};


  