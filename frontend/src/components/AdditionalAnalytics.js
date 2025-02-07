import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, PieChart, Pie, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Cell,
} from 'recharts';
import { ArrowLeft, TrendingUp, Clock, MessageSquare, CreditCard, Info,User } from 'lucide-react';

const COLORS = ['#0B3D91', '#1E90FF', '#4169E1', '#6495ED', '#87CEEB'];
const RADIAN = Math.PI / 180;
import API_BASE_URL from "../config";
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const StatCard = ({ icon: Icon, title, value, description }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                <p className="mt-1 text-gray-600 text-sm">{description}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
                <Icon className="w-6 h-6 text-tetris-blue" />
            </div>
        </div>
    </div>
);

const AdditionalAnalytics = ({ onBack, onShowFeedback, onShowContacts }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summaryStats, setSummaryStats] = useState({
        avgClarity: 0,
        processScore: 0,
        deadlinePercent: 0,
        supportScore: 0,
        pricingScore: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/analytics/additional`);
                if (!response.ok) throw new Error('Failed to fetch data');
                
                const surveyData = await response.json();
                setData(surveyData);
                
                // Calculate summary statistics
                const clarity = processAnswers(5, surveyData);
                const process = processAnswers(6, surveyData);
                const deadlines = processAnswers(7, surveyData);
                const support = processAnswers(8, surveyData);
                const pricing = processAnswers(9, surveyData);
                
                setSummaryStats({
                    avgClarity: calculatePositivePercentage(clarity, ['Très clair', 'Clair']),
                    processScore: calculatePositivePercentage(process, ['Oui, très simple', 'Plutôt simple']),
                    deadlinePercent: calculatePositivePercentage(deadlines, ['Toujours', 'Souvent']),
                    supportScore: calculatePositivePercentage(support, ['Excellent', 'Bon']),
                    pricingScore: calculatePositivePercentage(pricing, ['Très compétitive', 'Assez compétitive'])
                });
                
                setLoading(false);
            } catch (err) {
                console.error('Error:', err);
                setError('Error fetching data');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const calculatePositivePercentage = (data, positiveResponses) => {
        const total = data.reduce((acc, curr) => acc + curr.value, 0);
        const positive = data
            .filter(item => positiveResponses.includes(item.label))
            .reduce((acc, curr) => acc + curr.value, 0);
        return total === 0 ? 0 : ((positive / total) * 100).toFixed(1);
    };

    const processAnswers = (questionId, surveyData) => {
        const counts = {};
        surveyData.forEach(survey => {
            const response = survey.responses.find(r => r.question_id === questionId);
            if (response && response.answer) {
                counts[response.answer] = (counts[response.answer] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([label, value]) => ({
            label,
            value
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-tetris-blue"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-red-500 text-xl">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => onBack()}
                        className="flex items-center gap-2 text-tetris-blue hover:text-tetris-light transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Retour aux statistiques principales
                    </button>
                    <button
                        onClick={onShowFeedback}
                        className="bg-tetris-blue text-white px-4 py-2 rounded-lg hover:bg-tetris-light transition-colors flex items-center gap-2"
                    >
                        <MessageSquare size={20} />
                        Analyse des commentaires
                    </button>
                </div>

                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-gray-900">Statistiques complémentaires</h1>
                    <p className="mt-2 text-gray-600">Analyse détaillée des processus et services</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <StatCard
                        icon={Info}
                        title="Clarté des Informations"
                        value={`${summaryStats.avgClarity}%`}
                        description="Taux de satisfaction sur la clarté"
                    />
                    <StatCard
                        icon={TrendingUp}
                        title="Simplicité du Processus"
                        value={`${summaryStats.processScore}%`}
                        description="Trouvent le processus simple"
                    />
                    <StatCard
                        icon={Clock}
                        title="Respect des Délais"
                        value={`${summaryStats.deadlinePercent}%`}
                        description="Délais respectés"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Information Clarity */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <Info className="w-6 h-6 text-tetris-blue" />
                            <h2 className="text-xl font-semibold">Clarté des informations</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={processAnswers(5, data)}
                                    dataKey="value"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={CustomLabel}
                                >
                                    {processAnswers(5, data).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Submission Process */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="w-6 h-6 text-tetris-blue" />
                            <h2 className="text-xl font-semibold">Simplicité du processus</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={processAnswers(6, data)}
                                    dataKey="value"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={CustomLabel}
                                >
                                    {processAnswers(6, data).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Deadlines */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="w-6 h-6 text-tetris-blue" />
                            <h2 className="text-xl font-semibold">Respect des délais</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={processAnswers(7, data)}
                                    dataKey="value"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={CustomLabel}
                                >
                                    {processAnswers(7, data).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Technical Support */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare className="w-6 h-6 text-tetris-blue" />
                            <h2 className="text-xl font-semibold">Support technique</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={processAnswers(8, data)}
                                    dataKey="value"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={CustomLabel}
                                >
                                    {processAnswers(8, data).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 col-span-full">
                        <div className="flex items-center gap-3 mb-6">
                            <CreditCard className="w-6 h-6 text-tetris-blue" />
                            <h2 className="text-xl font-semibold">Tarification</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={processAnswers(9, data)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#0B3D91">
                                    {processAnswers(9, data).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
    <button
        onClick={onShowContacts}
        className="bg-white border-2 border-tetris-blue text-tetris-blue px-6 py-3 rounded-lg 
                  hover:bg-tetris-blue hover:text-white transition-colors flex items-center 
                  gap-2 text-lg font-medium shadow-md hover:shadow-lg"
    >
        <User size={24} />
        Voir les contacts à suivre
    </button>
</div>
            </div>
        </div>
    );
};

export default AdditionalAnalytics;