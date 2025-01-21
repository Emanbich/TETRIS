import React, { useState } from 'react';
import './index.css';
import logo from './assets/logo.png';
import { ThumbsUp, Heart, Star, CheckCircle2 } from 'lucide-react';
import { db } from './config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import FloatingButton from './components/FloatingButton';
import { seedDatabase } from './seedDatabase';
import SatisfactionAnalytics from './components/SatisfactionAnalytics';
import AdditionalAnalytics from './components/AdditionalAnalytics';
import FeedbackAnalyticsPage from './components/FeedbackAnalysis';
import { analyzeFeedback } from './services/nlpService';
const ThankYouScreen = () => {
  return (
    <div className="fixed inset-0 bg-tetris-blue bg-opacity-95 flex items-center justify-center z-50 animate-fadeIn">
      <div className="text-center">
        <div className="space-y-6">
          {/* Icônes animées */}
          <div className="flex justify-center space-x-4 mb-8">
            <ThumbsUp className="w-12 h-12 text-white animate-bounce" />
            <Heart className="w-12 h-12 text-white animate-pulse" />
            <Star className="w-12 h-12 text-white animate-bounce delay-100" />
            <CheckCircle2 className="w-12 h-12 text-white animate-pulse delay-100" />
          </div>
          
          {/* Message de remerciement animé */}
          <h2 className="text-4xl font-bold text-white mb-4 animate-slideUp">
            Merci pour vos réponses !
          </h2>
          <p className="text-xl text-white opacity-90 animate-slideUp animation-delay-200">
            Votre avis est précieux pour nous aider à améliorer nos services.
          </p>
        </div>
      </div>
    </div>
  );
};

function App() {
  
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [showThankYou, setShowThankYou] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsView, setAnalyticsView] = useState('main'); 

  

  const questions = [
    {
      id: 1,
      text: "Recommanderiez-vous notre service à d'autres courtiers ?",
      type: "rating",
      max: 10
    },
    {
      id: 2,
      text: "Quel est votre niveau de satisfaction globale concernant nos services ?",
      type: "stars",
      max: 5
    },
    {
      id: 3,
      text: "Comment évaluez-vous la rapidité de nos réponses à vos demandes ?",
      type: "choice",
      options: ["Excellent", "Bon", "Moyen", "Insuffisant"]
    },
    {
      id: 4,
      text: "Les solutions d'assurance proposées correspondent-elles à vos besoins ?",
      type: "choice",
      options: ["Toujours", "Souvent", "Parfois", "Rarement"]
    },
    {
      id: 5,
      text: "Comment jugez-vous la clarté des informations fournies ?",
      type: "choice",
      options: ["Très clair", "Clair", "Peu clair", "Pas clair du tout"]
    },
    {
      id: 6,
      text: "Le processus de soumission des dossiers est-il simple à utiliser ?",
      type: "choice",
      options: ["Oui, très simple", "Plutôt simple", "Plutôt compliqué", "Très compliqué"]
    },
    {
      id: 7,
      text: "Les délais de traitement des dossiers sont-ils respectés ?",
      type: "choice",
      options: ["Toujours", "Souvent", "Parfois", "Rarement"]
    },
    {
      id: 8,
      text: "Comment évaluez-vous le support technique fourni ?",
      type: "choice",
      options: ["Excellent", "Bon", "Moyen", "Insuffisant"]
    },
    {
      id: 9,
      text: "La tarification proposée est-elle compétitive ?",
      type: "choice",
      options: ["Très compétitive", "Assez compétitive", "Peu compétitive", "Pas du tout compétitive"]
    },
    {
      id: 10,
      text: "Avez-vous des suggestions d'amélioration ou des commentaires ?",
      type: "text"
    }
  ];

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Passer automatiquement à la question suivante après une réponse
    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    }
  };

  const handleSubmit = async () => {
    try {
      // Original survey data structure
      const surveyData = {
        timestamp: new Date(),
        answers: {
          recommendation: responses[1] || null,
          satisfaction: responses[2] || null,
          responseSpeed: responses[3] || '',
          solutions: responses[4] || '',
          clarity: responses[5] || '',
          submissionProcess: responses[6] || '',
          deadlines: responses[7] || '',
          support: responses[8] || '',
          pricing: responses[9] || '',
          suggestions: responses[10] || ''
        }
      };
  
      // First save the survey
      const surveyRef = await addDoc(collection(db, 'surveys'), surveyData);
  
      // If there's a suggestion, analyze it and save to a separate collection
      if (responses[10] && responses[10].trim()) {
        try {
          const analysis = await analyzeFeedback(responses[10]);
          
          // Create a clean object for Firestore, handling potential undefined values
          const analysisData = {
            surveyId: surveyRef.id,
            timestamp: new Date(),
            originalText: responses[10],
            analysis: {
              sentiment: {
                score: analysis.sentiment?.score || 0,
                magnitude: analysis.sentiment?.magnitude || 0,
                category: analysis.sentiment?.category || 'NEUTRAL',
                sentences: analysis.sentiment?.sentences || []
              },
              entities: analysis.entities || [],
              mainTopics: analysis.mainTopics || [],
              categories: analysis.categories || []
            }
          };
  
          await addDoc(collection(db, 'feedbackAnalysis'), analysisData);
        } catch (analysisError) {
          console.error('Error in feedback analysis:', analysisError);
          // Continue with thank you screen even if analysis fails
        }
      }
      
      setShowThankYou(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Une erreur est survenue lors de la soumission du formulaire.');
    }
  };

  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'rating':
        return (
          <div className="flex justify-center gap-2 flex-wrap">
            {[...Array(question.max + 1)].map((_, i) => (
              <button
                key={i}
                onClick={() => handleResponse(question.id, i)}
                className={`w-12 h-12 rounded-full border-2 
                         ${responses[question.id] === i 
                           ? 'bg-tetris-blue text-white' 
                           : 'border-tetris-blue text-tetris-blue'} 
                         hover:bg-tetris-blue hover:text-white
                         transition duration-150 ease-in-out
                         flex items-center justify-center text-lg font-medium`}
              >
                {i}
              </button>
            ))}
          </div>
        );

      case 'stars':
        return (
          <div className="flex justify-center gap-2">
            {[...Array(question.max)].map((_, i) => (
              <button
                key={i}
                onClick={() => handleResponse(question.id, i + 1)}
                className={`text-4xl transition duration-150 ease-in-out
                         ${responses[question.id] > i 
                           ? 'text-yellow-400' 
                           : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
        );

      case 'choice':
        return (
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => handleResponse(question.id, option)}
                className={`w-full px-4 py-3 text-left rounded-lg
                         ${responses[question.id] === option
                           ? 'bg-tetris-blue text-white'
                           : 'border border-gray-300 text-gray-700 hover:border-tetris-blue hover:bg-blue-50'}
                         transition duration-150 ease-in-out`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            value={responses[question.id] || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-tetris-blue focus:border-transparent
                     resize-none"
            placeholder="Écrivez votre réponse ici..."
          />
        );

      default:
        return null;
    }
  };

  if (showThankYou) {
    return <ThankYouScreen />;
  }
  if (showAnalytics) {
    if (analyticsView === 'feedback') {
      return (
        <FeedbackAnalyticsPage 
          onBack={() => setAnalyticsView('additional')} 
        />
      );
    }
    if (analyticsView === 'additional') {
      return (
        <AdditionalAnalytics 
          onBack={(view) => {
            if (view === 'feedback') {
              setAnalyticsView('feedback');
            } else {
              setAnalyticsView('main');
            }
          }} 
        />
      );
    }
    return (
      <SatisfactionAnalytics 
        onBack={(view) => {
          if (view === 'additional') {
            setAnalyticsView('additional');
          } else {
            setShowAnalytics(false);
            setAnalyticsView('main');
          }
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-tetris-blue">
      {/* Header avec fond blanc */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <img src={logo} alt="Tetris Assurance" className="h-12 w-auto" />
            <div className="text-tetris-blue font-medium">
              Question {currentStep + 1} sur {questions.length}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">
            Votre avis compte
          </h1>
          <p className="text-lg text-white/80">
            Aidez-nous à améliorer nos services en répondant à quelques questions
          </p>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-white/20 rounded-full h-2.5 mb-10">
          <div 
            className="bg-white h-2.5 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Carte de question */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="mb-6 text-xl font-medium text-gray-900">
              {questions[currentStep].text}
            </div>

            <div className="space-y-4">
              {renderQuestionInput(questions[currentStep])}
            </div>
          </div>

          {/* Footer de la carte */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-md ${
                currentStep === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Précédent
            </button>
            {currentStep === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-tetris-blue text-white rounded-md
                         hover:bg-blue-700 transition duration-150 ease-in-out"
              >
                Terminer
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 bg-tetris-blue text-white rounded-md
                         hover:bg-blue-700 transition duration-150 ease-in-out"
              >
                Suivant
              </button>
            )}
          </div>
        </div>
      </main>
      {process.env.NODE_ENV === 'development' && (
    <button
      onClick={() => seedDatabase()}
      className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
    >
      Remplir DB (DEV)
    </button>
  )}
      <FloatingButton onClick={() => setShowAnalytics(true)} />
    </div>
  );
}

export default App;