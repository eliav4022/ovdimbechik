export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYER = 'EMPLOYER',
  SEEKER = 'SEEKER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPPORT_AGENT = 'SUPPORT_AGENT',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
}

export enum UserStatus {
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  INACTIVE = 'inactive', // Kept for backward compatibility
  active = 'active', // Kept for backward compatibility
}

export interface User {
  id: string; // the primary ID as requested
  uid: string; // kept for Firebase auth & backward compatibility
  email: string;
  fullName: string; // added as requested
  displayName?: string; // kept for backward compatibility
  role: UserRole;
  status: UserStatus | 'Active' | 'Suspended';
  permissions: string[]; // required permissions array as requested
  photoURL?: string;
  phone?: string;
  bio?: string;
  companyName?: string;
  companyId?: string; // Links this user to a company
  isCompanyAdmin?: boolean; // Can manage company tokens
  companyDescription?: string;
  cvUrl?: string; // Kept for compatibility
  savedJobs?: string[]; // Kept for compatibility
  preferredCategories?: string[]; // Kept for compatibility
  lastLogin?: string; // Add lastLogin timestamp
  jobSeekingStatus?: 'active' | 'open' | 'inactive';
  preferredLocations?: string[];
  preferredDistance?: number;
  remoteOnly?: boolean;
  jobScope?: string[];
  isVerified?: boolean;
  credits?: number; // Kept for compatibility
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
  restoredAt?: string;
  restoredBy?: string;
  deleteReason?: string;
  assignedAdminId?: string;
}

export interface JobSeekerProfile {
  userId: string;
  bio?: string;
  cvUrl?: string;
  skills: string[];
  savedJobIds: string[];
}

export interface EmployerProfile {
  userId: string;
  position?: string;
  companyId?: string;
  isPrimaryContact: boolean;
}

export interface Company {
  id: string;
  name: string;
  employerId: string;
  industry: string;
  location: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  credits?: number; // Shared tokens for this company
  createdAt?: string;
  deletedAt?: string;
}

export enum PromotionLevel {
  REGULAR = 'regular',
  HIGHLIGHTED = 'highlighted',
  BOOSTED = 'boosted',
  TOP = 'top',
  HOT = 'hot',
  URGENT = 'urgent',
}

export enum JobType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  CONTRACT = 'Contract',
  FREELANCE = 'Freelance',
  INTERNSHIP = 'Internship',
  SHIFTS = 'Shifts',
}

export enum WorkMode {
  REMOTE = 'Remote',
  HYBRID = 'Hybrid',
  OFFICE = 'Office',
}

export enum ExperienceLevel {
  NO_EXPERIENCE = 'No Experience',
  JUNIOR = 'Junior',
  MIDDLE = 'Middle',
  SENIOR = 'Senior',
}

export enum JobStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  PAUSED = 'paused',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CLOSED = 'closed',
}

export interface BaseJob {
  id: string;
  employerId: string;
  ownerId?: string;
  companyId?: string;
  employerName?: string;
  title: string;
  description: string;
  companyName: string;
  companyDescription?: string;
  location: string;
  type: JobType;
  workMode?: WorkMode;
  experienceLevel?: ExperienceLevel;
  isImmediate?: boolean;
  isUrgent?: boolean;
  isRecommended?: boolean;
  isVerified?: boolean;
  promotionLevel?: PromotionLevel;
  views?: number;
  viewsCount?: number;
  applicationsCount?: number;
  category?: string;
  tags?: string[];
  pendingTags?: string[];
  hasPendingTags?: boolean;
  salary?: string;
  requireCV?: boolean;
  directContact?: string;
  isCasual?: boolean; // Kept for backward compatibility parsing
  status: JobStatus | 'Published' | 'Draft' | 'Archived';
  scheduledPublishDate?: string;
  scheduledRemovalDate?: string;
  scheduledPublishAt?: string;
  scheduledArchiveAt?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  deletedBy?: string;
  restoredAt?: string;
  restoredBy?: string;
  deleteReason?: string;
}

export interface LongTermJob extends BaseJob {
  jobCategoryType?: 'long-term';
}

export interface CasualJob extends BaseJob {
  jobCategoryType?: 'casual';
}

// Keeping Job as a union for backward compatibility where possible
export type Job = LongTermJob | CasualJob;

export enum ApplicationStatus {
  NEW = 'New',
  REVIEWING = 'Reviewing',
  INTERVIEW = 'Interview',
  HIRED = 'Hired',
  REJECTED = 'Rejected',
  // Below kept for backward compatibility
  IN_PROGRESS = 'in_progress',
  ACCEPTED = 'accepted',
  SUBMITTED = 'submitted', 
  VIEWED = 'viewed',
  SHORTLISTED = 'shortlisted',
  WITHDRAWN = 'withdrawn',
}

export interface Application {
  id: string;
  jobId: string;
  seekerId: string;
  employerId: string; // Deprecated
  ownerId?: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  cvUrl: string; // Kept for backward compatibility
  resumeUrl?: string; // Replaces cvUrl
  coverLetter?: string;
  status: ApplicationStatus;
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
  restoredAt?: string;
  restoredBy?: string;
  deleteReason?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
  jobCount?: number;
}

export interface JobReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetType: 'job' | 'user';
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'High' | 'Urgent';
  isResolved: boolean;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  status: 'NEW' | 'RESOLVED';
  createdAt: string;
}

export interface CreditTransaction {
  id: string;
  employerId: string;
  companyId?: string; // Optional if transferring to/from company
  amount: number;
  type: 'ALLOCATION' | 'USAGE' | 'BONUS' | 'ADMIN_ADDITION' | 'ADMIN_REDUCTION' | 'TRANSFER_TO_COMPANY' | 'TRANSFER_FROM_COMPANY' | 'TRANSFER_FROM_USER';
  createdAt: string;
}

export const getTxTypeLabel = (type: string) => {
    switch (type) {
        case 'ALLOCATION': return 'רכישת/הוספת קרדיטים';
        case 'ADMIN_ADDITION': return 'הוספת קרדיטים ע"י מנהל';
        case 'ADMIN_REDUCTION': return 'הסרת קרדיטים ע"י מנהל';
        case 'USAGE': return 'פרסום משרה';
        case 'TRANSFER_TO_COMPANY': return 'העברה לקופת החברה';
        case 'TRANSFER_FROM_COMPANY': return 'משיכה מקופת החברה';
        case 'TRANSFER_FROM_USER': return 'העברה ממעסיק ע"י מנהל';
        case 'BONUS': return 'בונוס / מתנה';
        default: return type;
    }
};

export const isPositiveTx = (type: string) => {
    return ['ALLOCATION', 'BONUS', 'ADMIN_ADDITION', 'TRANSFER_FROM_COMPANY', 'TRANSFER_FROM_USER'].includes(type);
};

export function calculateRemainingJobs(credits: number = 0): number {
  return Math.floor(credits / 5);
}
