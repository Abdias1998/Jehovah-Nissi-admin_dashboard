'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, FileCheck, MapPin, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

interface Stats {
  users: number;
  kycPending: number;
  stations: number;
  reservations: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    kycPending: 0,
    stations: 0,
    reservations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques en parallèle (inclut réservations)
      const [users, kycRequests, stations, reservations] = await Promise.all([
        api.users.getAll(),
        api.kyc.getAll(),
        api.stations.getAll(),
        api.reservations.getAll(),
      ]);

      setStats({
        users: users.length,
        kycPending: kycRequests.filter((k: any) => k.status === 'pending').length,
        stations: stations.length,
        reservations: (reservations || []).length,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Utilisateurs',
      value: stats.users,
      icon: Users,
      color: 'bg-blue-500',
      href: '/dashboard/users',
    },
    {
      title: 'KYC en attente',
      value: stats.kycPending,
      icon: FileCheck,
      color: 'bg-yellow-500',
      href: '/dashboard/kyc',
    },
    {
      title: 'Stations',
      value: stats.stations,
      icon: MapPin,
      color: 'bg-green-500',
      href: '/dashboard/stations',
    },
    {
      title: 'Réservations',
      value: stats.reservations,
      icon: Calendar,
      color: 'bg-purple-500',
      href: '/dashboard/reservations',
    },
    {
      title: 'Notifications',
      value: '- -',
      icon: FileCheck,
      color: 'bg-red-500',
      href: '/dashboard/notifications',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Vue d'ensemble de la plateforme JNP</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Activité récente</h2>
          <div className="text-center py-12 text-gray-500">
            Aucune activité récente
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/kyc"
              className="block p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition"
            >
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Vérifier les KYC</p>
                  <p className="text-sm text-gray-600">{stats.kycPending} en attente</p>
                </div>
              </div>
            </Link>
            <Link
              href="/dashboard/users"
              className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Gérer les utilisateurs</p>
                  <p className="text-sm text-gray-600">{stats.users} utilisateurs</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
