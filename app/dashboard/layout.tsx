'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
    } else {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserRole(decoded.role);
        setIsAuthenticated(true);

        // Rediriger les gestionnaires vers la page stations s'ils tentent d'accéder à d'autres pages
        // Autoriser l'accès à /dashboard/stations, /dashboard/reservations, /dashboard/transactions et /dashboard/refund
        const allowedPaths = ['/dashboard/stations', '/dashboard/reservations', '/dashboard/transactions', '/dashboard/refund'];
        if (decoded.role === 'gestion' && !allowedPaths.includes(pathname)) {
          router.push('/dashboard/stations');
        }
      } catch (error) {
        console.error('Token invalide:', error);
        localStorage.removeItem('admin_token');
        router.push('/login');
      }
    }
    setIsLoading(false);
  }, [router, pathname]);

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Ne rien afficher si pas authentifié (redirection en cours)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={userRole} />
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
