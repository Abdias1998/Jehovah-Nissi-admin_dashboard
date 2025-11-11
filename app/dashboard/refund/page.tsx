'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Search, DollarSign, User, AlertCircle } from 'lucide-react';
import AlertDialog from '@/components/AlertDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function RefundPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Dialog states
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setAlertDialog({
        isOpen: true,
        title: 'Recherche vide',
        message: 'Veuillez entrer un email, nom ou téléphone',
        type: 'warning',
      });
      return;
    }

    try {
      setSearching(true);
      const users = await api.users.searchUsers(searchQuery);
      
      if (users && users.length > 0) {
        setSearchResults(users);
      } else {
        setSearchResults([]);
        setAlertDialog({
          isOpen: true,
          title: 'Aucun résultat',
          message: 'Aucun utilisateur trouvé avec ces critères',
          type: 'info',
        });
      }
    } catch (error: any) {
      console.error('Erreur recherche:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Erreur',
        message: error.message || 'Erreur lors de la recherche',
        type: 'danger',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleRefund = () => {
    // Validation
    if (!selectedUser) {
      setAlertDialog({
        isOpen: true,
        title: 'Utilisateur non sélectionné',
        message: 'Veuillez sélectionner un utilisateur',
        type: 'warning',
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setAlertDialog({
        isOpen: true,
        title: 'Montant invalide',
        message: 'Veuillez entrer un montant valide',
        type: 'warning',
      });
      return;
    }

    if (!reason.trim()) {
      setAlertDialog({
        isOpen: true,
        title: 'Raison manquante',
        message: 'Veuillez indiquer la raison du remboursement',
        type: 'warning',
      });
      return;
    }

    // Confirmation
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmer le remboursement',
      message: `Êtes-vous sûr de vouloir rembourser ${parseFloat(amount).toLocaleString()} FCFA à ${selectedUser.firstName} ${selectedUser.lastName} ?`,
      type: 'warning',
      onConfirm: processRefund,
    });
  };

  const processRefund = async () => {
    try {
      setLoading(true);
      const response = await api.payments.refundUser(
        selectedUser._id,
        parseFloat(amount),
        reason
      );

      if (response.data) {
        setAlertDialog({
          isOpen: true,
          title: 'Remboursement effectué',
          message: `Remboursement de ${parseFloat(amount).toLocaleString()} FCFA effectué avec succès.\nRéférence: ${response.data.transaction.reference}\nNouveau solde: ${response.data.transaction.newBalance.toLocaleString()} FCFA`,
          type: 'success',
        });

        // Réinitialiser le formulaire
        setSelectedUser(null);
        setAmount('');
        setReason('');
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Erreur',
          message: response.error || 'Erreur lors du remboursement',
          type: 'danger',
        });
      }
    } catch (error: any) {
      console.error('Erreur remboursement:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Erreur',
        message: error.message || 'Impossible d\'effectuer le remboursement',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Remboursement</h1>
        <p className="text-gray-600 mt-1">Rembourser un utilisateur</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-900 font-medium">Information</p>
          <p className="text-sm text-blue-700 mt-1">
            Le remboursement crédite directement le portefeuille de l'utilisateur. Une transaction de type REFUND sera créée.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recherche utilisateur */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rechercher un utilisateur</h2>
          
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Email, nom ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
            >
              {searching ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-2">{searchResults.length} résultat(s) trouvé(s)</p>
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.phoneNumber && (
                        <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {(user.walletBalance || 0).toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-gray-500">Solde actuel</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Utilisateur sélectionné */}
          {selectedUser && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-green-600" />
                <p className="font-medium text-green-900">Utilisateur sélectionné</p>
              </div>
              <p className="text-gray-900 font-semibold">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p className="text-sm text-gray-600">{selectedUser.email}</p>
              <p className="text-sm text-gray-900 mt-2">
                Solde actuel: <span className="font-semibold">{(selectedUser.walletBalance || 0).toLocaleString()} FCFA</span>
              </p>
              <button
                onClick={() => setSelectedUser(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Changer d'utilisateur
              </button>
            </div>
          )}
        </div>

        {/* Formulaire de remboursement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Détails du remboursement</h2>

          <div className="space-y-4">
            {/* Montant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (FCFA)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  placeholder="Entrez le montant"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  min="1"
                  step="1"
                />
              </div>
            </div>

            {/* Raison */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du remboursement
              </label>
              <textarea
                placeholder="Expliquez la raison du remboursement..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Aperçu */}
            {selectedUser && amount && parseFloat(amount) > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Aperçu</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Solde actuel:</span>
                    <span className="font-medium">{(selectedUser.walletBalance || 0).toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Montant à rembourser:</span>
                    <span className="font-medium text-green-600">+{parseFloat(amount).toLocaleString()} FCFA</span>
                  </div>
                  <div className="border-t border-gray-300 my-2"></div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Nouveau solde:</span>
                    <span className="font-bold text-primary">
                      {((selectedUser.walletBalance || 0) + parseFloat(amount)).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton */}
            <button
              onClick={handleRefund}
              disabled={loading || !selectedUser || !amount || !reason}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Traitement...' : 'Effectuer le remboursement'}
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
}
