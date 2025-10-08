export interface Review {
  id?: string;
  bookingId: string;
  cleanerId: string;
  userId?: string | null;
  userEmail: string;
  userName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

export interface ReviewRequest {
  id?: string;
  bookingId: string;
  cleanerId: string;
  userId?: string | null;
  userEmail: string;
  userName: string;
  serviceDate: string;
  token: string; // Unique token for non-login access
  emailSent: boolean;
  emailSentAt?: Date | null;
  reviewSubmitted: boolean;
  createdAt: Date;
}
