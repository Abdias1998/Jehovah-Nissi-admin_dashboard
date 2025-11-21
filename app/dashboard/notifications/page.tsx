"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Send, Users } from "lucide-react";

export default function NotificationsAdminPage() {
  const [mode, setMode] = useState<"single" | "bulk" | "marketing">("single");
  const [userId, setUserId] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [userIds, setUserIds] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error" | "marketing">("info");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Templates rapides
  const templates: Array<{ id: string; label: string; title: string; message: string; type: "info" | "success" | "warning" | "error" | "marketing" }> = [
    {
      id: 'kyc-approved',
      label: 'KYC approuvé',
      title: 'Vérification KYC approuvée',
      message: "Votre compte a été vérifié avec succès. Vous pouvez maintenant profiter de tous les services JNP.",
      type: 'success',
    },
    {
      id: 'kyc-rejected',
      label: 'KYC rejeté',
      title: 'Vérification KYC rejetée',
      message: "Votre demande de vérification a été rejetée. Merci de mettre à jour vos documents et de réessayer.",
      type: 'warning',
    },
    {
      id: 'promo-fuel',
      label: 'Promo carburant',
      title: 'Promotion spéciale carburant',
      message: "-50 FCFA/L sur le carburant ce week-end dans les stations participantes. Profitez-en !",
      type: 'marketing',
    },
    {
      id: 'payment-success',
      label: 'Paiement réussi',
      title: 'Paiement confirmé',
      message: "Votre paiement a été confirmé. Merci pour votre confiance.",
      type: 'success',
    },
  ];

  const applyTemplate = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (!tpl) return;
    setTitle(tpl.title);
    setMessage(tpl.message);
    setType(tpl.type);
    if (tpl.type === 'marketing') {
      setMode('marketing');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !message.trim()) {
      setError("Titre et message requis");
      return;
    }
    if (title.trim().length < 3) {
      setError("Le titre doit contenir au moins 3 caractères");
      return;
    }
    if (message.trim().length < 5) {
      setError("Le message doit contenir au moins 5 caractères");
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      let response;

      if (mode === "single") {
        if (!userId.trim()) {
          setError("ID utilisateur requis");
          return;
        }
        response = await api.notifications.send(userId, { title, message, type });
      } else if (mode === "bulk") {
        const ids = userIds.split(/[\,\s]+/).filter(Boolean);
        if (ids.length === 0) {
          setError("Fournir au moins un ID utilisateur");
          return;
        }
        response = await api.notifications.sendBulk(ids, { title, message, type });
      } else {
        response = await api.notifications.marketingCampaign({ title, message, type: "marketing" });
      }

      setResult(response);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erreur envoi notification");
    } finally {
      setLoading(false);
    }
  };

  // Recherche utilisateur (mode single)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (mode !== 'single') return;
      const q = userQuery.trim();
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        setSearching(true);
        const users = await api.users.searchUsers(q);
        if (!cancelled) setSuggestions(users.slice(0, 8));
      } catch (e) {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [userQuery, mode]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Envoyer des notifications</h1>
        <p className="text-gray-600 mt-2">Notifier les utilisateurs via l'inbox + canaux (email/SMS/WhatsApp si activés)</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-3">
            {(["single", "bulk", "marketing"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg border ${mode === m ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300"}`}
              >
                {m === "single" && "Utilisateur"}
                {m === "bulk" && "Plusieurs utilisateurs"}
                {m === "marketing" && "Campagne marketing"}
              </button>
            ))}
          </div>

          {mode === "single" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID utilisateur</label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="65f..."
                className="w-full border border-gray-300 rounded-lg p-2.5 disabled:bg-gray-50"
                disabled={loading}
              />
              <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Recherche (nom/email)</label>
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full border border-gray-300 rounded-lg p-2.5 disabled:bg-gray-50"
                disabled={loading}
              />
              {(userQuery.trim().length >= 2) && (
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-56 overflow-auto divide-y">
                    {searching && (
                      <div className="p-2 text-sm text-gray-500">Recherche...</div>
                    )}
                    {!searching && suggestions.length === 0 && (
                      <div className="p-2 text-sm text-gray-500">Aucun résultat</div>
                    )}
                    {suggestions.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        className="w-full text-left p-2 hover:bg-gray-50"
                        onClick={() => { setUserId(u._id); setUserQuery(`${u.firstName} ${u.lastName} · ${u.email}`); }}
                      >
                        <div className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-gray-600">{u.email}</div>
                        <div className="text-[10px] text-gray-400">{u._id}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === "bulk" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IDs utilisateurs (séparés par virgule ou espaces)</label>
              <textarea
                value={userIds}
                onChange={(e) => setUserIds(e.target.value)}
                rows={3}
                placeholder="65f1..., 65f2..., 65f3..."
                className="w-full border border-gray-300 rounded-lg p-2.5 disabled:bg-gray-50"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Astuce: vous pouvez coller une colonne d'IDs depuis un CSV.</p>
            </div>
          )}

          {/* Templates rapides */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Templates rapides</label>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  disabled={loading}
                  onClick={() => applyTemplate(t.id)}
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre bref"
                className="w-full border border-gray-300 rounded-lg p-2.5 disabled:bg-gray-50"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg p-2.5"
                disabled={mode === "marketing" || loading}
              >
                <option value="info">Info</option>
                <option value="success">Succès</option>
                <option value="warning">Avertissement</option>
                <option value="error">Erreur</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Contenu de la notification"
              className="w-full border border-gray-300 rounded-lg p-2.5 disabled:bg-gray-50"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium disabled:opacity-60 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? "Envoi..." : mode === "single" ? "Envoyer" : mode === "bulk" ? "Envoyer en masse" : "Lancer la campagne"}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Résultat</h3>
            {mode === "single" && (
              <div className="space-y-1 text-gray-700">
                <div>Statut: <span className={`font-semibold ${result?.success ? 'text-green-700' : 'text-red-700'}`}>{result?.success ? 'Succès' : 'Échec'}</span></div>
                {result?.notification && (
                  <div>ID notification: <code className="bg-white px-1 py-0.5 rounded border">{result.notification._id}</code></div>
                )}
                <div className="text-xs text-gray-500">Canaux: email {result?.results?.email ? '✓' : '—'} · sms {result?.results?.sms ? '✓' : '—'} · whatsapp {result?.results?.whatsapp ? '✓' : '—'}</div>
              </div>
            )}
            {mode !== "single" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded border text-center">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-xl font-bold">{result?.total ?? '-'}</div>
                </div>
                <div className="p-3 bg-white rounded border text-center">
                  <div className="text-xs text-gray-500">Succès</div>
                  <div className="text-xl font-bold text-green-700">{result?.success ?? '-'}</div>
                </div>
                <div className="p-3 bg-white rounded border text-center">
                  <div className="text-xs text-gray-500">Échecs</div>
                  <div className="text-xl font-bold text-red-700">{result?.failed ?? '-'}</div>
                </div>
              </div>
            )}
            <div className="mt-3 text-xs text-gray-500">
              Détails bruts:
              <pre className="whitespace-pre-wrap break-words mt-1">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

