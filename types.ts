

export enum CarStatus {
  AVAILABLE = 'Available',
  BOOKED = 'Booked',
  MAINTENANCE = 'Maintenance',
  UNAVAILABLE = 'Unavailable'
}

export interface Car {
  id: string;
  model: string;
  brand: string;
  year: number;
  licensePlate: string;
  type: string;
  fuelType: string;
  pricePerDay: number;
  status: CarStatus;
  imageUrl: string;
  images?: string[];
  mileage?: number;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  inspectionExpiry?: string;
  features: string[];
  rating: number;
  securityDeposit?: number;
  traccarDeviceId?: string; // Device Identifier (e.g., IMEI)
}

export enum BookingStatus {
  ACTIVE = 'Active',
  UPCOMING = 'Upcoming',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface Booking {
  id: string;
  clientId?: string;
  carId?: string;
  clientName: string;
  clientAvatar?: string;
  carModel: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  depositAmount?: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  spent: number;
  rentalsCount: number;
  status: 'Active' | 'Blocked';
  avatar: string;
  idNumber?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licensePhoto?: string;
  idPhoto?: string;
}

export enum PaymentMethod {
  CASH = 'Cash',
  CREDIT_CARD = 'Credit Card',
  BANK_TRANSFER = 'Bank Transfer',
  CHECK = 'Check',
  ONLINE = 'Online (Stripe)'
}

export enum PaymentPurpose {
  RENTAL = 'Rental Fee',
  DEPOSIT = 'Security Deposit',
  EXTRA = 'Extra Charges',
  REFUND = 'Refund'
}

export enum PaymentStatus {
  PAID = 'Paid',
  PENDING = 'Pending',
  CLEARED = 'Cleared',
  BOUNCED = 'Bounced',
  REFUNDED = 'Refunded'
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  date: string;
  collectedBy: string;
  reference?: string;
  notes?: string;
  proofUrl?: string;
}

export interface ContractComment {
  id: string;
  date: string;
  text: string;
  user: string;
}

export interface Contract {
  id: string;
  bookingId: string;
  paymentId?: string;
  status: 'Draft' | 'Locked';
  customTerms?: string;
  createdAt: string;
  contractDate: string;
  language: 'en' | 'fr' | 'ar';
  comments: ContractComment[];
}

export interface GlobalSettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  logo: string;
  // Added fields
  minRentalDays?: number;
  depositPercentage?: number;
  taxRate?: number;
  cancellationPolicy?: string;
  acceptCash?: boolean;
  acceptCard?: boolean;
  acceptTransfer?: boolean;
  id?: number; // Database ID
  owner_id?: string;
  // Traccar Integration
  traccarUrl?: string;
  traccarUsername?: string;
  traccarPassword?: string;
}

// --- SUBSCRIPTION TYPES ---

export type PlanTier = 'free' | 'starter' | 'pro';
export type BillingCycle = 'monthly' | 'yearly';

export interface Subscription {
  plan: PlanTier;
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'expired';
  billingCycle: BillingCycle;
  trialStartDate: string; // ISO String
  nextBillingDate?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  username: string;
  avatar: string;
  role: string;
  preferences: {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  subscription?: Subscription;
}

export interface AppNotification {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  category: string;
  title: string;
  message: string;
  date: string;
  relatedId?: string;
  daysLeft?: number;
}

// --- GPS TRACKING TYPES ---

export interface GPSLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: number;
}

export interface Geofence {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number; // in meters
  color: string;
  active: boolean;
}

export interface TrackingVehicle extends Car {
  currentLocation: GPSLocation;
  history: GPSLocation[];
  ownerId: string; // For simulation of multiple owners
  driverName?: string;
  isIgnitionOn: boolean;
  batteryLevel: number;
  fuelLevel: number;
  lastUpdate?: string;
  isOnline?: boolean;
}

export interface AlertEvent {
  id: string;
  vehicleId: string;
  type: 'geofence_enter' | 'geofence_exit' | 'speeding';
  message: string;
  timestamp: number;
  read: boolean;
}

export type ViewState = 'dashboard' | 'cars' | 'add-car' | 'bookings' | 'clients' | 'settings' | 'payments' | 'notifications' | 'tracking' | 'documents';