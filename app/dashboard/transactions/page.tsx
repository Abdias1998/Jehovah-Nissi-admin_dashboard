'use client';

import { useEffect, useState } from 'react';
import { api, Transaction } from '@/lib/api';
import { Search, DollarSign, TrendingUp, TrendingDown, RefreshCw, Calendar, User, Phone, CreditCard, CheckCircle, Clock, XCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import AlertDialog from '@/components/AlertDialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Dialog state
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'danger' | 'warning' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, filterType, filterStatus]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.transactions.getAll();
      // L'API retourne un objet { transactions, pagination }
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Erreur',
        message: 'Impossible de charger les transactions',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.transactions.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filtre par type
    if (filterType !== 'all') {
      filtered = filtered.filter((txn) => txn.type === filterType);
    }

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter((txn) => txn.status === filterStatus);
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (txn) =>
          txn.reference.toLowerCase().includes(query) ||
          txn.userId.firstName.toLowerCase().includes(query) ||
          txn.userId.lastName.toLowerCase().includes(query) ||
          txn.userId.email.toLowerCase().includes(query) ||
          txn.phoneNumber?.toLowerCase().includes(query) ||
          txn.feexpayReference?.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  };

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus]);

  const getTypeBadge = (type: string) => {
    const config: any = {
      deposit: { icon: TrendingDown, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Recharge' },
      withdrawal: { icon: TrendingUp, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Retrait' },
      purchase: { icon: DollarSign, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Achat' },
      refund: { icon: TrendingDown, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Remboursement' },
    };

    const { icon: Icon, color, bgColor, label } = config[type] || config.deposit;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      SUCCESSFUL: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Réussie' },
      PENDING: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'En attente' },
      FAILED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Échouée' },
      CANCELLED: { icon: AlertTriangle, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Annulée' },
    };

    const { icon: Icon, color, bgColor, label } = config[status] || config.PENDING;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  const getProviderLabel = (provider?: string) => {
    const labels: any = {
      mtn: 'MTN',
      moov: 'Moov',
      celtiis: 'Celtiis',
    };
    return provider ? labels[provider] || provider.toUpperCase() : '-';
  };

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Porto-Novo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  const dd = get('day');
  const mm = get('month');
  const yyyy = get('year');
  const HH = get('hour');
  const MM = get('minute');
  return `${dd}/${mm}/${yyyy} ${HH}:${MM}`;
};


  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Transactions</h1>
        <button
          onClick={() => { loadTransactions(); loadStats(); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTransactions || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recharges</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{(stats.depositAmount || 0).toLocaleString()} FCFA</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Achats</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{(stats.purchaseAmount || 0).toLocaleString()} FCFA</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Remboursements</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{(stats.refundAmount || 0).toLocaleString()} FCFA</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réussies</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.successfulTransactions || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingTransactions || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher (référence, utilisateur, téléphone, Feexpay...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          {/* Filtre par type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="all">Tous les types</option>
            <option value="deposit">Recharge</option>
            <option value="withdrawal">Retrait</option>
            <option value="purchase">Achat</option>
            <option value="refund">Remboursement</option>
          </select>

          {/* Filtre par statut */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="SUCCESSFUL">Réussie</option>
            <option value="PENDING">En attente</option>
            <option value="FAILED">Échouée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center p-12">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucune transaction trouvée</p>
            <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opérateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/transactions/${transaction._id}`} className="font-mono text-sm font-medium text-primary hover:underline cursor-pointer"
                        onClick={(e) => { e.preventDefault(); router.push(`/dashboard/transactions/${transaction._id}`); }}>
                        {transaction.reference}
                      </Link>
                      {transaction.feexpayReference && (
                        <p className="text-xs text-gray-500 mt-1">Feexpay: {transaction.feexpayReference}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.userId.firstName} {transaction.userId.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{transaction.userId.email}</p>
                        {transaction.phoneNumber && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {transaction.phoneNumber}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getTypeBadge(transaction.type)}</td>
                    <td className="px-6 py-4">
                      <p className={`font-semibold ${transaction.type === 'deposit' || transaction.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}{transaction.amount.toLocaleString()} FCFA
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <CreditCard className="w-4 h-4" />
                        <span>{getProviderLabel(transaction.provider)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(transaction.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(transaction.createdAt)}</span>
                      </div>
                      {transaction.status === 'FAILED' && transaction.reason && (
                        <p className="text-xs text-red-600 mt-1">Raison: {transaction.reason}</p>
                      )}
                      {transaction.errorMessage && (
                        <p className="text-xs text-red-500 mt-1">{transaction.errorMessage}</p>
                      )}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredTransactions.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
              <div className="text-sm text-gray-600">
                Affichage de {startIndex + 1} à {Math.min(endIndex, filteredTransactions.length)} sur {filteredTransactions.length} transactions
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
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    // Afficher les 7 premières pages ou les pages autour de la page actuelle
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition ${
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
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

      {/* Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
