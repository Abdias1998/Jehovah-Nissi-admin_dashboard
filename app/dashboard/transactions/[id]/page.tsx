"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, Transaction } from "@/lib/api";
import { ChevronLeft, CreditCard, Calendar, User, Phone, AlertTriangle, CheckCircle, Clock, XCircle, Hash } from "lucide-react";

function StatusBadge({ status }: { status: Transaction["status"] }) {
  const map: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
    SUCCESSFUL: { label: "Réussie", color: "text-green-600", bg: "bg-green-100", Icon: CheckCircle },
    PENDING: { label: "En attente", color: "text-yellow-600", bg: "bg-yellow-100", Icon: Clock },
    FAILED: { label: "Échouée", color: "text-red-600", bg: "bg-red-100", Icon: XCircle },
    CANCELLED: { label: "Annulée", color: "text-gray-600", bg: "bg-gray-100", Icon: AlertTriangle },
  };
  const { label, color, bg, Icon } = map[status] ?? map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

const PrettyJson = ({ data }: { data: any }) => {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) return <span className="text-gray-400">-</span>;
  return (
    <pre className="whitespace-pre-wrap break-words text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto max-h-96">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.transactions.getById(id);
        setTxn(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Impossible de charger la transaction");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatDateTime = (d?: string) => {
    if (!d) return "-";
    const date = new Date(d);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Détail de la transaction</h1>
        </div>
        <Link href="/dashboard/transactions" className="text-primary hover:underline">Voir la liste</Link>
      </div>

      {loading ? (
        <div className="bg-white border rounded-xl shadow-sm p-8 text-center">Chargement...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
      ) : !txn ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-4">Transaction introuvable</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="font-mono text-sm text-gray-900">{txn.reference}</span>
                </div>
                <StatusBadge status={txn.status} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium capitalize">{txn.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Montant</p>
                  <p className={`font-semibold ${txn.type === 'deposit' || txn.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                    {(txn.type === 'deposit' || txn.type === 'refund' ? '+' : '-') + txn.amount.toLocaleString()} FCFA
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Opérateur</p>
                  <div className="flex items-center gap-2 text-gray-700"><CreditCard className="w-4 h-4" />{txn.provider || '-'}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Téléphone</p>
                  <div className="flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4" />{txn.phoneNumber || '-'}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Réf. Feexpay</p>
                  <p className="font-mono text-xs">{txn.feexpayReference || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Créée le</p>
                  <div className="flex items-center gap-2 text-gray-700"><Calendar className="w-4 h-4" />{formatDateTime(txn.createdAt)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Complétée le</p>
                  <div className="flex items-center gap-2 text-gray-700"><Calendar className="w-4 h-4" />{formatDateTime(txn.completedAt)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">État & messages</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500">Raison (provider)</p>
                  <p className="text-gray-800">{txn.reason || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Message d'erreur</p>
                  <p className="text-gray-800">{txn.errorMessage || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Description</p>
                  <p className="text-gray-800">{txn.description || '-'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Webhook data</h2>
              <PrettyJson data={(txn as any).webhookData} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Metadata</h2>
              <PrettyJson data={txn.metadata} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Utilisateur</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" />
                  <span>{txn.userId?.firstName} {txn.userId?.lastName}</span>
                </div>
                <div className="text-gray-500 text-xs">{txn.userId?.email}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
