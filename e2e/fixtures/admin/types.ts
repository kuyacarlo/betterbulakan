/**
 * Admin API response shapes, copied from the Pages Functions handlers.
 * Keep these in sync with the source files named on each block so the
 * mocks exercise the same UI code paths as the real backend.
 */

import type { UserRole } from '../../../functions/utils/rbac';

// functions/utils/admin-auth.ts
export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string | null;
  avatar_url: string;
}

// functions/api/admin/auth/session.ts
export type SessionResponse =
  | { authenticated: true; user: GitHubUser; role: UserRole }
  | { authenticated: false; expired?: boolean };

// functions/api/admin/stats.ts
export interface DashboardStats {
  review_queue: {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
  };
  documents: { total: number; pending_review: number; processed: number };
  errors: { total: number; recent: number };
  conflicts: { active: number };
  deletion_queue: { total: number };
}

// functions/api/admin/recent-activity.ts
export interface RecentActivityItem {
  id: string;
  item_type: 'document' | 'session' | 'attendance';
  item_id: string;
  issue_type: string;
  description: string | null;
  resolved_at: string;
  assigned_to: string | null;
  resolution: string | null;
  document?: { id: string; type: string; number: string; title: string };
}

// functions/api/admin/documents/index.ts (GET list)
export interface AdminDocument {
  id: string;
  type: 'ordinance' | 'resolution' | 'executive_order';
  number: string;
  title: string;
  date_enacted: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  review_status: 'pending' | 'in_review' | 'approved';
  pdf_url: string;
  created_at: string;
  updated_at: string;
}

export interface OffsetPagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// functions/api/admin/errors.ts
export interface ParseError {
  id: string;
  document_number?: string;
  pdf_url: string;
  error_type: string;
  error_message: string;
  timestamp: string;
  stage: 'scrape' | 'download' | 'parse' | 'extract' | 'migrate';
}

// functions/api/admin/audit-logs.ts
export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

// functions/api/admin/review-queue/index.ts
export type ReviewStatus = 'pending' | 'in_progress' | 'resolved' | 'skipped';

export interface ReviewItem {
  id: string;
  item_type: 'document' | 'session' | 'attendance';
  item_id: string;
  issue_type: string;
  description: string | null;
  source_type: 'pdf' | 'facebook' | 'manual' | 'other';
  source_url: string | null;
  status: ReviewStatus;
  assigned_to: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  document?: {
    id: string;
    type: string;
    number: string;
    title: string;
    pdf_url: string;
  };
}

// functions/api/admin/reconcile.ts
export interface ConflictRecord {
  id: string;
  document_id: string;
  conflict_type: 'moved_by' | 'seconded_by' | 'authors' | 'title' | 'none';
  facebook_value: string | null;
  govph_value: string | null;
  resolved_value: string | null;
  status: 'unresolved' | 'resolved' | 'skipped';
  notes: string | null;
  created_at: string;
  resolved_at: string | null;
  document?: {
    id: string;
    type: string;
    number: string;
    title: string;
    pdf_url: string;
  };
}
