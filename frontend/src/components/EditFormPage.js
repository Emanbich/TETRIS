import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { HelpCircle } from 'lucide-react';
/** --------------------------------------------------------------------------------
 * Composant CustomAlert pour afficher des messages d'alerte
 * --------------------------------------------------------------------------------*/
const CustomAlert = ({ children, variant = 'default', className = '' }) => {
  const baseStyles = "p-4 rounded-lg mb-4 flex items-center gap-2";
  const variantStyles = {
    default: "bg-blue-50 text-blue-800 border border-blue-200",
    destructive: "bg-red-50 text-red-800 border border-red-200",
    success: "bg-green-50 text-green-800 border border-green-200"
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

/** --------------------------------------------------------------------------------
 * Composant OptionsEditor pour gérer les options d'une question "choice"
 * --------------------------------------------------------------------------------*/
const OptionsEditor = ({ options = [], onChange, onAdd, onRemove }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Options de réponse
      </label>
      {options.map((option, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={option}
            onChange={(e) => onChange(idx, e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
            placeholder={`Option ${idx + 1}`}
          />
          <button
            onClick={() => onRemove(idx)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer l'option"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-tetris-blue hover:text-tetris-blue transition-colors"
      >
        + Ajouter une option
      </button>
    </div>
  );
};

/** --------------------------------------------------------------------------------
 * Composant ImportanceField pour gérer la valeur "importance" d'une question
 * en permettant de REVENIR à l'ancienne valeur si la somme dépasse 100%.
 * --------------------------------------------------------------------------------*/
const ImportanceField = ({ question, index, questions, setQuestions }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tempImportance, setTempImportance] = useState(question.importance);

  const handleBlur = () => {
    // On convertit la valeur saisie en nombre (ou 0 si NaN)
    const newValueNum = parseFloat(tempImportance) || 0;
    // Ancienne valeur (pour pouvoir la rétablir si invalid)
    const oldValueNum = parseFloat(question.importance) || 0;

    // On duplique le tableau de questions
    const updatedQuestions = [...questions];

    // On met à jour l'importance de la question courante dans la copie
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      importance: newValueNum.toFixed(2), // formatage au centième
    };

    // On calcule la somme totale des importances après cette modification
    const totalImportance = updatedQuestions.reduce(
      (sum, q) => sum + parseFloat(q.importance || 0),
      0
    );

    // ICI on vérifie la règle : la somme doit être (très proche de) 100
    // Si la somme est invalide, on refuse la nouvelle valeur
    if (totalImportance > 100.0 + 0.01) {
      // On rétablit l'ancienne valeur dans le champ
      setTempImportance(oldValueNum.toFixed(2));
      alert("La somme des importances dépasse 100%. Valeur annulée.");
      return;
    }

    // Sinon, on valide la nouvelle importance et on met à jour le state parent
    setQuestions(updatedQuestions);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <div className="flex items-center gap-2">
          Importance (%)
          <div 
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <HelpCircle
              size={16}
              className="text-gray-400 cursor-pointer hover:text-gray-600"
            />
            {showTooltip && (
              <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                              bg-gray-800 text-white text-xs rounded py-1 px-2 
                              whitespace-nowrap">
                Sur un total de 100%, indiquez l'importance que vous accordez à cette question par rapport aux autres questions.
              </div>
            )}
          </div>
        </div>
      </label>

      <input
        type="number"
        step="0.01"
        min="0"
        max="100"
        value={tempImportance}
        onChange={(e) => setTempImportance(e.target.value)}
        onBlur={handleBlur}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
      />
    </div>
  );
};

/** --------------------------------------------------------------------------------
 * Composant principal EditFormPage
 * --------------------------------------------------------------------------------*/
const EditFormPage = ({ onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const bottomRef = useRef(null);

  const questionTypes = ['rating', 'stars', 'choice', 'text'];
  const classTypes = ['Satisfaction générale', 'Qualité du service', 'Processus et support'];

  // Au montage, on va chercher les questions
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/questions');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch questions');
      }
      
      const data = await response.json();
      console.log('Fetched questions:', data); // Debug

      // Formatage des questions
      const formattedData = data.map(q => ({
        ...q,
        importance: q.importance !== undefined ? Number(q.importance).toFixed(2) : "0.00",
        options: q.question_type === 'choice'
          ? (Array.isArray(q.options) ? q.options : [])
          : []
      }));

      setQuestions(formattedData);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error fetching questions');
      setLoading(false);
    }
  };

  /** --------------------------------------------------------------------------------
   * Handlers pour gérer les champs (sauf l'importance, géré par ImportanceField)
   * --------------------------------------------------------------------------------*/
  const handleOptionsChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleAddOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    updatedQuestions[questionIndex].options.push('Nouvelle option');
    setQuestions(updatedQuestions);
  };

  const handleRemoveOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options =
      updatedQuestions[questionIndex].options.filter((_, idx) => idx !== optionIndex);
    setQuestions(updatedQuestions);
  };

  const handleQuestionChange = (index, field, value) => {
    console.log(`Updating question ${index}:`, field, value); // Debug
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setQuestions(updatedQuestions);
  };

  /** --------------------------------------------------------------------------------
   * Ajout / Suppression de question
   * --------------------------------------------------------------------------------*/
  const addNewQuestion = () => {
    const maxId = Math.max(...questions.map(q => q.id), 0);
    const newQuestion = {
      id: maxId + 1,
      question_text: 'Nouvelle question',
      question_type: 'choice',
      max_value: null,
      class: null,
      options: [],
      importance: "0.00"
    };

    setQuestions([...questions, newQuestion]);

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const deleteQuestion = async (index) => {
    try {
      if (questions.length <= 1) {
        setError("Vous ne pouvez pas supprimer toutes les questions");
        return;
      }

      const questionToDelete = questions[index];

      const response = await fetch('http://localhost:5000/api/questions/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: questionToDelete.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete question');
      }

      const updatedQuestions = questions.filter((_, i) => i !== index);

      // Réordonne les questions restantes
      const reorderedQuestions = updatedQuestions.map((q, i) => ({
        ...q,
        id: i + 1
      }));

      setQuestions(reorderedQuestions);
      setSuccessMessage('Question supprimée avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Mise à jour dans la base de données
      const updateResponse = await fetch('http://localhost:5000/api/questions/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions: reorderedQuestions })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update question order');
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      setError(err.message || 'Erreur lors de la suppression de la question');
    }
  };

  /** --------------------------------------------------------------------------------
   * handleSubmit : Envoi des questions en base
   * --------------------------------------------------------------------------------*/
  const handleSubmit = async () => {
    // Vérification que la somme des importances est égale à 100%
    const totalImportance = questions.reduce(
      (sum, q) => sum + parseFloat(q.importance || 0),
      0
    );

    // Contrôle final
    if (Math.abs(totalImportance - 100) > 0.01) {
      setError("La somme des importances doit être égale à 100%.");
      return;
    }

    try {
      const formattedQuestions = questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        max_value: q.max_value,
        class: q.class,
        importance: q.importance,
        options: q.question_type === 'choice' ? (q.options || []) : null
      }));

      console.log('Submitting questions:', formattedQuestions);

      const response = await fetch('http://localhost:5000/api/questions/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions: formattedQuestions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update questions');
      }

      setSuccessMessage('Questions mises à jour avec succès !');
      await fetchQuestions();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error updating questions');
    }
  };

  /** --------------------------------------------------------------------------------
   * Affichage
   * --------------------------------------------------------------------------------*/
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
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-gray-50 z-10 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-tetris-blue hover:text-tetris-light transition-colors"
          >
            <ArrowLeft size={20} />
            Retour aux statistiques
          </button>
          <div className="flex gap-4">
            <button
              onClick={addNewQuestion}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
              Ajouter une question
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-tetris-blue text-white px-6 py-3 rounded-lg hover:bg-tetris-light transition-colors"
            >
              <Save size={20} />
              Enregistrer les modifications
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Éditer le formulaire</h1>
          <p className="mt-2 text-gray-600">Modifier les questions et leurs paramètres</p>
        </div>

        {error && (
          <CustomAlert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </CustomAlert>
        )}

        {successMessage && (
          <CustomAlert variant="success">
            <span>{successMessage}</span>
          </CustomAlert>
        )}

        <div className="space-y-6">
          {questions.map((question, index) => (
            <div 
              key={question.id}
              className="bg-white p-6 rounded-xl shadow-lg relative"
            >
              {/* Indicateur de numéro de question */}
              <div className="absolute -left-4 -top-4 w-8 h-8 bg-tetris-blue text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                {index + 1}
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text
                      </label>
                      <textarea
                        value={question.question_text}
                        onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
                        rows="3"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type de question
                        </label>
                        <select
                          value={question.question_type}
                          onChange={(e) => handleQuestionChange(index, 'question_type', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
                        >
                          {questionTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Si question_type = "choice", on affiche OptionsEditor */}
                      {question.question_type === 'choice' && (
                        <OptionsEditor
                          options={question.options || []}
                          onChange={(idx, value) => handleOptionsChange(index, idx, value)}
                          onAdd={() => handleAddOption(index)}
                          onRemove={(idx) => handleRemoveOption(index, idx)}
                        />
                      )}

                      {/* Si question_type = "rating" ou "stars", on propose max_value */}
                      {(question.question_type === 'rating' || question.question_type === 'stars') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valeur maximale
                          </label>
                          <input
                            type="number"
                            value={question.max_value || ''}
                            onChange={(e) => handleQuestionChange(index, 'max_value', parseInt(e.target.value))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
                          />
                        </div>
                      )}

                      {/* On affiche "Classe" seulement si question_type != "text" */}
                      {question.question_type !== 'text' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Classe
                            </label>
                            <select
                              value={question.class}
                              onChange={(e) => handleQuestionChange(index, 'class', e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
                            >
                              {classTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {/* Champ Importance -> on utilise maintenant le composant dédié */}
                      {question.question_type && (
                        <ImportanceField
                          question={question}
                          index={index}
                          questions={questions}
                          setQuestions={setQuestions}
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Bouton pour supprimer la question */}
                <button
                  onClick={() => deleteQuestion(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer la question"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

export default EditFormPage;
