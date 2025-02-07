export const SURVEY_CONFIG = {
    ANIMATION_DURATION: 300,
    API_ENDPOINTS: {
      BASE_URL: '${API_BASE_URL}',
      SURVEY: '/api/start-survey',
      RESPONSES: '/api/responses',
      FEEDBACK: '/api/feedback/analyze',
      LOW_SATISFACTION: '/api/low-satisfaction'
    },
    NEGATIVE_RESPONSES: {
      2: 1, // Lowest star rating
      3: "Insuffisant",
      4: "Rarement",
      5: "Pas clair du tout",
      6: "Très compliqué",
      7: "Rarement",
      8: "Insuffisant",
      9: "Pas du tout compétitive"
    },
    CHAT_SCROLL_DELAY: 100,
    CONTACT_THRESHOLD: 4, // Show contact form if rating is below this
    NEGATIVE_SCORE_THRESHOLD: 0.5
  };
  
  export const STYLING = {
    COLORS: {
      PRIMARY: 'tetris-blue',
      SECONDARY: 'blue-700',
      SUCCESS: 'green-500',
      ERROR: 'red-500',
      WARNING: 'yellow-500'
    },
    ANIMATIONS: {
      FADE_IN: 'animate-fadeIn',
      SLIDE_UP: 'animate-slideUp',
      BOUNCE: 'animate-bounce',
      PULSE: 'animate-pulse'
    },
    LAYOUT: {
      MAX_WIDTH: 'max-w-4xl',
      PADDING: {
        X: 'px-4',
        Y: 'py-8'
      },
      ROUNDED: 'rounded-xl'
    }
  };