'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search, Filter, Calendar, Fuel, MapPin, User, Phone, RefreshCw, X, CheckCircle, Clock, XCircle, AlertTriangle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import AlertDialog from '@/components/AlertDialog';

interface Reservation {
  _id: string;
  reference: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  stationId: {
    _id: string;
    name: string;
    city: string;
    address: string;
  };
  fuelType: 'gasoline' | 'diesel' | 'premium' | 'lpg';
  quantity: number;
  pricePerLiter: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  reservationDate: string;
  expirationDate: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [userRole, setUserRole] = useState<string>('');
  const [managedStationId, setManagedStationId] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal détails
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

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

  useEffect(() => {
    console.log('🔄 Chargement page réservations...');
    // Récupérer le rôle et la station gérée depuis le token
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const decoded: any = JSON.parse(atob(token.split('.')[1]));
        console.log('👤 Token décodé:', { 
          role: decoded.role, 
          sub: decoded.sub,
          managedStationId: decoded.managedStationId 
        });
        setUserRole(decoded.role);
        // Le managedStationId est maintenant directement dans le token
        if (decoded.managedStationId) {
          console.log('✅ Station gérée trouvée:', decoded.managedStationId);
          setManagedStationId(decoded.managedStationId);
        } else {
          console.log('⚠️ Aucune station gérée dans le token');
        }
      } catch (error) {
        console.error('❌ Erreur décodage token:', error);
      }
    }
    console.log('📞 Appel loadReservations...');
    loadReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchQuery, filterStatus, userRole, managedStationId]);

  const loadReservations = async () => {
    try {
      console.log('📡 Début chargement réservations...');
      setLoading(true);
      const data = await api.reservations.getAll();
      console.log('✅ Réservations chargées:', data.length, 'réservations');
      setReservations(data);
    } catch (error: any) {
      console.error('❌ Erreur chargement réservations:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Impossible de charger les réservations';
      setAlertDialog({
        isOpen: true,
        title: 'Erreur',
        message: errorMessage,
        type: 'danger',
      });
    } finally {
      console.log('🏁 Fin chargement réservations');
      setLoading(false);
      console.log('✅ Loading mis à false');
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    // Filtrer par station pour les gestionnaires
    if (userRole === 'gestion' && managedStationId) {
      filtered = filtered.filter((res) => res.stationId._id === managedStationId);
    }

    // Filtrer par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter((res) => res.status === filterStatus);
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (res) =>
          res.reference.toLowerCase().includes(query) ||
          res.userId.firstName.toLowerCase().includes(query) ||
          res.userId.lastName.toLowerCase().includes(query) ||
          res.userId.email.toLowerCase().includes(query) ||
          res.stationId.name.toLowerCase().includes(query)
      );
    }

    setFilteredReservations(filtered);
  };

  const handleCancelReservation = (reference: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Annuler la réservation',
      message: 'Êtes-vous sûr de vouloir annuler cette réservation ?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await api.reservations.cancel(reference, 'Annulée par l\'administrateur');
          setAlertDialog({
            isOpen: true,
            title: 'Succès',
            message: 'Réservation annulée avec succès',
            type: 'success',
          });
          loadReservations();
        } catch (error) {
          setAlertDialog({
            isOpen: true,
            title: 'Erreur',
            message: 'Erreur lors de l\'annulation',
            type: 'danger',
          });
        }
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      CONFIRMED: { label: 'Confirmée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      COMPLETED: { label: 'Complétée', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle },
      EXPIRED: { label: 'Expirée', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle },
    };
    const { label, color, icon: Icon } = config[status as keyof typeof config] || config.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  const getFuelLabel = (type: string) => {
    const labels = {
      gasoline: 'Essence',
      diesel: 'Diesel',
      premium: 'Premium',
      lpg: 'GPL',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  console.log('🎨 Rendu - loading:', loading, 'reservations:', reservations.length, 'filtered:', filteredReservations.length);
  
  if (loading) {
    console.log('⏳ Affichage du spinner de chargement');
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  console.log('✅ Affichage de la page complète');
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Réservations</h1>
        <p className="text-gray-600 mt-1">
          {filteredReservations.length} réservation(s) {userRole === 'gestion' ? 'pour votre station' : 'au total'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par référence, client, station..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="COMPLETED">Complétées</option>
            <option value="CANCELLED">Annulées</option>
            <option value="EXPIRED">Expirées</option>
          </select>

          <button
            onClick={loadReservations}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{filteredReservations.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Confirmées</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredReservations.filter((r) => r.status === 'CONFIRMED').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Complétées</p>
          <p className="text-2xl font-bold text-blue-600">
            {filteredReservations.filter((r) => r.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Annulées</p>
          <p className="text-2xl font-bold text-red-600">
            {filteredReservations.filter((r) => r.status === 'CANCELLED').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Montant total</p>
          <p className="text-2xl font-bold text-primary">
            {filteredReservations
              .filter((r) => r.status === 'COMPLETED')
              .reduce((sum, r) => sum + r.totalAmount, 0)
              .toLocaleString()}{' '}
            FCFA
          </p>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredReservations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucune réservation trouvée</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Station
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carburant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedReservations.map((reservation) => (
                  <tr key={reservation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-medium text-gray-900">{reservation.reference}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {reservation.userId.firstName} {reservation.userId.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{reservation.userId.email}</p>
                        {reservation.userId.phoneNumber && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {reservation.userId.phoneNumber}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{reservation.stationId.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {reservation.stationId.city}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{getFuelLabel(reservation.fuelType)}</p>
                          <p className="text-sm text-gray-500">{reservation.quantity}L</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{reservation.totalAmount.toLocaleString()} FCFA</p>
                      <p className="text-xs text-gray-500">{reservation.pricePerLiter} FCFA/L</p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(reservation.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(reservation.createdAt)}</span>
                      </div>
                      {reservation.status === 'CONFIRMED' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expire: {formatDate(reservation.expirationDate)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReservation(reservation)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                          Détails
                        </button>
                        {reservation.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCancelReservation(reservation.reference)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <X className="w-4 h-4" />
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredReservations.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Affichage de {startIndex + 1} à {Math.min(endIndex, filteredReservations.length)} sur {filteredReservations.length} réservations
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        currentPage === page
                          ? 'bg-primary text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            )}
          </>
        )}
      </div>

      {/* Modal Détails */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Détails de la réservation</h2>
              <button
                onClick={() => setSelectedReservation(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Référence */}
              <div>
                <label className="text-sm font-medium text-gray-500">Référence</label>
                <p className="text-lg font-mono font-semibold text-gray-900">{selectedReservation.reference}</p>
              </div>

              {/* Statut */}
              <div>
                <label className="text-sm font-medium text-gray-500">Statut</label>
                <div className="mt-1">{getStatusBadge(selectedReservation.status)}</div>
              </div>

              {/* Client */}
              <div>
                <label className="text-sm font-medium text-gray-500">Client</label>
                <div className="mt-1">
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedReservation.userId.firstName} {selectedReservation.userId.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedReservation.userId.email}</p>
                  {selectedReservation.userId.phoneNumber && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Phone className="w-4 h-4" />
                      {selectedReservation.userId.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Station */}
              <div>
                <label className="text-sm font-medium text-gray-500">Station</label>
                <div className="mt-1">
                  <p className="text-lg font-semibold text-gray-900">{selectedReservation.stationId.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedReservation.stationId.address}, {selectedReservation.stationId.city}
                  </p>
                </div>
              </div>

              {/* Carburant */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type de carburant</label>
                  <p className="text-lg font-semibold text-gray-900">{getFuelLabel(selectedReservation.fuelType)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantité</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedReservation.quantity} Litres</p>
                </div>
              </div>

              {/* Prix */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Prix par litre</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedReservation.pricePerLiter} FCFA</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Montant total</label>
                  <p className="text-2xl font-bold text-primary">{selectedReservation.totalAmount.toLocaleString()} FCFA</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Date de réservation</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedReservation.createdAt)}</p>
                </div>
                {selectedReservation.status === 'CONFIRMED' && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date d'expiration</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedReservation.expirationDate)}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedReservation.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">{selectedReservation.notes}</p>
                </div>
              )}

              {/* Raison d'annulation */}
              {selectedReservation.cancellationReason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Raison d'annulation</label>
                  <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg mt-1">{selectedReservation.cancellationReason}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              {selectedReservation.status === 'CONFIRMED' && (
                <button
                  onClick={() => {
                    handleCancelReservation(selectedReservation.reference);
                    setSelectedReservation(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Annuler la réservation
                </button>
              )}
              <button
                onClick={() => setSelectedReservation(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

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
