'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  MapPin, 
  Calendar, 
  CreditCard,
  LogOut,
  Shield,
  DollarSign
} from 'lucide-react';
import { api } from '@/lib/api';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/dashboard/users', label: 'Utilisateurs', icon: Users, roles: ['admin'] },
  { href: '/dashboard/kyc', label: 'Vérifications KYC', icon: FileCheck, roles: ['admin'] },
  { href: '/dashboard/stations', label: 'Stations', icon: MapPin, roles: ['admin', 'gestion'] },
  { href: '/dashboard/reservations', label: 'Réservations', icon: Calendar, roles: ['admin', 'gestion'] },
  { href: '/dashboard/transactions', label: 'Transactions', icon: CreditCard, roles: ['admin', 'gestion'] },
  { href: '/dashboard/refund', label: 'Remboursement', icon: DollarSign, roles: ['admin', 'gestion'] },
];

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  
  // Filtrer les items du menu selon le rôle
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      api.auth.logout();
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">JNP Admin</h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
