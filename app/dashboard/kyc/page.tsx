'use client';

import { useEffect, useState } from 'react';
import { api, KycRequest } from '@/lib/api';
import { Search, Clock, CheckCircle, XCircle, Eye, FileText, Calendar, User, RefreshCw, X } from 'lucide-react';
import Image from 'next/image';
import AlertDialog from '@/components/AlertDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import InputDialog from '@/components/InputDialog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Helper pour construire l'URL complète des images
const getImageUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return `${API_URL}/${path}`;
};

const documentTypeLabels: Record<string, string> = {
  id_card: 'Carte d\'identité',
  passport: 'Passeport',
  driver_license: 'Permis de conduire',
  biometric_card: 'Carte biométrique',
  cip: 'CIP',
};

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'En attente',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    label: 'Approuvée',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Rejetée',
  },
};

export default function KycPage() {
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<KycRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

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

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, filterStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await api.kyc.getAll();
      setRequests(data);
    } catch (error) {
      console.error('Erreur chargement KYC:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Erreur',
        message: 'Impossible de charger les demandes KYC',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.userId.firstName.toLowerCase().includes(query) ||
          req.userId.lastName.toLowerCase().includes(query) ||
          req.userId.email.toLowerCase().includes(query) ||
          req.documentNumber.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter((req) => req.status === filterStatus);
    }

    setFilteredRequests(filtered);
  };

  const handleViewDetails = (request: KycRequest) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  const handleApprove = async (requestId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approuver la demande',
      message: 'Êtes-vous sûr de vouloir approuver cette demande KYC ?',
      type: 'info',
      onConfirm: async () => {
        try {
          setReviewLoading(true);
          await api.kyc.review(requestId, 'approved');
          setAlertDialog({
            isOpen: true,
            title: 'Succès',
            message: 'Demande approuvée avec succès',
            type: 'success',
          });
          setModalVisible(false);
          setSelectedRequest(null);
          loadRequests();
        } catch (error) {
          setAlertDialog({
            isOpen: true,
            title: 'Erreur',
            message: 'Erreur lors de l\'approbation',
            type: 'danger',
          });
        } finally {
          setReviewLoading(false);
        }
      },
    });
  };

  const handleReject = async (requestId: string) => {
    setInputDialog({
      isOpen: true,
      title: 'Rejeter la demande',
      message: 'Veuillez indiquer la raison du rejet :',
      onSubmit: async (reason: string) => {
        if (reason && reason.trim()) {
          try {
            setReviewLoading(true);
            await api.kyc.review(requestId, 'rejected', reason);
            setAlertDialog({
              isOpen: true,
              title: 'Succès',
              message: 'Demande rejetée avec succès',
              type: 'success',
            });
            setModalVisible(false);
            setSelectedRequest(null);
            loadRequests();
          } catch (error) {
            setAlertDialog({
              isOpen: true,
              title: 'Erreur',
              message: 'Erreur lors du rejet',
              type: 'danger',
            });
          } finally {
            setReviewLoading(false);
          }
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Vérifications KYC</h1>
          <p className="text-gray-600 mt-1">Gérer les demandes de vérification d'identité</p>
        </div>
        <button
          onClick={loadRequests}
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
                placeholder="Rechercher par nom, email, numéro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvées</option>
            <option value="rejected">Rejetées</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">
            {requests.filter((r) => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Approuvées</p>
          <p className="text-2xl font-bold text-green-600">
            {requests.filter((r) => r.status === 'approved').length}
          </p>
        </div>
      </div>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          Aucune demande trouvée
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRequests.map((request) => {
            const StatusIcon = statusConfig[request.status].icon;
            return (
              <div
                key={request._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => handleViewDetails(request)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {request.userId.firstName} {request.userId.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{request.userId.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[request.status].bgColor} ${statusConfig[request.status].color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[request.status].label}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    {documentTypeLabels[request.documentType] || request.documentType}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">N°:</span>
                    {request.documentNumber}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {formatDate(request.createdAt)}
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(request._id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approuver
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(request._id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </button>
                  </div>
                )}

                <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                  <Eye className="w-4 h-4" />
                  Voir les détails
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de détails */}
      {modalVisible && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Détails de la demande</h2>
              <button
                onClick={() => setModalVisible(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Utilisateur */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Utilisateur</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">
                      {selectedRequest.userId.firstName} {selectedRequest.userId.lastName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedRequest.userId.email}</p>
                  {selectedRequest.userId.phoneNumber && (
                    <p className="text-sm text-gray-600">{selectedRequest.userId.phoneNumber}</p>
                  )}
                </div>
              </div>

              {/* Document */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Document</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Type:</span>{' '}
                    {documentTypeLabels[selectedRequest.documentType]}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Numéro:</span> {selectedRequest.documentNumber}
                  </p>
                </div>
              </div>

              {/* Photos */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Photos</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <button
                      onClick={() => handleViewImage(selectedRequest.documentPhoto)}
                      className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-75 transition relative"
                    >
                      <Image
                        src={getImageUrl(selectedRequest.documentPhoto)}
                        alt="Recto"
                        fill
                        className="object-cover"
                      />
                    </button>
                    <p className="text-sm text-center mt-2 text-gray-600">Recto</p>
                  </div>
                  {selectedRequest.documentBackPhoto && (
                    <div>
                      <button
                        onClick={() => handleViewImage(selectedRequest.documentBackPhoto!)}
                        className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-75 transition relative"
                      >
                        <Image
                          src={getImageUrl(selectedRequest.documentBackPhoto)}
                          alt="Verso"
                          fill
                          className="object-cover"
                        />
                      </button>
                      <p className="text-sm text-center mt-2 text-gray-600">Verso</p>
                    </div>
                  )}
                  {selectedRequest.selfiePhoto && (
                    <div>
                      <button
                        onClick={() => handleViewImage(selectedRequest.selfiePhoto!)}
                        className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-75 transition relative"
                      >
                        <Image
                          src={getImageUrl(selectedRequest.selfiePhoto)}
                          alt="Selfie"
                          fill
                          className="object-cover"
                        />
                      </button>
                      <p className="text-sm text-center mt-2 text-gray-600">Selfie</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Raison du rejet */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Raison du rejet</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{selectedRequest.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(selectedRequest._id)}
                    disabled={reviewLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approuver
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest._id)}
                    disabled={reviewLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal d'image */}
      {imageModalVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
          onClick={() => setImageModalVisible(false)}
        >
          <button
            onClick={() => setImageModalVisible(false)}
            className="absolute top-4 right-4 p-2 bg-white rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
            <Image
              src={getImageUrl(selectedImage)}
              alt="Document"
              fill
              className="object-contain"
            />
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
      <InputDialog
        isOpen={inputDialog.isOpen}
        onClose={() => setInputDialog({ ...inputDialog, isOpen: false })}
        onSubmit={inputDialog.onSubmit}
        title={inputDialog.title}
        message={inputDialog.message}
      />
    </div>
  );
}
