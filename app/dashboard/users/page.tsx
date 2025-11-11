'use client';

import { useEffect, useState } from 'react';
import { api, User } from '@/lib/api';
import { Search, Filter, UserCheck, UserX, Shield, Mail, Phone, MapPin, Wallet, RefreshCw } from 'lucide-react';
import AlertDialog from '@/components/AlertDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import SelectDialog from '@/components/SelectDialog';
import InputDialog from '@/components/InputDialog';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin' | 'gestion'>('all');
  const [filterKyc, setFilterKyc] = useState<'all' | 'verified' | 'unverified'>('all');
  const [stations, setStations] = useState<any[]>([]);

  // Dialog states
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'danger' | 'warning' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'danger' | 'warning' | 'info'; onConfirm: () => void }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });
  const [inputDialog, setInputDialog] = useState<{ isOpen: boolean; title: string; message: string; onSubmit: (value: string) => void }>({
    isOpen: false,
    title: '',
    message: '',
    onSubmit: () => {},
  });
  const [selectDialog, setSelectDialog] = useState<{ isOpen: boolean; title: string; message: string; options: any[]; onSelect: (value: string) => void }>({
    isOpen: false,
    title: '',
    message: '',
    options: [],
    onSelect: () => {},
  });

  useEffect(() => {
    loadUsers();
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      const data = await api.stations.getAll();
      setStations(data);
    } catch (error) {
      console.error('Erreur chargement stations:', error);
    }
  };

  const getStationName = (stationId?: string) => {
    if (!stationId) return null;
    const station = stations.find((s) => s._id === stationId);
    return station ? `${station.name} (${station.city})` : 'Station inconnue';
  };

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterRole, filterKyc]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.users.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Erreur',
        message: 'Impossible de charger les utilisateurs',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phoneNumber?.toLowerCase().includes(query)
      );
    }

    // Filtre par rôle
    if (filterRole !== 'all') {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    // Filtre par KYC
    if (filterKyc === 'verified') {
      filtered = filtered.filter((user) => user.isKycVerified);
    } else if (filterKyc === 'unverified') {
      filtered = filtered.filter((user) => !user.isKycVerified);
    }

    setFilteredUsers(filtered);
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setConfirmDialog({
      isOpen: true,
      title: `${currentStatus ? 'Désactiver' : 'Activer'} l'utilisateur`,
      message: `Êtes-vous sûr de vouloir ${currentStatus ? 'désactiver' : 'activer'} cet utilisateur ?`,
      type: currentStatus ? 'warning' : 'info',
      onConfirm: async () => {
        try {
          await api.users.toggleActive(userId, !currentStatus);
          setAlertDialog({
            isOpen: true,
            title: 'Succès',
            message: `Utilisateur ${currentStatus ? 'désactivé' : 'activé'} avec succès`,
            type: 'success',
          });
          loadUsers();
        } catch (error) {
          setAlertDialog({
            isOpen: true,
            title: 'Erreur',
            message: 'Erreur lors de la modification',
            type: 'danger',
          });
        }
      },
    });
  };

  const handleChangeRole = async (userId: string) => {
    setSelectDialog({
      isOpen: true,
      title: 'Changer le rôle',
      message: 'Sélectionnez le nouveau rôle pour cet utilisateur',
      options: [
        { value: 'user', label: 'Utilisateur', description: 'Accès standard à l\'application mobile' },
        { value: 'gestion', label: 'Gestionnaire', description: 'Gestion d\'une station spécifique' },
        { value: 'admin', label: 'Administrateur', description: 'Accès complet au dashboard admin' },
      ],
      onSelect: async (newRole) => {
        try {
          await api.users.updateRole(userId, newRole);
          
          // Si le rôle est "gestion", demander d'assigner une station
          if (newRole === 'gestion') {
            setConfirmDialog({
              isOpen: true,
              title: 'Assigner une station',
              message: 'Voulez-vous assigner une station à ce gestionnaire maintenant ?',
              type: 'info',
              onConfirm: async () => {
                try {
                  const stationsData = await api.stations.getAll();
                  if (stationsData.length === 0) {
                    setAlertDialog({
                      isOpen: true,
                      title: 'Aucune station',
                      message: 'Aucune station disponible. Créez d\'abord une station avant d\'assigner un gestionnaire.',
                      type: 'warning',
                    });
                  } else {
                    setSelectDialog({
                      isOpen: true,
                      title: 'Sélectionner une station',
                      message: 'Choisissez la station à assigner à ce gestionnaire',
                      options: stationsData.map((s: any) => ({
                        value: s._id,
                        label: s.name,
                        description: `${s.city} - ${s.address}`,
                      })),
                      onSelect: async (stationId) => {
                        try {
                          await api.users.assignStation(userId, stationId);
                          setAlertDialog({
                            isOpen: true,
                            title: 'Succès',
                            message: 'Station assignée avec succès au gestionnaire !',
                            type: 'success',
                          });
                          loadUsers();
                        } catch (error) {
                          console.error('Erreur assignation station:', error);
                          setAlertDialog({
                            isOpen: true,
                            title: 'Erreur',
                            message: 'Erreur lors de l\'assignation de la station',
                            type: 'danger',
                          });
                        }
                      },
                    });
                  }
                } catch (error) {
                  console.error('Erreur chargement stations:', error);
                  setAlertDialog({
                    isOpen: true,
                    title: 'Erreur',
                    message: 'Erreur lors du chargement des stations',
                    type: 'danger',
                  });
                }
              },
            });
          } else {
            setAlertDialog({
              isOpen: true,
              title: 'Succès',
              message: 'Rôle mis à jour avec succès',
              type: 'success',
            });
            loadUsers();
          }
        } catch (error) {
          setAlertDialog({
            isOpen: true,
            title: 'Erreur',
            message: 'Erreur lors de la modification du rôle',
            type: 'danger',
          });
        }
      },
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'gestion':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'gestion':
        return 'Gestionnaire';
      default:
        return 'Utilisateur';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600 mt-1">Gérer les utilisateurs de la plateforme</p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="all">Tous les rôles</option>
            <option value="user">Utilisateurs</option>
            <option value="gestion">Gestionnaires</option>
            <option value="admin">Admins</option>
          </select>

          {/* KYC Filter */}
          <select
            value={filterKyc}
            onChange={(e) => setFilterKyc(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="all">Tous les KYC</option>
            <option value="verified">Vérifiés</option>
            <option value="unverified">Non vérifiés</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Vérifiés</p>
          <p className="text-2xl font-bold text-green-600">{users.filter((u) => u.isKycVerified).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Actifs</p>
          <p className="text-2xl font-bold text-blue-600">{users.filter((u) => u.isActive).length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solde
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {user.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {user.phoneNumber}
                          </div>
                        )}
                        {user.country && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {user.country}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          <Shield className="w-3 h-3" />
                          {getRoleLabel(user.role)}
                        </span>
                        {user.role === 'gestion' && user.managedStationId && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {getStationName(user.managedStationId)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {user.isKycVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                            <UserCheck className="w-3 h-3" />
                            Vérifié
                          </span>
                        )}
                        {!user.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                            Inactif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Wallet className="w-4 h-4 text-gray-400" />
                        {user.walletBalance} FCFA
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleChangeRole(user._id)}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                        >
                          Rôle
                        </button>
                        <button
                          onClick={() => handleToggleActive(user._id, user.isActive)}
                          className={`px-3 py-1 text-sm rounded transition ${
                            user.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {user.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
      <InputDialog
        isOpen={inputDialog.isOpen}
        onClose={() => setInputDialog({ ...inputDialog, isOpen: false })}
        onSubmit={inputDialog.onSubmit}
        title={inputDialog.title}
        message={inputDialog.message}
      />
      <SelectDialog
        isOpen={selectDialog.isOpen}
        onClose={() => setSelectDialog({ ...selectDialog, isOpen: false })}
        onSelect={selectDialog.onSelect}
        title={selectDialog.title}
        message={selectDialog.message}
        options={selectDialog.options}
      />
    </div>
  );
}
