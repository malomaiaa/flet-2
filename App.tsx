import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';
import Cars from './components/Cars';
import AddCar from './components/AddCar';
import Bookings from './components/Bookings';
import Clients from './components/Clients';
import Payments from './components/Payments';
import Settings from './components/Settings';
import Login from './components/Login';
import Notifications from './components/Notifications';
import LiveTracking from './components/LiveTracking';
import Documents from './components/Documents';
import SubscriptionModal from './components/SubscriptionModal';
import { ViewState, Car, Booking, Client, Payment, BookingStatus, CarStatus, GlobalSettings, UserProfile, AppNotification, PaymentMethod, PaymentPurpose, PaymentStatus, Contract } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

// Define the order of menu items to determine animation direction
const MENU_ORDER: ViewState[] = [
  'dashboard',
  'tracking',
  'cars', // add-car is treated as sub-view of cars
  'bookings',
  'clients',
  'documents',
  'payments',
  'settings'
];

const getErrorText = (err: any) => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err.message && typeof err.message === 'string') return err.message;
  if (err.details && typeof err.details === 'string') return err.details;
  if (err.hint && typeof err.hint === 'string') return err.hint;
  try {
    return JSON.stringify(err);
  } catch (e) {
    return 'Error object could not be stringified';
  }
};

const AppContent: React.FC = () => {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const lastUserId = useRef<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Admin User',
    username: 'admin',
    email: 'admin@fleetcommand.ma',
    phone: '+212 600 000 000',
    role: 'Administrator',
    avatar: 'https://picsum.photos/100/100?random=99',
    preferences: {
      language: 'en',
      timezone: 'Africa/Casablanca',
      emailNotifications: true,
      smsNotifications: false
    }
  });

  // App State
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [animationDirection, setAnimationDirection] = useState<'up' | 'down'>('up');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [shouldOpenBookingModal, setShouldOpenBookingModal] = useState(false);

  // Data State
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | undefined>(undefined);

  // Global App Settings State
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    companyName: 'FleetCommand Rentals',
    address: '123 Blvd Massira Al Khadra, Casablanca',
    phone: '+212 600 000 000',
    email: 'contact@fleetcommand.ma',
    currency: 'MAD',
    timezone: 'Africa/Casablanca',
    logo: '',
    minRentalDays: 1,
    depositPercentage: 10,
    taxRate: 20,
    cancellationPolicy: '',
    acceptCash: true,
    acceptCard: true,
    acceptTransfer: true,
    traccarUrl: '',
    traccarUsername: '',
    traccarPassword: ''
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const { t, language } = useLanguage();
  const { checkAccess, updateUsage } = useSubscription();

  // --- VIEW NAVIGATION HANDLER ---
  const handleViewChange = (newView: ViewState) => {
    if (newView === currentView) return;
    let oldIndex = MENU_ORDER.indexOf(currentView);
    let newIndex = MENU_ORDER.indexOf(newView);
    if (currentView === 'add-car') oldIndex = MENU_ORDER.indexOf('cars');
    if (newView === 'add-car') newIndex = MENU_ORDER.indexOf('cars');
    if (currentView === 'notifications') oldIndex = -1;
    if (newView === 'notifications') newIndex = -1;

    if (newIndex > oldIndex) {
      setAnimationDirection('up');
    } else {
      setAnimationDirection('down');
    }
    setCurrentView(newView);
    setIsSidebarOpen(false);
  };

  const fetchData = async (currentUserId?: string, showLoader: boolean = true) => {
    const activeUserId = currentUserId || userId;
    if (!activeUserId) return;

    if (showLoader) setIsLoading(true);
    try {
      // 1. Fetch Cars
      const { data: carsData, error: carsError } = await supabase.from('cars').select('*');
      if (carsError) throw carsError;
      
      let mappedCars: Car[] = (carsData || []).map((c: any) => ({
        id: c.id,
        brand: c.brand,
        model: c.model,
        year: c.year,
        licensePlate: c.license_plate,
        status: c.status as CarStatus,
        pricePerDay: c.price_per_day,
        imageUrl: c.image_url,
        features: c.features || [],
        rating: c.rating || 5,
        fuelType: c.fuel_type,
        type: c.type,
        insuranceExpiry: c.insurance_expiry || '2025-01-01', 
        registrationExpiry: c.registration_expiry || '2025-01-01',
        inspectionExpiry: c.inspection_expiry || '2025-01-01',
        mileage: c.mileage,
        securityDeposit: c.security_deposit,
        traccarDeviceId: c.traccar_device_id
      }));

      // Update Usage for limits
      updateUsage('cars', mappedCars.length);

      // 2. Fetch Clients
      const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*');
      if (clientsError) throw clientsError;

      const mappedClients: Client[] = (clientsData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatar: c.avatar || 'https://picsum.photos/100/100',
        status: c.status,
        licenseNumber: c.license_number,
        idNumber: c.id_number || '',
        licenseExpiry: c.license_expiry || '',
        idPhoto: c.id_photo || '',
        licensePhoto: c.license_photo || '',
        spent: c.spent || 0, 
        rentalsCount: c.rentals_count || 0
      }));
      setClients(mappedClients);

      // 3. Fetch Bookings
      const { data: bookingsData, error: bookingsError } = await supabase.from('bookings').select(`
        *,
        clients (name, avatar),
        cars (model, brand)
      `);
      if (bookingsError) throw bookingsError;

      let mappedBookings: Booking[] = (bookingsData || []).map((b: any) => ({
        id: b.id,
        clientId: b.client_id,
        carId: b.car_id,
        clientName: b.clients?.name || 'Unknown',
        clientAvatar: b.clients?.avatar || '',
        carModel: b.cars ? `${b.cars.brand} ${b.cars.model}` : 'Unknown Car',
        startDate: b.start_date,
        endDate: b.end_date,
        totalPrice: b.total_price,
        status: b.status as BookingStatus,
        paymentStatus: b.payment_status
      }));

      // 4. Fetch Payments
      const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('*');
      let mappedPayments: Payment[] = [];
      if (paymentsError) {
         console.warn("Payments fetch error:", paymentsError);
      } else {
         mappedPayments = (paymentsData || []).map((p: any) => ({
            id: p.id,
            bookingId: p.booking_id,
            amount: p.amount,
            currency: p.currency,
            method: p.method as PaymentMethod,
            purpose: p.purpose as PaymentPurpose,
            status: p.status as PaymentStatus,
            date: p.date,
            collectedBy: p.collected_by,
            reference: p.reference,
            notes: p.notes,
            proofUrl: p.proof_url
         }));
         setPayments(mappedPayments);
      }

      // --- AUTOMATED STATUS LOGIC ---
      const today = new Date().toISOString().split('T')[0];
      const updates: { id: string, status: BookingStatus, carId?: string }[] = [];

      mappedBookings = mappedBookings.map(b => {
        let newStatus = b.status;
        let changed = false;
        
        const paid = mappedPayments
           .filter(p => p.bookingId === b.id && (p.status === 'Paid' || p.status === 'Cleared'))
           .reduce((sum, p) => sum + p.amount, 0);

        // Rule 1: Upcoming -> Active (If date arrived & paid)
        if (b.status === BookingStatus.UPCOMING) {
           if (b.startDate <= today && paid > 0) {
             newStatus = BookingStatus.ACTIVE;
             changed = true;
           }
        }
        
        // Rule 2: Active -> Completed (If end date passed)
        if (b.status === BookingStatus.ACTIVE) {
           if (b.endDate < today) {
             newStatus = BookingStatus.COMPLETED;
             changed = true;
           }
        }

        if (changed) {
           updates.push({ id: b.id, status: newStatus, carId: b.carId });
           return { ...b, status: newStatus };
        }
        return b;
      });

      // Execute Updates in Background
      if (updates.length > 0) {
        for (const update of updates) {
           await supabase.from('bookings').update({ status: update.status }).eq('id', update.id);
        }
      }

      // --- SYNC CAR STATUS ---
      // If there is ANY 'Active' or 'Upcoming' booking for a car, it should be marked 'Booked'
      const bookedCarIds = new Set<string>();
      mappedBookings.forEach(b => {
        if (b.status === BookingStatus.ACTIVE || b.status === BookingStatus.UPCOMING) {
            if (b.carId) bookedCarIds.add(b.carId);
        }
      });

      const carUpdates: any[] = [];
      mappedCars = mappedCars.map(c => {
        let newStatus = c.status;
        // If it's supposed to be booked but isn't
        if (bookedCarIds.has(c.id) && c.status === CarStatus.AVAILABLE) {
            newStatus = CarStatus.BOOKED;
            carUpdates.push(supabase.from('cars').update({ status: CarStatus.BOOKED }).eq('id', c.id));
        }
        // If it's booked but has no active/upcoming bookings (and not maintenance/unavailable)
        else if (!bookedCarIds.has(c.id) && c.status === CarStatus.BOOKED) {
            newStatus = CarStatus.AVAILABLE;
            carUpdates.push(supabase.from('cars').update({ status: CarStatus.AVAILABLE }).eq('id', c.id));
        }
        return { ...c, status: newStatus };
      });
      if (carUpdates.length > 0) await Promise.all(carUpdates);

      setBookings(mappedBookings);
      setCars(mappedCars);

      // 5. Fetch Contracts
      const { data: contractsData, error: contractsError } = await supabase.from('contracts').select('*');
      if (!contractsError && contractsData) {
        const mappedContracts: Contract[] = contractsData.map((c: any) => ({
          id: c.id,
          bookingId: c.booking_id,
          paymentId: c.payment_id,
          status: c.status,
          customTerms: c.custom_terms,
          createdAt: c.created_at,
          contractDate: c.contract_date,
          language: c.language || 'en', // Include language
          comments: []
        }));
        setContracts(mappedContracts);
      }

      generateNotifications(mappedCars, mappedBookings);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const checkUser = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        const sessionPromise = supabase.auth.getSession();
        const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const session = data?.session;

        if (mounted && session) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          lastUserId.current = session.user.id;
          
          await Promise.all([
            fetchProfile(session.user.id),
            fetchSettings(session.user.id),
            fetchData(session.user.id, true) 
          ]);
        }
      } catch (error) {
        console.warn("Auth check failed or timed out:", error);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session) {
        const currentUser = session.user.id;
        const isSameUser = lastUserId.current === currentUser;

        setIsAuthenticated(true);
        setUserId(currentUser);
        lastUserId.current = currentUser;

        // If user is same (tab switch or token refresh), do background update (no loader)
        if (isSameUser) {
           if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
             fetchData(currentUser, false); 
           }
        } else {
           // New login or different user
           fetchProfile(currentUser);
           fetchSettings(currentUser);
           fetchData(currentUser, true);
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        lastUserId.current = null;
        setCars([]);
        setBookings([]);
        setClients([]);
        setPayments([]);
        setContracts([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserId(null);
    lastUserId.current = null;
    setCars([]);
    setBookings([]);
    setClients([]);
    setPayments([]);
    setContracts([]);
    setUserProfile({
      name: 'Admin User',
      username: 'admin',
      email: '',
      phone: '',
      role: 'Administrator',
      avatar: 'https://picsum.photos/100/100?random=99',
      preferences: {
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        smsNotifications: false
      }
    });
    setCurrentView('dashboard');
  };

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (data) {
        setUserProfile(prev => ({
          ...prev,
          name: data.name || prev.name,
          username: data.username || prev.username,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          role: data.role || prev.role,
          avatar: data.avatar || prev.avatar,
          preferences: data.preferences || prev.preferences
        }));
      }
    } catch (error) {
      console.error("Unexpected error loading profile:", error);
    }
  };

  const fetchSettings = async (uid?: string) => {
    try {
      const { data, error } = await supabase.from('settings').select('*').limit(1).single();
      if (data) {
        setGlobalSettings({
          companyName: data.company_name || 'FleetCommand Rentals',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          currency: data.currency || 'MAD',
          timezone: data.timezone || 'Africa/Casablanca',
          logo: data.logo || '',
          minRentalDays: data.min_rental_days || 1,
          depositPercentage: data.deposit_percentage || 10,
          taxRate: data.tax_rate || 20,
          cancellationPolicy: data.cancellation_policy || '',
          acceptCash: data.accept_cash ?? true,
          acceptCard: data.accept_card ?? true,
          acceptTransfer: data.accept_transfer ?? true,
          traccarUrl: data.traccar_url || '',
          traccarUsername: data.traccar_username || '',
          traccarPassword: data.traccar_password || ''
        });
      }
    } catch (error) {
      console.warn("Settings fetch error (table might be empty or missing):", error);
    }
  };

  const generateNotifications = (currentCars: Car[], currentBookings: Booking[]) => {
    const alerts: AppNotification[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    currentBookings.forEach(booking => {
       if (booking.status === BookingStatus.ACTIVE) {
         const endDate = new Date(booking.endDate);
         const diffTime = endDate.getTime() - today.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

         if (diffDays <= 1 && diffDays >= 0) {
            alerts.push({
              id: `${booking.id}-return`,
              type: 'urgent',
              category: 'return',
              title: t('alerts.returnDue'),
              message: `${booking.clientName} - ${booking.carModel} (${diffDays === 0 ? t('alerts.today') : t('alerts.tomorrow')})`,
              date: booking.endDate,
              relatedId: booking.id,
              daysLeft: diffDays
            });
         }
       }
    });

    setNotifications(alerts);
  };

  const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- ACTIONS ---

  const handleAddCar = async (newCar: Car) => {
    if (!userId) return;
    
    // SUBSCRIPTION CHECK
    if (!editingCar && !checkAccess('add_car')) return;

    try {
      // Safe conversions for numeric fields
      const safePrice = isNaN(Number(newCar.pricePerDay)) ? 0 : Number(newCar.pricePerDay);
      const safeYear = isNaN(Number(newCar.year)) ? new Date().getFullYear() : Number(newCar.year);
      const safeMileage = newCar.mileage ? (isNaN(Number(newCar.mileage)) ? 0 : Number(newCar.mileage)) : 0;
      const safeDeposit = newCar.securityDeposit ? (isNaN(Number(newCar.securityDeposit)) ? 0 : Number(newCar.securityDeposit)) : 0;

      const carPayload = {
        id: newCar.id,
        owner_id: userId, 
        brand: newCar.brand,
        model: newCar.model,
        year: safeYear,
        license_plate: newCar.licensePlate,
        status: newCar.status,
        price_per_day: safePrice,
        image_url: newCar.imageUrl,
        features: newCar.features,
        rating: newCar.rating,
        fuel_type: newCar.fuelType,
        type: newCar.type,
        mileage: safeMileage,
        security_deposit: safeDeposit,
        // Convert empty strings to null for DATE and device ID columns
        insurance_expiry: newCar.insuranceExpiry || null,
        registration_expiry: newCar.registrationExpiry || null,
        inspection_expiry: newCar.inspectionExpiry || null,
        traccar_device_id: newCar.traccarDeviceId && newCar.traccarDeviceId.trim() !== '' ? newCar.traccarDeviceId.trim() : null 
      };

      let result;
      if (editingCar) {
         result = await supabase.from('cars').update(carPayload).eq('id', editingCar.id);
      } else {
         result = await supabase.from('cars').insert([carPayload]);
      }

      // HANDLE MISSING COLUMN ERROR (Schema not updated)
      if (result.error && result.error.code === 'PGRST204' && result.error.message.includes('traccar_device_id')) {
         console.warn("DB Schema mismatch: traccar_device_id column missing. Retrying without it.");
         // Remove the problematic field
         const { traccar_device_id, ...fallbackPayload } = carPayload;
         
         // Retry INSERT/UPDATE
         if (editingCar) {
            result = await supabase.from('cars').update(fallbackPayload).eq('id', editingCar.id);
         } else {
            result = await supabase.from('cars').insert([fallbackPayload]);
         }

         if (!result.error) {
            alert("Car saved successfully! However, the 'Traccar Device ID' was not saved because the database table is missing the 'traccar_device_id' column. Please run the SQL migration script to enable GPS features.");
         }
      }

      if (result.error) {
         console.error("Error saving car:", result.error);
         alert(`Error saving car: ${getErrorText(result.error)}`);
         return; 
      }

      fetchData(userId);
      setEditingCar(undefined);
      handleViewChange('cars');
    } catch (err: any) {
      console.error("Unexpected error in handleAddCar:", err);
      alert(`An unexpected error occurred: ${getErrorText(err)}`);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    openConfirmModal(t('deleteCar'), t('confirmDeleteCar'), async () => {
      const { error } = await supabase.from('cars').delete().eq('id', carId);
      if (!error) fetchData(userId!);
    });
  };

  const handleEditCarClick = (car: Car) => {
    setEditingCar(car);
    handleViewChange('add-car');
  };

  const handleAddBooking = async (newBooking: Booking) => {
    if (!userId) return;
    // SUBSCRIPTION CHECK
    if (!checkAccess('create_booking')) return;

    try {
      const payload = {
        id: newBooking.id,
        owner_id: userId,
        client_id: newBooking.clientId,
        car_id: newBooking.carId,
        start_date: newBooking.startDate,
        end_date: newBooking.endDate,
        total_price: newBooking.totalPrice,
        status: newBooking.status,
        payment_status: newBooking.paymentStatus
      };
      
      const { error } = await supabase.from('bookings').insert([payload]);
      if (error) {
        console.error("Error creating booking:", error);
        alert(`Failed to create booking: ${getErrorText(error)}`);
      } else {
        // Mark car as Booked immediately if Active OR Upcoming
        if (newBooking.status === BookingStatus.ACTIVE || newBooking.status === BookingStatus.UPCOMING) {
          await supabase.from('cars').update({ status: 'Booked' }).eq('id', newBooking.carId);
        }
        fetchData(userId);
      }
    } catch (error: any) {
      alert(`Error creating booking: ${getErrorText(error)}`);
    }
  };

  const handleUpdateBooking = (updatedBooking: Booking) => {
    console.log("Update Booking not fully implemented in UI but logic is similar to add");
  };

  const handleDeleteBooking = (bookingId: string) => {
    openConfirmModal(t('deleteBooking'), t('confirmDeleteBooking'), async () => {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (!error) fetchData(userId!);
    });
  };

  const handleAddClient = async (newClient: Client) => {
    if (!userId) return;

    const payload = {
      id: newClient.id,
      owner_id: userId, 
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone,
      license_number: newClient.licenseNumber,
      id_number: newClient.idNumber || null,
      license_expiry: newClient.licenseExpiry || null,
      id_photo: newClient.idPhoto || null,
      license_photo: newClient.licensePhoto || null,
      status: newClient.status,
      avatar: newClient.avatar
    };
    
    if (newClient.id && !newClient.id.startsWith('C-')) {
       const exists = clients.some(c => c.id === newClient.id);
       if (exists) {
          const { error } = await supabase.from('clients').update(payload).eq('id', newClient.id);
          if (error) console.error("Error updating client:", error);
          else fetchData(userId);
       } else {
          const { error } = await supabase.from('clients').insert([payload]);
          if (error) console.error("Error adding client:", error);
          else fetchData(userId);
       }
    } else {
       const { error } = await supabase.from('clients').insert([payload]);
       if (error) console.error("Error adding client:", error);
       else fetchData(userId);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    if (!userId) return;
    const payload = {
      name: updatedClient.name,
      email: updatedClient.email,
      phone: updatedClient.phone,
      license_number: updatedClient.licenseNumber,
      id_number: updatedClient.idNumber || null,
      license_expiry: updatedClient.licenseExpiry || null,
      id_photo: updatedClient.idPhoto || null,
      license_photo: updatedClient.licensePhoto || null,
      status: updatedClient.status,
      avatar: updatedClient.avatar
    };

    const { error } = await supabase.from('clients').update(payload).eq('id', updatedClient.id);
    if (error) console.error("Error updating client:", error);
    else fetchData(userId);
  };

  const handleDeleteClient = (clientId: string) => {
    openConfirmModal(t('deleteClient'), t('confirmDeleteClient'), async () => {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (!error) fetchData(userId!);
    });
  };

  const handleAddPayment = async (newPayment: Payment) => {
    if (!userId) return;

    const payload = {
       id: newPayment.id,
       owner_id: userId,
       booking_id: newPayment.bookingId,
       amount: newPayment.amount,
       currency: newPayment.currency,
       method: newPayment.method,
       purpose: newPayment.purpose,
       status: newPayment.status,
       date: newPayment.date,
       collected_by: userProfile.name, 
       reference: newPayment.reference,
       notes: newPayment.notes
    };

    const { error } = await supabase.from('payments').insert([payload]);
    if (!error) {
       fetchData(userId);
    } else {
       console.error("Error adding payment:", error);
       alert("Failed to save payment: " + getErrorText(error));
    }
  };

  const handleUpdatePayment = async (updatedPayment: Payment) => {
    if (!userId) return;
    const payload = {
       amount: updatedPayment.amount,
       method: updatedPayment.method,
       purpose: updatedPayment.purpose,
       status: updatedPayment.status,
       date: updatedPayment.date,
       reference: updatedPayment.reference,
       notes: updatedPayment.notes
    };
    const { error } = await supabase.from('payments').update(payload).eq('id', updatedPayment.id);
    if (!error) fetchData(userId);
  };

  const handleDeletePayment = (paymentId: string) => {
    openConfirmModal(t('deletePayment'), t('confirmDeletePayment'), async () => {
       const { error } = await supabase.from('payments').delete().eq('id', paymentId);
       if (!error) fetchData(userId!);
    });
  };

  const handleAddContract = async (newContract: Contract) => {
    if (!userId) return;
    // SUBSCRIPTION CHECK
    if (!checkAccess('generate_contract')) return;

    const payload = {
      id: newContract.id,
      owner_id: userId,
      booking_id: newContract.bookingId,
      payment_id: newContract.paymentId,
      status: newContract.status,
      custom_terms: newContract.customTerms,
      contract_date: newContract.contractDate,
      language: newContract.language // save language
    };
    const { error } = await supabase.from('contracts').insert([payload]);
    if (!error) fetchData(userId);
    else console.error("Error creating contract:", error);
  };

  const handleUpdateContract = async (updatedContract: Contract) => {
    if (!userId) return;
    // SUBSCRIPTION CHECK
    if (!checkAccess('generate_contract')) return;

    const payload = {
      status: updatedContract.status,
      custom_terms: updatedContract.customTerms,
      contract_date: updatedContract.contractDate,
      language: updatedContract.language
    };
    const { error } = await supabase.from('contracts').update(payload).eq('id', updatedContract.id);
    if (!error) fetchData(userId);
    else console.error("Error updating contract:", error);
  };

  const handleUpdateSettings = async (newSettings: GlobalSettings) => {
    if (!userId) return;
    setGlobalSettings(newSettings); 

    const payload = {
      company_name: newSettings.companyName,
      address: newSettings.address,
      phone: newSettings.phone,
      email: newSettings.email,
      currency: newSettings.currency,
      timezone: newSettings.timezone,
      logo: newSettings.logo,
      min_rental_days: newSettings.minRentalDays,
      deposit_percentage: newSettings.depositPercentage,
      tax_rate: newSettings.taxRate,
      cancellation_policy: newSettings.cancellationPolicy,
      accept_cash: newSettings.acceptCash,
      accept_card: newSettings.acceptCard,
      accept_transfer: newSettings.acceptTransfer,
      traccar_url: newSettings.traccarUrl,
      traccar_username: newSettings.traccarUsername,
      traccar_password: newSettings.traccarPassword
    };

    try {
      const { data } = await supabase.from('settings').select('id').limit(1).single();
      if (data) {
        await supabase.from('settings').update(payload).eq('id', data.id);
      } else {
        await supabase.from('settings').insert([{...payload, owner_id: userId}]);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleUpdateUser = async (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    if (userId) {
      const payload = {
        id: userId,
        name: updatedProfile.name || '',
        username: updatedProfile.username || '',
        email: updatedProfile.email || '',
        phone: updatedProfile.phone || '',
        avatar: updatedProfile.avatar || '',
        role: updatedProfile.role || 'Administrator',
        preferences: updatedProfile.preferences || {}
      };

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) console.error("Error updating profile:", error.message);
    }
  };

  const handleQuickCreateBooking = () => {
    // SUBSCRIPTION CHECK
    if (!checkAccess('create_booking')) return;

    handleViewChange('bookings');
    setShouldOpenBookingModal(true);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            cars={cars} 
            bookings={bookings} 
            payments={payments} 
            onNavigate={handleViewChange} 
            companyName={globalSettings.companyName}
            onCreateBooking={handleQuickCreateBooking}
          />
        );
      case 'tracking':
        return <LiveTracking initialCars={cars} settings={globalSettings} />;
      case 'cars':
        return <Cars cars={cars} onAddClick={() => { setEditingCar(undefined); handleViewChange('add-car'); }} onEditClick={handleEditCarClick} onDeleteClick={handleDeleteCar} />;
      case 'add-car':
        return <AddCar initialData={editingCar} onCancel={() => { setEditingCar(undefined); handleViewChange('cars'); }} onAddCar={handleAddCar} />;
      case 'bookings':
        return (
          <Bookings 
            bookings={bookings} 
            cars={cars} 
            clients={clients} 
            onAddBooking={handleAddBooking} 
            onUpdateBooking={handleUpdateBooking} 
            onDeleteBooking={handleDeleteBooking}
            autoOpenModal={shouldOpenBookingModal}
            onModalClose={() => setShouldOpenBookingModal(false)}
          />
        );
      case 'clients':
        return <Clients clients={clients} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} />;
      case 'payments':
        return <Payments bookings={bookings} payments={payments} onAddPayment={handleAddPayment} onUpdatePayment={handleUpdatePayment} onDeletePayment={handleDeletePayment} onDeleteBooking={handleDeleteBooking} />;
      case 'documents':
        return (
          <Documents 
            bookings={bookings} 
            payments={payments} 
            cars={cars} 
            clients={clients} 
            settings={globalSettings}
            contracts={contracts}
            onAddContract={handleAddContract}
            onUpdateContract={handleUpdateContract}
            onAddPayment={handleAddPayment}
          />
        );
      case 'notifications':
        return <Notifications notifications={notifications} onNavigate={handleViewChange} />;
      case 'settings':
        return <Settings settings={globalSettings} onUpdateSettings={handleUpdateSettings} user={userProfile} onUpdateUser={handleUpdateUser} />;
      default:
        return <Dashboard cars={cars} bookings={bookings} payments={payments} onNavigate={handleViewChange} companyName={globalSettings.companyName} onCreateBooking={handleQuickCreateBooking} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400 animate-spin" />
        <p className="text-gray-500 font-medium">Connecting to FleetCommand...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className={`flex min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-white transition-colors duration-300 ${language === 'ar' ? 'font-arabic' : 'font-sans'}`}>
      <Sidebar 
        currentView={currentView} 
        onChangeView={handleViewChange}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onSignOut={handleSignOut}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:ms-[88px]' : 'lg:ms-[280px]'}`}>
        <TopNav 
          title={t(`pageTitles.${currentView}`)} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          user={userProfile}
          onProfileClick={() => handleViewChange('settings')}
          notificationsCount={notifications.length}
          onNotificationClick={() => handleViewChange('notifications')}
        />
        
        <main className={`flex-1 p-6 lg:p-10 overflow-y-auto overflow-x-hidden ${currentView === 'tracking' ? 'p-0 lg:p-0' : ''}`}>
          {isLoading ? (
             <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
               <Loader2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400 animate-spin" />
               <p className="text-gray-500 font-bold tracking-widest text-xs uppercase">Syncing Database...</p>
             </div>
          ) : (
             <div 
                key={currentView}
                className={`${currentView === 'tracking' ? 'h-full' : 'max-w-[1600px]'} mx-auto ${animationDirection === 'up' ? 'animate-slide-up' : 'animate-slide-down'}`}
             >
               {renderContent()}
             </div>
          )}
        </main>
      </div>

      <SubscriptionModal />

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmModal(prev => ({...prev, isOpen: false}))}></div>
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/50">
               <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
                className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const MainApp = () => (
  <ThemeProvider>
    <LanguageProvider>
      <SubscriptionProvider>
        <AppContent />
      </SubscriptionProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default MainApp;