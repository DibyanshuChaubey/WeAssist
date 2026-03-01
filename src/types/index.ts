export type Status = 'reported' | 'in_progress' | 'resolved_by_admin' | 'closed';
export type Priority = 'high' | 'medium' | 'low';
export type Category = 'plumbing' | 'wifi' | 'electrical' | 'cleanliness' | 'maintenance' | 'security' | 'other';

export type UserRole = 'student' | 'admin';

export type EventType = 'cultural' | 'sports';
export type SportsType = 'cricket' | 'badminton' | 'volleyball' | 'football' | 'table-tennis' | 'basketball' | 'other';
export type RegistrationStatus = 'upcoming' | 'open' | 'closed';

export type UserStatus = 'pending_verification' | 'verified';
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hostel?: string;
  status: UserStatus;
  verified: boolean;
}

export interface AdminNote {
  id?: string;
  adminId: string;
  adminName: string;
  content: string;
  timestamp: string;
}

export interface EventRegistration {
  eventId: string;
  userId: string;
  registeredDate: string;
  status: 'confirmed' | 'cancelled';
}

export interface HostelIssue {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  priority?: Priority;
  priorityFinal?: Priority;
  priorityAiSuggested?: Priority;
  aiReason?: string;
  reporterId: string;
  reporterName: string;
  reportedDate: string;
  updatedDate: string;
  location: {
    hostel: string;
    floor: number;
    room: string;
  };
  adminNotes?: AdminNote[];
  statusLogs?: any[];
  resolvedByAdminDate?: string;
  confirmedByReporterDate?: string;
  comments?: number;
  tags?: string[];
}

export interface HostelEvent {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  sportsType?: SportsType;
  date: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  registrationStatus: RegistrationStatus;
  registeredCount?: number;
  totalSlots?: number;
  organizer?: string;
  tags?: string[];
  imageUrl?: string;
}