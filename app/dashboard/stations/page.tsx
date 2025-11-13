'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search, Plus, MapPin, Phone, Clock, Fuel, Edit, Trash2, RefreshCw, X, Check, Image as ImageIcon, Upload } from 'lucide-react';
import AlertDialog from '@/components/AlertDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

interface FuelPrice {
  type: 'gasoline' | 'diesel' | 'premium' | 'lpg';
  price: number;
  available: boolean;
}

interface OpeningHour {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

interface Station {
  _id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  phoneNumber: string;
  email?: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  fuelPrices: FuelPrice[];
  openingHours: OpeningHour[];
  status: 'open' | 'closed' | 'maintenance';
  services: string[];
  photos: string[];
  description?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [managedStationId, setManagedStationId] = useState<string>('');
  const [alwaysOpen, setAlwaysOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phoneNumber: '',
    longitude: '',
    latitude: '',
    gasolineAvailable: false,
    gasolinePrice: '',
    dieselAvailable: false,
    dieselPrice: '',
    premiumAvailable: false,
    premiumPrice: '',
    lpgAvailable: false,
    lpgPrice: '',
    services: [] as string[],
    isActive: true,
  });

  const daysOfWeek = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche',
  ];

  type DayOpeningSlot = {
    open: string;
    close: string;
  };

  type DayOpening = {
    day: string;
    closed: boolean;
    slots: DayOpeningSlot[];
  };

  const [openingHoursForm, setOpeningHoursForm] = useState<DayOpening[]>(
    daysOfWeek.map(day => ({
      day,
      closed: false,
      slots: [
        {
          open: '08:00',
          close: '18:00',
        },
      ],
    })),
  );
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

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

  const availableServices = [
    'Lavage auto',
    'Boutique',
    'Toilettes',
    'Entrée accessible en fauteuil roulant',
    'Parking accessible en fauteuil roulant',
    'Toilettes accessibles en fauteuil roulant',
    'WiFi',
    'Restaurant',
    'Aire de repos',
    'Gonflage pneus',
    'Vidange',
    'Échange de bouteille de propane',
    "Borne de gonflage"
  ]; 

  const formatOpeningHours = (hours: OpeningHour[]) => {
    if (!hours || hours.length === 0) {
      return 'Non renseigné';
    }

    // Regrouper par jour en conservant l'ordre classique
    const daysOrder = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
    const daysMap: Record<string, OpeningHour[]> = {};
    hours.forEach(h => {
      if (!daysMap[h.day]) daysMap[h.day] = [];
      daysMap[h.day].push(h);
    });

    const parts: string[] = [];
    daysOrder.forEach(day => {
      const slots = daysMap[day] || [];
      const openSlots = slots.filter(s => s.isOpen !== false);

      if (slots.length === 0 || openSlots.length === 0) {
        parts.push(`${day}: Fermé`);
      } else {
        const times = openSlots
          .map(s => `${s.open}–${s.close}`)
          .join(' / ');
        parts.push(`${day}: ${times}`);
      }
    });

    // Exemple: "Lundi: 08:00–12:30 / 15:00–18:30 | Mardi: Fermé | ..."
    return parts.join(' | ');
  };

  const getFuelByType = (fuelPrices: FuelPrice[], type: string) => {
    return fuelPrices?.find(f => f.type === type);
  };

  const fuelLabels = {
    gasoline: 'Essence',
    diesel: 'Diesel',
    premium: 'Premium',
    lpg: 'GPL',
  };

  const fuelColors = {
    gasoline: { bg: 'bg-green-50', text: 'text-green-700' },
    diesel: { bg: 'bg-blue-50', text: 'text-blue-700' },
    premium: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    lpg: { bg: 'bg-orange-50', text: 'text-orange-700' },
  };

  useEffect(() => {
    // Récupérer le rôle et la station gérée depuis le token
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const decoded: any = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decoded.role);
        // Récupérer les infos utilisateur pour obtenir managedStationId
        // Vérifier que decoded.sub est un ID valide (24 caractères hexadécimaux pour MongoDB ObjectId)
        if (decoded.sub && /^[0-9a-fA-F]{24}$/.test(decoded.sub)) {
          api.users.getById(decoded.sub).then((user) => {
            if (user.managedStationId) {
              setManagedStationId(user.managedStationId);
            }
          }).catch((error) => {
            console.error('Erreur récupération utilisateur:', error);
          });
        }
      } catch (error) {
        console.error('Erreur décodage token:', error);
      }
    }
    loadStations();
  }, []);

  useEffect(() => {
    filterStations();
  }, [stations, searchQuery, userRole, managedStationId]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const data = await api.stations.getAll();
      setStations(data);
    } catch (error) {
      console.error('Erreur chargement stations:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Erreur',
        message: 'Impossible de charger les stations',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStations = () => {
    let filtered = [...stations];

    // Filtrer par rôle : les gestionnaires ne voient que leur station
    if (userRole === 'gestion' && managedStationId) {
      filtered = filtered.filter((station) => station._id === managedStationId);
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (station) =>
          station.name.toLowerCase().includes(query) ||
          station.city.toLowerCase().includes(query) ||
          station.address.toLowerCase().includes(query)
      );
    }

    setFilteredStations(filtered);
  };

  const handleOpenModal = (station?: Station) => {
    if (station) {
      setEditingStation(station);
      const gasoline = getFuelByType(station.fuelPrices, 'gasoline');
      const diesel = getFuelByType(station.fuelPrices, 'diesel');
      const premium = getFuelByType(station.fuelPrices, 'premium');
      const lpg = getFuelByType(station.fuelPrices, 'lpg');

      setFormData({
        name: station.name,
        address: station.address,
        city: station.city,
        phoneNumber: station.phoneNumber,
        longitude: station.location.coordinates[0].toString(),
        latitude: station.location.coordinates[1].toString(),
        gasolineAvailable: gasoline?.available || false,
        gasolinePrice: gasoline?.price?.toString() || '',
        dieselAvailable: diesel?.available || false,
        dieselPrice: diesel?.price?.toString() || '',
        premiumAvailable: premium?.available || false,
        premiumPrice: premium?.price?.toString() || '',
        lpgAvailable: lpg?.available || false,
        lpgPrice: lpg?.price?.toString() || '',
        services: station.services || [],
        isActive: station.status === 'open',
      });

      // Mapper les horaires existants vers openingHoursForm
      const byDay: Record<string, OpeningHour[]> = {};
      (station.openingHours || []).forEach(h => {
        if (!byDay[h.day]) byDay[h.day] = [];
        byDay[h.day].push(h);
      });

      setOpeningHoursForm(
        daysOfWeek.map(day => {
          const slots = byDay[day] || [];
          if (slots.length === 0) {
            return {
              day,
              closed: true,
              slots: [],
            } as DayOpening;
          }

          const openSlots = slots.filter(s => s.isOpen !== false);
          if (openSlots.length === 0) {
            return {
              day,
              closed: true,
              slots: [],
            } as DayOpening;
          }

          return {
            day,
            closed: false,
            slots: openSlots.map(s => ({ open: s.open, close: s.close })),
          } as DayOpening;
        }),
      );
    } else {
      setEditingStation(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        phoneNumber: '',
        longitude: '',
        latitude: '',
        gasolineAvailable: false,
        gasolinePrice: '',
        dieselAvailable: false,
        dieselPrice: '',
        premiumAvailable: false,
        premiumPrice: '',
        lpgAvailable: false,
        lpgPrice: '',
        services: [],
        isActive: true,
      });

      // Réinitialiser les horaires par défaut
      setOpeningHoursForm(
        daysOfWeek.map(day => ({
          day,
          closed: day === 'Samedi' || day === 'Dimanche',
          slots:
            day === 'Samedi' || day === 'Dimanche'
              ? []
              : [
                  {
                    open: '08:00',
                    close: '12:30',
                  },
                  {
                    open: '15:00',
                    close: '18:30',
                  },
                ],
        })),
      );
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingStation(null);
    setSelectedPhotos([]);
    setPhotoPreviewUrls([]);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('📁 Fichiers sélectionnés:', files.length);
    if (files.length === 0) return;

    // Limiter à 10 photos maximum
    const remainingSlots = 10 - selectedPhotos.length;
    const filesToAdd = files.slice(0, remainingSlots);
    console.log('📁 Fichiers à ajouter:', filesToAdd.length);

    setSelectedPhotos(prev => {
      const newPhotos = [...prev, ...filesToAdd];
      console.log('📁 Total photos après ajout:', newPhotos.length);
      return newPhotos;
    });

    // Créer les URLs de prévisualisation
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 Début handleSubmit');
    console.log('📸 selectedPhotos.length:', selectedPhotos.length);
    console.log('📸 selectedPhotos:', selectedPhotos);

    // Construire le tableau fuelPrices
    const fuelPrices: FuelPrice[] = [];
    if (formData.gasolineAvailable) {
      fuelPrices.push({ type: 'gasoline', price: parseFloat(formData.gasolinePrice), available: true });
    }
    if (formData.dieselAvailable) {
      fuelPrices.push({ type: 'diesel', price: parseFloat(formData.dieselPrice), available: true });
    }
    if (formData.premiumAvailable) {
      fuelPrices.push({ type: 'premium', price: parseFloat(formData.premiumPrice), available: true });
    }
    if (formData.lpgAvailable) {
      fuelPrices.push({ type: 'lpg', price: parseFloat(formData.lpgPrice), available: true });
    }

    // Construire openingHours pour le backend: plusieurs entrées par jour possibles
  // Construire openingHours pour le backend
const openingHoursPayload: OpeningHour[] = [];

if (alwaysOpen) {
  // Mode 24/24 – 7j/7 : on crée 7 entrées identiques
  const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  daysOrder.forEach(day => {
    openingHoursPayload.push({
      day,
      open: '00:00',
      close: '23:59',
      isOpen: true,
    });
  });
} else {
  // Mode normal : par jour / créneau
  openingHoursForm.forEach(dayItem => {
    if (dayItem.closed) {
      // Jour fermé
      openingHoursPayload.push({
        day: dayItem.day,
        open: '00:00',
        close: '00:00',
        isOpen: false,
      });
    } else {
      dayItem.slots.forEach(slot => {
        if (slot.open && slot.close) {
          openingHoursPayload.push({
            day: dayItem.day,
            open: slot.open,
            close: slot.close,
            isOpen: true,
          });
        }
      });
    }
  });
}

    const stationData = {
      name: formData.name,
      address: formData.address,
      city: formData.city,
      country: 'Bénin', // Par défaut
      phoneNumber: formData.phoneNumber,
      longitude: parseFloat(formData.longitude),
      latitude: parseFloat(formData.latitude),
      fuelPrices,
      openingHours: openingHoursPayload,
      status: formData.isActive ? 'open' : 'closed',
      services: formData.services,
    };

    try {
      let stationId: string;
      
      // Créer ou mettre à jour la station
      if (editingStation) {
        const response = await api.stations.update(editingStation._id, stationData);
        console.log('✅ Station mise à jour:', response);
        stationId = editingStation._id;
      } else {
        const response = await api.stations.create(stationData);
        console.log('✅ Station créée:', response);
        console.log('📋 response.station:', response.station);
        console.log('📋 response.station._id:', response.station._id);
        stationId = response.station._id;
        console.log('🆔 stationId:', stationId);
      }

      // Uploader les photos si présentes
      if (selectedPhotos.length > 0) {
        console.log('📤 Upload de', selectedPhotos.length, 'photos...');
        const formDataPhotos = new FormData();
        selectedPhotos.forEach((photo, index) => {
          console.log(`  Photo ${index + 1}:`, photo.name, photo.size, 'bytes');
          formDataPhotos.append('photos', photo);
        });

        try {
          const photoResponse = await api.stations.uploadPhotos(stationId, formDataPhotos);
          console.log('✅ Photos uploadées:', photoResponse);
        } catch (photoError: any) {
          console.error('❌ Erreur upload photos:', photoError);
          console.error('Détails:', photoError.response?.data);
          // Afficher l'erreur mais continuer
          setAlertDialog({
            isOpen: true,
            title: 'Avertissement',
            message: `Station créée mais erreur lors de l'upload des photos: ${photoError.response?.data?.message || photoError.message}`,
            type: 'warning',
          });
          return; // Sortir pour ne pas afficher le message de succès
        }
      }

      setAlertDialog({
        isOpen: true,
        title: 'Succès',
        message: editingStation ? 'Station mise à jour avec succès' : 'Station créée avec succès',
        type: 'success',
      });
      
      handleCloseModal();
      loadStations();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de l\'enregistrement',
        type: 'danger',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer la station',
      message: `Êtes-vous sûr de vouloir supprimer la station "${name}" ?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.stations.delete(id);
          setAlertDialog({
            isOpen: true,
            title: 'Succès',
            message: 'Station supprimée avec succès',
            type: 'success',
          });
          loadStations();
        } catch (error) {
          setAlertDialog({
            isOpen: true,
            title: 'Erreur',
            message: 'Erreur lors de la suppression',
            type: 'danger',
          });
        }
      },
    });
  };

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des stations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Stations</h1>
          <p className="text-gray-600 mt-1">{filteredStations.length} station(s) {userRole === 'gestion' ? 'assignée(s)' : 'enregistrée(s)'}</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Station
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, ville ou adresse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStations.map((station) => (
          <div key={station._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{station.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{station.city}</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    station.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {station.status === 'open' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{station.address}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{station.phoneNumber}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{formatOpeningHours(station.openingHours)}</span>
              </div>

              {/* Fuels */}
              {station.fuelPrices && station.fuelPrices.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Fuel className="w-4 h-4" />
                    <span>Carburants</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {station.fuelPrices.filter(f => f.available).map((fuel) => (
                      <div
                        key={fuel.type}
                        className={`${fuelColors[fuel.type as keyof typeof fuelColors].bg} ${fuelColors[fuel.type as keyof typeof fuelColors].text} px-3 py-1.5 rounded text-xs font-medium`}
                      >
                        {fuelLabels[fuel.type as keyof typeof fuelLabels]}: {fuel.price} FCFA/L
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {station.services && station.services.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Services</p>
                  <div className="flex flex-wrap gap-1">
                    {station.services.slice(0, 3).map((service, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {service}
                      </span>
                    ))}
                    {station.services.length > 3 && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        +{station.services.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => handleOpenModal(station)}
                className={`${userRole === 'gestion' ? 'flex-1' : 'flex-1'} flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition`}
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => handleDelete(station._id, station.name)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredStations.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">Aucune station trouvée</p>
        </div>
      )}

   
            {/* Modal */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingStation ? 'Modifier la station' : 'Créer une nouvelle station'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="px-6 py-4 space-y-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations générales */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de la station *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville *
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse *
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    {/* Horaires d'ouverture */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horaires d'ouverture
                      </label>


  {/* Option 24/24 7j/7 */}
  <label className="flex items-center gap-2 mb-3 cursor-pointer">
    <input
      type="checkbox"
      checked={alwaysOpen}
      onChange={(e) => setAlwaysOpen(e.target.checked)}
      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
    />
    <span className="text-sm text-gray-700">
      Ouvert 24h/24 – 7j/7
    </span>
  </label>

                {!alwaysOpen && (      <div className="space-y-4">
                        {openingHoursForm.map((dayItem, dayIndex) => (
                          <div
                            key={dayItem.day}
                            className="border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-800">{dayItem.day}</span>
                              <label className="flex items-center text-sm text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={dayItem.closed}
                                  onChange={(e) => {
                                    const updated = [...openingHoursForm];
                                    updated[dayIndex] = {
                                      ...updated[dayIndex],
                                      closed: e.target.checked,
                                      slots: e.target.checked
                                        ? []
                                        : (updated[dayIndex].slots.length
                                            ? updated[dayIndex].slots
                                            : [
                                                { open: '08:00', close: '12:30' },
                                                { open: '15:00', close: '18:30' },
                                              ]),
                                    };
                                    setOpeningHoursForm(updated);
                                  }}
                                  className="mr-2"
                                />
                                Fermé
                              </label>
                            </div>

                            {!dayItem.closed && (
                              <div className="space-y-2">
                                {dayItem.slots.map((slot, slotIndex) => (
                                  <div key={slotIndex} className="flex items-center space-x-2">
                                    <input
                                      type="time"
                                      value={slot.open}
                                      onChange={(e) => {
                                        const updated = [...openingHoursForm];
                                        updated[dayIndex].slots[slotIndex] = {
                                          ...updated[dayIndex].slots[slotIndex],
                                          open: e.target.value,
                                        };
                                        setOpeningHoursForm(updated);
                                      }}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    />
                                    <span className="text-gray-500">–</span>
                                    <input
                                      type="time"
                                      value={slot.close}
                                      onChange={(e) => {
                                        const updated = [...openingHoursForm];
                                        updated[dayIndex].slots[slotIndex] = {
                                          ...updated[dayIndex].slots[slotIndex],
                                          close: e.target.value,
                                        };
                                        setOpeningHoursForm(updated);
                                      }}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    />
                                    {dayItem.slots.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...openingHoursForm];
                                          updated[dayIndex] = {
                                            ...updated[dayIndex],
                                            slots: updated[dayIndex].slots.filter((_, i) => i !== slotIndex),
                                          };
                                          setOpeningHoursForm(updated);
                                        }}
                                        className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded"
                                      >
                                        Suppr.
                                      </button>
                                    )}
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...openingHoursForm];
                                    updated[dayIndex] = {
                                      ...updated[dayIndex],
                                      slots: [
                                        ...updated[dayIndex].slots,
                                        { open: '15:00', close: '18:30' },
                                      ],
                                    };
                                    setOpeningHoursForm(updated);
                                  }}
                                  className="mt-1 text-xs text-primary hover:underline"
                                >
                                  + Ajouter un créneau
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      )}
                    </div>
                  </div>
                </div>

                       {/* Localisation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Localisation GPS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="Ex: 2.366830"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="Ex: 6.366555"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Carburants */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Carburants disponibles</h3>
                <div className="space-y-4">
                  {/* Essence */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.gasolineAvailable}
                        onChange={(e) => setFormData({ ...formData, gasolineAvailable: e.target.checked })}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">Essence</span>
                    </label>
                    {formData.gasolineAvailable && (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gasolinePrice}
                        onChange={(e) => setFormData({ ...formData, gasolinePrice: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="Prix (FCFA/L)"
                        required
                      />
                    )}
                  </div>

                  {/* Diesel */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.dieselAvailable}
                        onChange={(e) => setFormData({ ...formData, dieselAvailable: e.target.checked })}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">Diesel</span>
                    </label>
                    {formData.dieselAvailable && (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.dieselPrice}
                        onChange={(e) => setFormData({ ...formData, dieselPrice: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="Prix (FCFA/L)"
                        required
                      />
                    )}
                  </div>

                  {/* Premium */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.premiumAvailable}
                        onChange={(e) => setFormData({ ...formData, premiumAvailable: e.target.checked })}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">Premium</span>
                    </label>
                    {formData.premiumAvailable && (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.premiumPrice}
                        onChange={(e) => setFormData({ ...formData, premiumPrice: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="Prix (FCFA/L)"
                        required
                      />
                    )}
                  </div>

                  {/* GPL */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.lpgAvailable}
                        onChange={(e) => setFormData({ ...formData, lpgAvailable: e.target.checked })}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">GPL</span>
                    </label>
                    {formData.lpgAvailable && (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.lpgPrice}
                        onChange={(e) => setFormData({ ...formData, lpgPrice: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="Prix (FCFA/L)"
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Services disponibles</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableServices.map((service) => (
                    <label key={service} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service)}
                        onChange={() => toggleService(service)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos de la station</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 transition">
                      <Upload className="w-5 h-5" />
                      <span>Ajouter des photos</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        multiple
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                    <span className="text-sm text-gray-500">
                      {selectedPhotos.length}/10 photos (max 5MB chacune)
                    </span>
                  </div>

                  {/* Preview des photos */}
                  {photoPreviewUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {photoPreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Station active</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {editingStation ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
              </form>
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
