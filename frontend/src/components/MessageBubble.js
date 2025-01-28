import React, { useRef, useEffect } from 'react';
import { Trophy, Star, Clock, ThumbsUp, Gift, Coffee, Sun, Heart, AlertCircle } from 'lucide-react';

const ChatMessage = ({ message, icon: Icon, isNew }) => (
  <div className={`flex items-start gap-2 mb-3 transform transition-all duration-500 
    ${isNew ? 'animate-message-in' : ''}`}>
    <div className="bg-white rounded-2xl rounded-bl-none p-3 shadow-md w-full 
                    flex items-start gap-2 max-w-[250px]">
      <Icon className="w-4 h-4 mt-1 text-tetris-blue/80 flex-shrink-0" />
      <p className="text-sm text-tetris-blue leading-snug">{message}</p>
    </div>
  </div>
);

const ChatConversation = ({ messages }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter out duplicate messages by checking message content
  const uniqueMessages = messages.filter((message, index, self) =>
    index === self.findIndex((m) => m.message === message.message)
  );

  return (
    <div className="fixed left-4 top-52 z-50 w-[280px] bg-gray-50/80 backdrop-blur-sm 
                    rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm font-medium text-tetris-blue">Assistant Tetris</span>
        </div>
      </div>
      
      {/* Messages Container */}
      <div className="h-[350px] overflow-y-auto p-4 flex flex-col-reverse">
        <div>
          {uniqueMessages.map((msg, index) => (
            <ChatMessage 
              key={msg.message} // Use message content as key instead of index
              message={msg.message} 
              icon={msg.icon}
              isNew={index === uniqueMessages.length - 1}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

const getResponseBasedMessage = (questionId, answer) => {
  const positiveMessages = {
    1: { message: "Génial ! Ça fait plaisir de voir que vous appréciez nos services 😊", icon: Heart },
    2: { message: "Super ! On continue comme ça alors ! 🌟", icon: ThumbsUp },
    3: { message: "La rapidité, c'est notre truc ! Content que ça se voie 🚀", icon: Trophy },
    4: { message: "Parfait ! On garde le cap alors 🎯", icon: Star },
    5: { message: "Ravi que tout soit clair pour vous ! 📝", icon: Star },
    6: { message: "C'est exactement ce qu'on voulait : simple et efficace ! ✨", icon: ThumbsUp },
    7: { message: "Ponctuel comme une horloge suisse ! ⌚", icon: Clock },
    8: { message: "Super ! Notre équipe donne toujours le meilleur 💪", icon: Heart },
    9: { message: "C'est vrai qu'on a de bons tarifs 😉", icon: Trophy }
  };

  const negativeMessages = {
    1: { message: "Oh... On va devoir revoir notre copie alors 🤔", icon: AlertCircle },
    2: { message: "Aïe... On peut faire tellement mieux 😅", icon: AlertCircle },
    3: { message: "Oups, on dirait qu'on a du retard à rattraper ⏰", icon: Clock },
    4: { message: "Mince... On n'est pas tout à fait dans le mille 🎯", icon: AlertCircle },
    5: { message: "Ok, on va essayer d'être plus clairs à l'avenir 🔍", icon: AlertCircle },
    6: { message: "Ah... On pensait avoir fait plus simple que ça 🤔", icon: AlertCircle },
    7: { message: "Le timing n'est pas notre point fort ces temps-ci 😅", icon: Clock },
    8: { message: "On dirait que notre support a besoin d'un boost ⚡", icon: AlertCircle },
    9: { message: "Les prix, c'est toujours compliqué... 💸", icon: AlertCircle }
  };

  // Keep the questionOptions object the same as it defines the logic
  const questionOptions = {
    3: { positive: "Excellent", negative: "Insuffisant" },
    4: { positive: "Toujours", negative: "Rarement" },
    5: { positive: "Très clair", negative: "Pas clair du tout" },
    6: { positive: "Oui, très simple", negative: "Très compliqué" },
    7: { positive: "Toujours", negative: "Rarement" },
    8: { positive: "Excellent", negative: "Insuffisant" },
    9: { positive: "Très compétitive", negative: "Pas du tout compétitive" }
  };

  // Handle rating questions (1-10)
  if (questionId === 1) {
    if (answer >= 8) return positiveMessages[1];
    if (answer <= 4) return negativeMessages[1];
    return null;
  }

  // Handle star rating (1-5)
  if (questionId === 2) {
    if (answer >= 4) return positiveMessages[2];
    if (answer <= 2) return negativeMessages[2];
    return null;
  }

  // Handle choice questions
  if (questionOptions[questionId]) {
    if (answer === questionOptions[questionId].positive) return positiveMessages[questionId];
    if (answer === questionOptions[questionId].negative) return negativeMessages[questionId];
  }

  return null;
};

const getProgressMessage = (step, totalSteps) => {
  const progress = Math.round((step / (totalSteps - 1)) * 100);
  
  if (progress === 25) {
    return { message: "Excellent début ! Continuez ! 🚀", icon: Star };
  }
  if (progress === 50) {
    return { message: "Vous êtes à mi-parcours ! 🎯", icon: Trophy };
  }
  if (progress === 75) {
    return { message: "Plus que quelques questions ! ⭐", icon: ThumbsUp };
  }
  if (progress >= 90) {
    return { message: "Dernière ligne droite ! 🎉", icon: Gift };
  }
  return null;
};

const getEngagementMessage = (step, totalSteps, responses, lastResponse) => {
  // First check for a response-based message if there's a new response
  if (lastResponse) {
    const responseMessage = getResponseBasedMessage(lastResponse.questionId, lastResponse.answer);
    if (responseMessage) return responseMessage;
  }

  // If no response-based message, check for progress-based message
  const progressMessage = getProgressMessage(step, totalSteps);
  if (progressMessage) return progressMessage;

  // Initial welcome message
  if (step === 0) {
    const hour = new Date().getHours();
    if (hour < 12) {
      return { message: "Bonjour ! Partagez votre expérience ☀️", icon: Sun };
    } else if (hour < 18) {
      return { message: "Une pause pour votre avis ? ☕", icon: Coffee };
    } else {
      return { message: "Bonsoir ! Un moment pour nous ? 🌟", icon: Star };
    }
  }

  return null;
};

export { ChatConversation, getEngagementMessage };