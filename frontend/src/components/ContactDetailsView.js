import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Mail, Clock, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import API_BASE_URL from "../config";
const ContactDetailsView = ({ onBack }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/low-satisfaction`);
        if (!response.ok) throw new Error('Failed to fetch contacts');
        const data = await response.json();
        setContacts(data);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(contacts.map(contact => ({
      'Nom': contact.name,
      'Téléphone': contact.phone,
      'Email': contact.email,
      'Date': new Date(contact.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(workbook, "contacts.xlsx");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-tetris-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-tetris-blue hover:text-tetris-light transition-colors"
            >
              <ArrowLeft size={20} />
              Retour aux statistiques
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mt-6">Contacts à Suivre</h1>
            <p className="mt-2 text-gray-600">Liste des utilisateurs nécessitant une attention particulière</p>
          </div>

          {contacts.length > 0 && (
            <button
              onClick={downloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-tetris-blue text-white rounded-lg hover:bg-tetris-light transition-colors"
            >
              <Download size={20} />
              Télécharger Excel
            </button>
          )}
        </div>

        <div className="grid gap-6">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl"
            >
              <div className="grid md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <User className="w-6 h-6 text-tetris-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nom</p>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-tetris-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900">{contact.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-tetris-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{contact.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-tetris-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {contacts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Aucun contact à suivre
              </h3>
              <p className="text-gray-500 mt-2">
                Les contacts apparaîtront ici lorsque des utilisateurs nécessiteront une attention particulière.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsView;