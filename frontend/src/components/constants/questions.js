import API_BASE_URL from ".../config";

// These are the fixed options for choice type questions
const choiceOptions = {
  3: ["Excellent", "Bon", "Moyen", "Insuffisant"],
  4: ["Toujours", "Souvent", "Parfois", "Rarement"],
  5: ["Très clair", "Clair", "Peu clair", "Pas clair du tout"],
  6: ["Oui, très simple", "Plutôt simple", "Plutôt compliqué", "Très compliqué"],
  7: ["Toujours", "Souvent", "Parfois", "Rarement"],
  8: ["Excellent", "Bon", "Moyen", "Insuffisant"],
  9: ["Très compétitive", "Assez compétitive", "Peu compétitive", "Pas du tout compétitive"]
};

// Function to transform database questions to the format needed by components
const transformDatabaseQuestion = (dbQuestion) => ({
  id: dbQuestion.id,
  text: dbQuestion.question_text,
  type: dbQuestion.question_type,
  max: dbQuestion.max_value,
  options: dbQuestion.options, 
  importance: dbQuestion.importance 
});

// Function to fetch and format questions
export const fetchQuestions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/questions`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    const data = await response.json();
    return data.map(transformDatabaseQuestion);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return initialQuestions; // Fallback to initial questions if fetch fails
  }
};
// Initial questions array - used as fallback and initial state
export const initialQuestions = [
  { id: 1, text: "Recommanderiez-vous notre service à d'autres courtiers ?", type: "rating", max: 10 },
  { id: 2, text: "Quel est votre niveau de satisfaction globale concernant nos services ?", type: "stars", max: 5 },
  { id: 3, text: "Comment évaluez-vous la rapidité de nos réponses à vos demandes ?", type: "choice", options: choiceOptions[3] },
  { id: 4, text: "Les solutions d'assurance proposées correspondent-elles à vos besoins ?", type: "choice", options: choiceOptions[4] },
  { id: 5, text: "Comment jugez-vous la clarté des informations fournies ?", type: "choice", options: choiceOptions[5] },
  { id: 6, text: "Le processus de soumission des dossiers est-il simple à utiliser ?", type: "choice", options: choiceOptions[6] },
  { id: 7, text: "Les délais de traitement des dossiers sont-ils respectés ?", type: "choice", options: choiceOptions[7] },
  { id: 8, text: "Comment évaluez-vous le support technique fourni ?", type: "choice", options: choiceOptions[8] },
  { id: 9, text: "La tarification proposée est-elle compétitive ?", type: "choice", options: choiceOptions[9] },
  { id: 10, text: "Avez-vous des suggestions d'amélioration ou des commentaires ?", type: "text",options: [] }
];