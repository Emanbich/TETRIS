import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const ContactDetails = ({ responses, onSubmit, onSkip }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    });
    const [errors, setErrors] = useState({});

    // Function to determine if responses are negative
    const hasNegativeResponses = () => {
        const negativeThreshold = {
            1: (value) => value <= 5, // NPS score <= 5
            2: (value) => value <= 2, // Stars <= 2 out of 5
            3: (value) => ['Moyen', 'Insuffisant'].includes(value),
            4: (value) => ['Parfois', 'Rarement'].includes(value),
            5: (value) => ['Peu clair', 'Pas clair du tout'].includes(value),
            6: (value) => ['Plutôt compliqué', 'Très compliqué'].includes(value),
            7: (value) => ['Parfois', 'Rarement'].includes(value),
            8: (value) => ['Moyen', 'Insuffisant'].includes(value),
            9: (value) => ['Peu compétitive', 'Pas du tout compétitive'].includes(value)
        };

        let negativeCount = 0;
        let totalResponses = 0;

        for (const [questionId, response] of Object.entries(responses)) {
            if (questionId !== '10') { // Exclude comments
                if (negativeThreshold[questionId]?.(response)) {
                    negativeCount++;
                }
                totalResponses++;
            }
        }

        return (negativeCount / totalResponses) >= 0.4; // 40% or more negative responses
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Le nom est requis';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Le numéro de téléphone est requis';
        } else if (!/^\d{10}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Numéro de téléphone invalide';
        }

        if (!formData.email.trim()) {
            newErrors.email = "L'email est requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            newErrors.email = 'Email invalide';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    // If responses aren't negative enough, skip this step
    if (!hasNegativeResponses()) {
        onSkip();
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
            {/* Custom Alert using Tailwind */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                    Nous avons remarqué que vous n'êtes pas entièrement satisfait de nos services.
                    Veuillez nous laisser vos coordonnées pour que nous puissions vous recontacter et améliorer votre expérience.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de téléphone
                    </label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="flex justify-between pt-4">
                    <button
                        type="button"
                        onClick={onSkip}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Passer
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-tetris-blue text-white rounded-lg hover:bg-blue-700"
                    >
                        Envoyer
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ContactDetails;