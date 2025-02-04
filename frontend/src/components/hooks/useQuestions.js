// src/components/hooks/useQuestions.js
import { useState, useEffect } from 'react';
import { initialQuestions, fetchQuestions } from '../constants/questions';

export const useQuestions = () => {
  const [questions, setQuestions] = useState(initialQuestions);
  const [loading, setLoading] = useState(true);

  const loadQuestions = async () => {
    try {
      const fetchedQuestions = await fetchQuestions();
      console.log('Questions récupérées:', fetchedQuestions);
      setQuestions(fetchedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    loadQuestions();
  }, []);

  const refreshQuestions = () => {
    setLoading(true);
    loadQuestions();
  };

  return {
    questions,
    loading,
    refreshQuestions
  };
};