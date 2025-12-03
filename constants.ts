
import { Car, CarStatus, Booking, BookingStatus, Client, Payment, PaymentMethod, PaymentPurpose, PaymentStatus } from './types';

export const MOCK_CARS: Car[] = [
  {
    id: '1',
    brand: 'Tesla',
    model: 'Model 3 Performance',
    year: 2024,
    licensePlate: 'ABC-1234',
    type: 'Sedan',
    fuelType: 'Electric',
    pricePerDay: 1200,
    status: CarStatus.AVAILABLE,
    imageUrl: 'https://picsum.photos/400/250?random=1',
    images: ['https://picsum.photos/400/250?random=1'],
    features: ['Autopilot', 'GPS', 'Bluetooth'],
    rating: 4.9,
    mileage: 15000,
    insuranceExpiry: '2025-01-01',
    registrationExpiry: '2025-05-01',
    inspectionExpiry: '2025-06-01',
    securityDeposit: 5000
  },
  {
    id: '2',
    brand: 'BMW',
    model: 'X5 M50i',
    year: 2023,
    licensePlate: 'XYZ-9876',
    type: 'SUV',
    fuelType: 'Petrol',
    pricePerDay: 1800,
    status: CarStatus.BOOKED,
    imageUrl: 'https://picsum.photos/400/250?random=2',
    images: ['https://picsum.photos/400/250?random=2'],
    features: ['Sunroof', 'Heated Seats', 'AWD'],
    rating: 4.7,
    mileage: 32000,
    insuranceExpiry: '2024-12-15',
    registrationExpiry: '2025-02-20',
    inspectionExpiry: '2025-03-10',
    securityDeposit: 8000
  },
  {
    id: '3',
    brand: 'Mercedes',
    model: 'C-Class AMG',
    year: 2023,
    licensePlate: 'MERC-555',
    type: 'Convertible',
    fuelType: 'Hybrid',
    pricePerDay: 1500,
    status: CarStatus.AVAILABLE,
    imageUrl: 'https://picsum.photos/400/250?random=3',
    images: ['https://picsum.photos/400/250?random=3'],
    features: ['Leather', 'Premium Audio'],
    rating: 4.8,
    mileage: 8000,
    insuranceExpiry: '2025-08-01',
    registrationExpiry: '2025-08-01',
    inspectionExpiry: '2025-09-01',
    securityDeposit: 6000
  },
  {
    id: '4',
    brand: 'Ford',
    model: 'Mustang GT',
    year: 2022,
    licensePlate: 'MUS-1967',
    type: 'Coupe',
    fuelType: 'Petrol',
    pricePerDay: 1350,
    status: CarStatus.MAINTENANCE,
    imageUrl: 'https://picsum.photos/400/250?random=4',
    images: ['https://picsum.photos/400/250?random=4'],
    features: ['V8 Engine', 'Sport Mode'],
    rating: 4.6,
    mileage: 45000,
    insuranceExpiry: '2024-11-30',
    registrationExpiry: '2024-12-15',
    inspectionExpiry: '2025-01-20',
    securityDeposit: 4000
  }
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'C-001',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '+1 (555) 123-4567',
    spent: 45000,
    rentalsCount: 12,
    status: 'Active',
    avatar: 'https://picsum.photos/100/100?random=10',
    idNumber: 'A1234567',
    licenseNumber: 'L-987654321',
    licenseExpiry: '2028-05-15'
  },
  {
    id: 'C-002',
    name: 'Robert Smith',
    email: 'robert.s@example.com',
    phone: '+1 (555) 987-6543',
    spent: 12000,
    rentalsCount: 3,
    status: 'Active',
    avatar: 'https://picsum.photos/100/100?random=11',
    idNumber: 'B7654321',
    licenseNumber: 'L-123456789',
    licenseExpiry: '2026-11-20'
  },
  {
    id: 'C-003',
    name: 'Michael Brown',
    email: 'mike.brown@test.com',
    phone: '+1 (555) 444-5555',
    spent: 0,
    rentalsCount: 0,
    status: 'Blocked',
    avatar: 'https://picsum.photos/100/100?random=12',
    idNumber: 'C9988776',
    licenseNumber: 'L-555555555',
    licenseExpiry: '2024-01-01'
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BK-001',
    clientId: 'C-001',
    carId: '1',
    clientName: 'Alice Johnson',
    clientAvatar: 'https://picsum.photos/100/100?random=10',
    carModel: 'Tesla Model 3',
    startDate: '2023-10-25',
    endDate: '2023-10-28',
    totalPrice: 3600,
    status: BookingStatus.ACTIVE,
    paymentStatus: 'Paid',
    depositAmount: 5000
  },
  {
    id: 'BK-002',
    clientId: 'C-002',
    carId: '2',
    clientName: 'Robert Smith',
    clientAvatar: 'https://picsum.photos/100/100?random=11',
    carModel: 'BMW X5',
    startDate: '2023-11-01',
    endDate: '2023-11-05',
    totalPrice: 9000,
    status: BookingStatus.UPCOMING,
    paymentStatus: 'Pending',
    depositAmount: 8000
  },
  {
    id: 'BK-003',
    clientId: 'C-001',
    carId: '4',
    clientName: 'Sarah Williams',
    clientAvatar: 'https://picsum.photos/100/100?random=12',
    carModel: 'Ford Mustang',
    startDate: '2023-10-10',
    endDate: '2023-10-12',
    totalPrice: 2700,
    status: BookingStatus.COMPLETED,
    paymentStatus: 'Paid',
    depositAmount: 4000
  }
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'PAY-101',
    bookingId: 'BK-002',
    amount: 8000,
    currency: 'MAD',
    method: PaymentMethod.CHECK,
    purpose: PaymentPurpose.DEPOSIT,
    status: PaymentStatus.PENDING,
    date: '2023-10-30',
    collectedBy: 'Admin User',
    reference: 'CHK-998877',
    notes: 'Check kept in safe'
  },
  {
    id: 'PAY-102',
    bookingId: 'BK-002',
    amount: 2000,
    currency: 'MAD',
    method: PaymentMethod.CASH,
    purpose: PaymentPurpose.RENTAL,
    status: PaymentStatus.PAID,
    date: '2023-10-30',
    collectedBy: 'Admin User',
    notes: 'Advance payment'
  },
  {
    id: 'PAY-103',
    bookingId: 'BK-001',
    amount: 5000,
    currency: 'MAD',
    method: PaymentMethod.CREDIT_CARD,
    purpose: PaymentPurpose.DEPOSIT,
    status: PaymentStatus.CLEARED,
    date: '2023-10-25',
    collectedBy: 'Manager',
    reference: 'TXN-554433'
  }
];

export const REVENUE_DATA = [
  { name: 'Jan', value: 120000 },
  { name: 'Feb', value: 145000 },
  { name: 'Mar', value: 130000 },
  { name: 'Apr', value: 170000 },
  { name: 'May', value: 165000 },
  { name: 'Jun', value: 210000 },
  { name: 'Jul', value: 240000 },
  { name: 'Aug', value: 235000 },
  { name: 'Sep', value: 250000 },
  { name: 'Oct', value: 220000 },
  { name: 'Nov', value: 190000 },
  { name: 'Dec', value: 260000 },
];