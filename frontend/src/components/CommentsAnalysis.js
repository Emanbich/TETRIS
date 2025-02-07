import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Filter, Search, Star } from 'lucide-react';
import API_BASE_URL from "../config";
const CommentsAnalysis = ({ onBack }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Questions mapping
  const questions = {
    1: "Recommanderiez-vous notre service à d'autres courtiers ?",
    2: "Quel est votre niveau de satisfaction globale concernant nos services ?",
    3: "Comment évaluez-vous la rapidité de nos réponses à vos demandes ?",
    4: "Les solutions d'assurance proposées correspondent-elles à vos besoins ?",
    5: "Comment jugez-vous la clarté des informations fournies ?",
    6: "Le processus de soumission des dossiers est-il simple à utiliser ?",
    7: "Les délais de traitement des dossiers sont-ils respectés ?",
    8: "Comment évaluez-vous le support technique fourni ?",
    9: "La tarification proposée est-elle compétitive ?"
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/comments`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const data = await response.json();
        
        console.log('Raw comments data:', data); // Debug log
        
        // Process the comments
        const processedComments = data.map(item => ({
          questionId: item.question_id,
          comment: item.optional_answer,
          surveyId: item.survey_id,
          mainAnswer: item.answer
        }));

        console.log('Processed comments:', processedComments); // Debug log
        setComments(processedComments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

  const filteredComments = comments.filter(comment => {
    const matchesFilter = filter === 'all' || filter === comment.questionId.toString();
    const matchesSearch = searchTerm === '' || 
      comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      questions[comment.questionId].toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-tetris-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-tetris-blue hover:text-tetris-light transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Retour aux statistiques
          </button>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyse des Commentaires</h1>
              <p className="text-gray-600">
                {filteredComments.length} commentaire{filteredComments.length > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher dans les commentaires..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="all">Toutes les questions</option>
                {Object.entries(questions).map(([id, text]) => (
                  <option key={id} value={id}>
                    Question {id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Comments Grid */}
        <div className="space-y-4">
          {filteredComments.length > 0 ? (
            filteredComments.map((comment, index) => (
              <div key={`${comment.surveyId}-${comment.questionId}-${index}`} 
                   className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="px-3 py-1.5 bg-tetris-blue text-white text-sm font-medium rounded-lg">
                        Question {comment.questionId}
                      </span>
                      {comment.mainAnswer && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-tetris-blue rounded-lg">
                          {comment.questionId === 1 ? (
                            <>
                              <Star className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Note: {comment.mainAnswer}/10
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-medium">
                              Réponse: {comment.mainAnswer}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-3 group-hover:text-tetris-blue transition-colors">
                      {questions[comment.questionId]}
                    </p>
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-tetris-blue flex-shrink-0 mt-1" />
                      <p className="text-gray-700 leading-relaxed">
                        {comment.comment}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Aucun commentaire trouvé
              </h3>
              <p className="text-gray-500 mt-2">
                {searchTerm 
                  ? "Aucun commentaire ne correspond à votre recherche."
                  : "Aucun commentaire n'a été laissé pour cette question."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsAnalysis;