export type CaseStatus = 'nuevo' | 'en_analisis' | 'en_proceso' | 'finalizado';
export const APPOINTMENT_TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
] as const;
export type LegacyTimeSlot = 'manana' | 'tarde';
export type AppointmentTimePreference = TimeSlot | LegacyTimeSlot;

export type TimeSlot = (typeof APPOINTMENT_TIME_SLOTS)[number];
export type AppointmentStatus = 'pendiente' | 'confirmada' | 'cancelada';

export interface AppointmentSlotAvailability {
  available: boolean;
  reserved: boolean;
  manuallyAvailable: boolean;
}

export interface AppointmentDayAvailability {
  date: string;
  slots: Record<TimeSlot, AppointmentSlotAvailability>;
}

export interface CaseRecord {
  id: string;
  case_code?: string;
  created_at: string;
  full_name: string;
  phone: string;
  email?: string | null;
  institution?: string | null;
  description: string;
  privacy_accepted: boolean;
  appointment_requested: boolean;
  appointment_status?: AppointmentStatus | null;
  preferred_date?: string | null;
  preferred_time_slot?: AppointmentTimePreference | null;
  status: CaseStatus;
  internal_notes?: string | null;
  ip_address?: string | null;
  files?: CaseFileRecord[];
  notes?: CaseNoteRecord[];
}

export interface CaseFileRecord {
  id: string;
  case_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  signedUrl?: string; // Generated on demand for admins
}

export interface CaseNoteRecord {
  id: string;
  case_id: string;
  author_id?: string | null;
  author_email?: string | null;
  content: string;
  created_at: string;
}

export type PostCategory = 'blog' | 'noticias';

export interface BlogPost {
  category?: PostCategory;
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  meta_description?: string;
  cover_image?: string | null;
  published: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  reading_time_minutes?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  created_at: string;
}
