'use client';

import { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  MapPin,
  Battery,
  Fuel,
  Settings,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { api } from '@/lib/api';

interface OEMVehicle {
  _id: string;
  deviceId: string;
  vin: string;
  make: string;
  vehicleModel: string;
  year: number;
  licensePlate: string;
  fuelType: string;
  transmission: string;
  isActive: boolean;
  lastSyncAt: string;
  mileage?: number;
  fuelLevel?: number;
  batteryLevel?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  deviceInfo: {
    deviceId: string;
    deviceType: string;
    firmwareVersion: string;
    lastSeen: string;
  };
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

interface OEMStats {
  totalVehicles: number;
  activeVehicles: number;
  inactiveVehicles: number;
  totalMileage: number;
  averageFuelLevel: number;
  lowBatteryVehicles: number;
  devicesOffline: number;
}

export default function OEMPage() {
  const [vehicles, setVehicles] = useState<OEMVehicle[]>([]);
  const [stats, setStats] = useState<OEMStats>({
    totalVehicles: 0,
    activeVehicles: 0,
    inactiveVehicles: 0,
    totalMileage: 0,
    averageFuelLevel: 0,
    lowBatteryVehicles: 0,
    devicesOffline: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<OEMVehicle | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadVehicles();
    loadStats();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      // Simuler des données pour l'instant
      const mockVehicles: OEMVehicle[] = [
        {
          _id: '1',
          deviceId: 'TG-123456789',
          vin: '1HGCM82633A004352',
          make: 'Toyota',
          vehicleModel: 'Camry',
          year: 2022,
          licensePlate: 'AA123BB',
          fuelType: 'gasoline',
          transmission: 'automatic',
          isActive: true,
          lastSyncAt: '2025-06-20T10:30:00Z',
          mileage: 45000,
          fuelLevel: 75,
          batteryLevel: 85,
          location: {
            latitude: 9.6412,
            longitude: 2.3123,
            address: 'Cotonou, Bénin',
          },
          deviceInfo: {
            deviceId: 'TG-123456789',
            deviceType: 'Targa Pro',
            firmwareVersion: 'v2.1.3',
            lastSeen: '2025-06-20T10:30:00Z',
          },
          createdAt: '2025-01-15T08:00:00Z',
          updatedAt: '2025-06-20T10:30:00Z',
          user: {
            _id: 'user1',
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@email.com',
            phone: '229012345678',
          },
        },
        {
          _id: '2',
          deviceId: 'TG-987654321',
          vin: '2FTRX18W1XCA12345',
          make: 'Ford',
          vehicleModel: 'F-150',
          year: 2021,
          licensePlate: 'BB456CC',
          fuelType: 'diesel',
          transmission: 'manual',
          isActive: false,
          lastSyncAt: '2025-06-18T15:45:00Z',
          mileage: 78000,
          fuelLevel: 30,
          batteryLevel: 45,
          location: {
            latitude: 6.4935,
            longitude: 2.6293,
            address: 'Porto-Novo, Bénin',
          },
          deviceInfo: {
            deviceId: 'TG-987654321',
            deviceType: 'Targa Basic',
            firmwareVersion: 'v2.0.8',
            lastSeen: '2025-06-18T15:45:00Z',
          },
          createdAt: '2025-02-20T10:30:00Z',
          updatedAt: '2025-06-18T15:45:00Z',
          user: {
            _id: 'user2',
            firstName: 'Marie',
            lastName: 'Kouadio',
            email: 'marie.kouadio@email.com',
            phone: '229098765432',
          },
        },
      ];
      setVehicles(mockVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Simuler des statistiques
      const mockStats: OEMStats = {
        totalVehicles: 2,
        activeVehicles: 1,
        inactiveVehicles: 1,
        totalMileage: 123000,
        averageFuelLevel: 52.5,
        lowBatteryVehicles: 1,
        devicesOffline: 1,
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && vehicle.isActive) ||
      (statusFilter === 'inactive' && !vehicle.isActive);

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getFuelIcon = (fuelType: string) => {
    switch (fuelType) {
      case 'gasoline':
        return '⛽';
      case 'diesel':
        return '🚛';
      case 'premium':
        return '✨';
      case 'lpg':
        return '🔥';
      default:
        return '⚙️';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-500';
    if (level > 60) return 'text-green-600';
    if (level > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFuelColor = (level?: number) => {
    if (!level) return 'text-gray-500';
    if (level > 50) return 'text-green-600';
    if (level > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewDetails = (vehicle: OEMVehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetails(true);
  };

  const handleSyncVehicle = async (vehicleId: string) => {
    try {
      // Simuler la synchronisation
      console.log('Syncing vehicle:', vehicleId);
      alert('Véhicule synchronisé avec succès');
      loadVehicles();
    } catch (error) {
      console.error('Error syncing vehicle:', error);
      alert('Erreur lors de la synchronisation');
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return;
    
    try {
      // Simuler la suppression
      console.log('Deleting vehicle:', vehicleId);
      alert('Véhicule supprimé avec succès');
      loadVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Véhicules OEM</h1>
        <p className="text-gray-600">Gestion des véhicules connectés via Targa Telematics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total véhicules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
            </div>
            <Car className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Véhicules actifs</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeVehicles}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Batterie faible</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowBatteryVehicles}</p>
            </div>
            <Battery className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Appareils hors ligne</p>
              <p className="text-2xl font-bold text-red-600">{stats.devicesOffline}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par marque, modèle, plaque ou VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition">
              <Plus className="w-5 h-5" />
              Ajouter un véhicule
            </button>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propriétaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Données
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière synchro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucun véhicule trouvé
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.make} {vehicle.vehicleModel}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.licensePlate} • {vehicle.year}
                        </div>
                        <div className="text-xs text-gray-400">
                          VIN: {vehicle.vin}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.user ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.user.firstName} {vehicle.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.user.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            {vehicle.user.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Non assigné</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.isActive)}`}>
                        {vehicle.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span>{getFuelIcon(vehicle.fuelType)}</span>
                          <span className={`font-medium ${getFuelColor(vehicle.fuelLevel)}`}>
                            {vehicle.fuelLevel || 0}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Battery className="w-4 h-4" />
                          <span className={`font-medium ${getBatteryColor(vehicle.batteryLevel)}`}>
                            {vehicle.batteryLevel || 0}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {vehicle.mileage?.toLocaleString()} km
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.location ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {vehicle.location.address || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {vehicle.location.latitude.toFixed(4)}, {vehicle.location.longitude.toFixed(4)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(vehicle.lastSyncAt)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(vehicle)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSyncVehicle(vehicle._id)}
                          className="text-green-600 hover:text-green-900"
                          title="Synchroniser"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Éditer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Details Modal */}
      {showDetails && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedVehicle.make} {selectedVehicle.vehicleModel}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations générales */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">VIN:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedVehicle.vin}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Plaque d'immatriculation:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedVehicle.licensePlate}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Année:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedVehicle.year}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Carburant:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {getFuelIcon(selectedVehicle.fuelType)} {selectedVehicle.fuelType}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Transmission:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedVehicle.transmission}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Kilométrage:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {selectedVehicle.mileage?.toLocaleString()} km
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {/* Informations appareil */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations appareil</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">ID de l'appareil:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedVehicle.deviceId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Type d'appareil:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedVehicle.deviceInfo.deviceType}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Version firmware:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedVehicle.deviceInfo.firmwareVersion}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Dernière connexion:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {formatDate(selectedVehicle.deviceInfo.lastSeen)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Statut:</dt>
                      <dd className="text-sm font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedVehicle.isActive)}`}>
                          {selectedVehicle.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {/* Données en temps réel */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Données en temps réel</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Niveau de carburant</span>
                        <span className={`text-sm font-medium ${getFuelColor(selectedVehicle.fuelLevel)}`}>
                          {selectedVehicle.fuelLevel || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${selectedVehicle.fuelLevel || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Niveau de batterie</span>
                        <span className={`text-sm font-medium ${getBatteryColor(selectedVehicle.batteryLevel)}`}>
                          {selectedVehicle.batteryLevel || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (selectedVehicle.batteryLevel || 0) > 60 ? 'bg-green-600' :
                            (selectedVehicle.batteryLevel || 0) > 30 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${selectedVehicle.batteryLevel || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Localisation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Localisation</h3>
                  {selectedVehicle.location ? (
                    <div className="space-y-3">
                      <div>
                        <dt className="text-sm text-gray-600">Adresse:</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {selectedVehicle.location.address || 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Coordonnées GPS:</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {selectedVehicle.location.latitude.toFixed(6)}, {selectedVehicle.location.longitude.toFixed(6)}
                        </dd>
                      </div>
                      <div className="mt-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                          <MapPin className="w-4 h-4" />
                          Voir sur la carte
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Localisation non disponible</p>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => handleSyncVehicle(selectedVehicle._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Synchroniser
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Settings className="w-4 h-4" />
                  Configurer
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                  <AlertCircle className="w-4 h-4" />
                  Envoyer une alerte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
