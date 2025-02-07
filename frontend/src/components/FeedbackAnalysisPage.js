import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, 
    ArrowLeft,
    ThumbsUp,
    Users,
    AlertCircle,
    Filter,
    Clock,
    Headphones,
    Flag,
    BarChart2,
    ThumbsDown,
    Minus,
    Heart,
    AlertTriangle
} from 'lucide-react';
import API_BASE_URL from "../config";
const EmotionBadge = ({ emotion, score }) => {
    const configs = {
        SATISFACTION: { icon: ThumbsUp, color: 'bg-green-100 text-green-800' },
        FRUSTRATION: { icon: AlertCircle, color: 'bg-red-100 text-red-800' },
        ENTHUSIASM: { icon: Heart, color: 'bg-purple-100 text-purple-800' },
        CONCERN: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' }
    };

    const config = configs[emotion] || configs.SATISFACTION;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${config.color}`}>
            <Icon size={14} />
            {emotion.charAt(0) + emotion.slice(1).toLowerCase()}
        </span>
    );
};

const UrgencyBadge = ({ level }) => {
    const configs = {
        HIGH: { color: 'bg-red-100 text-red-800' },
        MEDIUM: { color: 'bg-yellow-100 text-yellow-800' },
        LOW: { color: 'bg-blue-100 text-blue-800' },
        NORMAL: { color: 'bg-gray-100 text-gray-800' }
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${configs[level].color}`}>
            <Flag size={14} />
            Urgence {level.toLowerCase()}
        </span>
    );
};

// Topic Analysis Component - Place this before FeedbackCard
const TopicAnalysis = ({ topic, data }) => {
    if (!data?.subtopics) return null;

    const translations = {
        topics: {
            'SUPPORT': 'Support',
            'PLATFORM': 'Plateforme',
            'PROCESS': 'Processus'
        },
        subtopics: {
            'TECHNICAL': 'Technique',
            'CUSTOMER_SERVICE': 'Service client',
            'RESPONSE_TIME': 'Temps de réponse',
            'USABILITY': 'Utilisabilité',
            'FEATURES': 'Fonctionnalités',
            'PERFORMANCE': 'Performance'
        }
    };

    const getSentimentIcon = (sentiment) => {
        if (sentiment > 0.2) return <ThumbsUp className="w-4 h-4 text-green-600" />;
        if (sentiment < -0.2) return <ThumbsDown className="w-4 h-4 text-red-600" />;
        return <Minus className="w-4 h-4 text-gray-600" />;
    };

    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
                {translations.topics[topic] || topic}
            </h4>
            <div className="space-y-2">
                {Object.entries(data.subtopics).map(([subtopic, details]) => {
                    if (!details || !details.mentions) return null;
                    
                    const translatedSubtopic = translations.subtopics[subtopic] || subtopic;
                    
                    return (
                        <div key={subtopic} className="flex items-center justify-between bg-white p-2 rounded-md">
                            <div className="flex items-center gap-2">
                                {getSentimentIcon(details.sentiment)}
                                <span className="text-sm">
                                    {translatedSubtopic}
                                </span>
                            </div>
                            <span className="text-sm text-gray-500">
                                {details.mentions} mention{details.mentions > 1 ? 's' : ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Main FeedbackCard Component
const FeedbackCard = ({ feedback }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const { 
        overall = {},
        topics = {},
        keyPhrases = [],
        metadata = {}
    } = feedback?.analysis || {};

    const sentimentScore = overall?.sentiment?.score || 0;
    const displayPercentage = Math.abs(overall?.sentiment?.displayPercentage || 50);
    const urgencyLevel = overall?.urgency?.level || 'NORMAL';
    const dominantEmotion = overall?.emotions?.dominant;
    const emotions = overall?.emotions?.emotions || {};
    const wordCount = metadata?.wordCount || 0;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
                {/* Header badges */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                        sentimentScore > 0.1 ? 'bg-green-100 text-green-800' : 
                        sentimentScore < -0.1 ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {sentimentScore > 0 ? <ThumbsUp size={14} /> : 
                         sentimentScore < 0 ? <ThumbsDown size={14} /> : 
                         <Minus size={14} />}
                        {displayPercentage}% {sentimentScore > 0 ? 'Positif' : 'Négatif'}
                    </span>

                    {dominantEmotion && (
                        <EmotionBadge 
                            emotion={dominantEmotion} 
                            score={emotions[dominantEmotion]?.score || 0}
                        />
                    )}

                    <UrgencyBadge level={urgencyLevel} />

                    <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                        <MessageSquare size={14} />
                        {wordCount} mots
                        <Clock size={14} className="ml-2" />
                        {new Date(feedback.timestamp).toLocaleDateString('fr-FR')}
                    </div>
                </div>

                {/* Commentaire */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-tetris-blue" />
                        Commentaire
                    </h3>
                    <blockquote className="text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-tetris-blue">
                        {feedback.originalText}
                    </blockquote>
                </div>

                {/* Sentiment général */}
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sentiment général</h4>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Score</span>
                        <span className="font-medium text-sm">
                            {displayPercentage}% {sentimentScore >= 0 ? 'positif' : 'négatif'}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${displayPercentage}%`,
                                backgroundColor: sentimentScore < 0 ? '#ef4444' : '#22c55e'
                            }}
                        />
                    </div>
                </div>

                {/* Sujets détectés */}
                {Object.keys(topics).length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-tetris-blue" />
                            Sujets détectés
                        </h4>
                        <div className="space-y-3">
                            {Object.entries(topics).map(([topic, data]) => (
                                <TopicAnalysis key={topic} topic={topic} data={data} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const FeedbackAnalysisPage = ({ onBack }) => {
    const [feedbackData, setFeedbackData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/feedback/analysis`);
                if (!response.ok) throw new Error('Failed to fetch feedback');
                const data = await response.json();
                setFeedbackData(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching feedback:', error);
                setLoading(false);
            }
        };

        fetchFeedback();
    }, []);

    const filteredFeedback = feedbackData.filter(feedback => {
        if (filter === 'all') return true;
        const score = feedback.analysis?.overall?.sentiment?.score || 0;
        if (filter === 'positive') return score > 0.1;
        if (filter === 'negative') return score < -0.1;
        if (filter === 'urgent') return feedback.analysis?.overall?.urgency?.level === 'HIGH';
        return Math.abs(score) <= 0.1;
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
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-tetris-blue hover:text-tetris-light transition-colors mb-6"
                    >
                        <ArrowLeft size={20} />
                        Retour aux statistiques
                    </button>

                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Analyse des Commentaires
                            </h1>
                            <p className="text-gray-600">
                                {filteredFeedback.length} commentaires analysés
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
                            >
                                <option value="all">Tous</option>
                                <option value="positive">Positifs</option>
                                <option value="negative">Négatifs</option>
                                <option value="urgent">Urgents</option>
                                <option value="neutral">Neutres</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Feedback Cards */}
                <div className="space-y-6">
                    {filteredFeedback.map((feedback) => (
                        <FeedbackCard 
                            key={feedback.id} 
                            feedback={feedback} 
                        />
                    ))}

                    {filteredFeedback.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">
                                Aucun commentaire trouvé
                            </h3>
                            <p className="text-gray-500 mt-2">
                                {filter === 'all' 
                                    ? "Les analyses apparaîtront ici une fois que les utilisateurs auront soumis leurs commentaires."
                                    : "Aucun commentaire ne correspond au filtre sélectionné."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackAnalysisPage;