export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  TENANT = 'tenant',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PropertyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export interface UserProfile {
  uid: string;
  email?: string;
  phoneNumber?: string;
  role: UserRole;
  displayName: string;
  photoURL?: string;
  upiId?: string; // Only for owners
  bio?: string;
  governmentIdUrl?: string; // URL to uploaded ID
  verificationStatus?: VerificationStatus;
  verificationComment?: string;
  createdAt: number;
}

export interface Property {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerPhoto?: string;
  ownerUpiId?: string;
  title: string;
  description: string;
  location: {
    city: string;
    area: string;
    lat?: number;
    lng?: number;
  };
  address: string;
  price: number;
  type: 'room' | 'pg' | 'flat' | 'studio' | 'house';
  amenities: string[];
  images: string[];
  isAvailable: boolean;
  status: PropertyStatus;
  createdAt: number;
  rating?: number;
  reviewCount?: number;
}

export interface Booking {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  amount: number;
  createdAt: number;
  ownerUpiId?: string;
  ownerPhone?: string;
  paid?: boolean;
  paymentMethod?: 'upi' | 'card' | 'wallet';
  transactionId?: string;
  paymentDate?: number;
  updatedAt?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: number;
  typing?: Record<string, boolean>;
}

export interface Review {
  id: string;
  propertyId: string;
  tenantId: string;
  tenantName: string;
  tenantPhoto?: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'booking' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}
