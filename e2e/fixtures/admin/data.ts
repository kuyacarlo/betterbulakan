/**
 * Seed data for the mocked admin API. Values are fictional but shaped like
 * real D1 rows after each handler's mapping (see ./types.ts).
 */

import { UserRole } from '../../../functions/utils/rbac';
import type {
  AdminDocument,
  AuditLogEntry,
  ConflictRecord,
  GitHubUser,
  ParseError,
  ReviewItem,
} from './types';

// One GitHub identity per RBAC role
export const adminUsers: Record<UserRole, GitHubUser> = {
  [UserRole.ADMIN]: {
    id: 9001,
    login: 'e2e-admin',
    name: 'E2E Admin',
    email: 'admin@example.test',
    avatar_url: 'https://avatars.githubusercontent.com/u/9001?v=4',
  },
  [UserRole.EDITOR]: {
    id: 9002,
    login: 'e2e-editor',
    name: 'E2E Editor',
    email: null,
    avatar_url: 'https://avatars.githubusercontent.com/u/9002?v=4',
  },
  [UserRole.VIEWER]: {
    id: 9003,
    login: 'e2e-viewer',
    name: 'E2E Viewer',
    email: null,
    avatar_url: 'https://avatars.githubusercontent.com/u/9003?v=4',
  },
};

const PDF_BASE = 'https://bulakan.gov.ph/files';

export const documents: AdminDocument[] = [
  {
    id: 'ordinance_sb_12_2025-101',
    type: 'ordinance',
    number: '2025-101',
    title: 'An Ordinance Regulating Riverside Fish Pens',
    date_enacted: '2025-03-04',
    status: 'active',
    review_status: 'approved',
    pdf_url: `${PDF_BASE}/ordinances/2025-101.pdf`,
    created_at: '2025-03-05T02:00:00Z',
    updated_at: '2025-03-06T02:00:00Z',
  },
  {
    id: 'resolution_sb_12_2025-044',
    type: 'resolution',
    number: '2025-044',
    title: 'A Resolution Approving the Barangay Road Concreting Plan',
    date_enacted: '2025-02-18',
    status: 'active',
    review_status: 'in_review',
    pdf_url: `${PDF_BASE}/resolutions/2025-044.pdf`,
    created_at: '2025-02-19T02:00:00Z',
    updated_at: '2025-02-19T02:00:00Z',
  },
  {
    id: 'executive_order_2025-007',
    type: 'executive_order',
    number: '2025-007',
    title: 'Executive Order Creating the Flood Response Task Force',
    date_enacted: '2025-01-10',
    status: 'pending',
    review_status: 'pending',
    pdf_url: `${PDF_BASE}/executive-orders/2025-007.pdf`,
    created_at: '2025-01-11T02:00:00Z',
    updated_at: '2025-01-11T02:00:00Z',
  },
];

export const parseErrors: ParseError[] = [
  {
    id: 'err_001',
    document_number: '2025-099',
    pdf_url: `${PDF_BASE}/ordinances/2025-099.pdf`,
    error_type: 'ocr_low_confidence',
    error_message: 'OCR confidence 31% is below the 50% threshold',
    timestamp: '2025-03-10T08:15:00Z',
    stage: 'parse',
  },
  {
    id: 'err_002',
    pdf_url: `${PDF_BASE}/resolutions/2025-050.pdf`,
    error_type: 'http_404',
    error_message: 'PDF returned 404 Not Found',
    timestamp: '2025-03-09T22:40:00Z',
    stage: 'download',
  },
];

export const auditLogs: AuditLogEntry[] = [
  {
    id: 'audit_003',
    action: 'update_review_status',
    performedBy: 'e2e-admin',
    targetType: 'review_queue',
    targetId: 'rq_004',
    details: { new_status: 'resolved' },
    createdAt: '2025-03-11T03:00:00Z',
  },
  {
    id: 'audit_002',
    action: 'create_document',
    performedBy: 'e2e-editor',
    targetType: 'document',
    targetId: 'ordinance_sb_12_2025-101',
    details: { source: 'facebook' },
    createdAt: '2025-03-05T02:00:00Z',
  },
  {
    id: 'audit_001',
    action: 'login',
    performedBy: 'e2e-admin',
    targetType: 'user',
    targetId: 'e2e-admin',
    details: null,
    createdAt: '2025-03-05T01:55:00Z',
  },
];

export const reviewQueue: ReviewItem[] = [
  {
    id: 'rq_001',
    item_type: 'document',
    item_id: 'resolution_sb_12_2025-044',
    issue_type: 'missing_author',
    description: 'Could not match the author from extracted text',
    source_type: 'pdf',
    source_url: `${PDF_BASE}/resolutions/2025-044.pdf`,
    status: 'pending',
    assigned_to: null,
    resolution: null,
    created_at: '2025-03-10T09:00:00Z',
    resolved_at: null,
    document: {
      id: 'resolution_sb_12_2025-044',
      type: 'resolution',
      number: '2025-044',
      title: 'A Resolution Approving the Barangay Road Concreting Plan',
      pdf_url: `${PDF_BASE}/resolutions/2025-044.pdf`,
    },
  },
  {
    id: 'rq_002',
    item_type: 'session',
    item_id: 'sb_12_2025-03-04',
    issue_type: 'attendance_mismatch',
    description: 'Absent count differs between Facebook and gov.ph',
    source_type: 'facebook',
    source_url: null,
    status: 'pending',
    assigned_to: null,
    resolution: null,
    created_at: '2025-03-09T09:00:00Z',
    resolved_at: null,
  },
  {
    id: 'rq_003',
    item_type: 'document',
    item_id: 'executive_order_2025-007',
    issue_type: 'low_ocr_confidence',
    description: null,
    source_type: 'pdf',
    source_url: null,
    status: 'in_progress',
    assigned_to: 'e2e-admin',
    resolution: null,
    created_at: '2025-03-08T09:00:00Z',
    resolved_at: null,
    document: {
      id: 'executive_order_2025-007',
      type: 'executive_order',
      number: '2025-007',
      title: 'Executive Order Creating the Flood Response Task Force',
      pdf_url: `${PDF_BASE}/executive-orders/2025-007.pdf`,
    },
  },
  {
    id: 'rq_004',
    item_type: 'document',
    item_id: 'ordinance_sb_12_2025-101',
    issue_type: 'missing_date',
    description: 'Enactment date missing from PDF header',
    source_type: 'pdf',
    source_url: null,
    status: 'resolved',
    assigned_to: 'e2e-admin',
    resolution: 'Date taken from the session minutes',
    created_at: '2025-03-05T09:00:00Z',
    resolved_at: '2025-03-11T03:00:00Z',
    document: {
      id: 'ordinance_sb_12_2025-101',
      type: 'ordinance',
      number: '2025-101',
      title: 'An Ordinance Regulating Riverside Fish Pens',
      pdf_url: `${PDF_BASE}/ordinances/2025-101.pdf`,
    },
  },
];

export const conflicts: ConflictRecord[] = [
  {
    id: 'conflict_moved_by_resolution_sb_12_2025-044',
    document_id: 'resolution_sb_12_2025-044',
    conflict_type: 'moved_by',
    facebook_value: 'Hon. Maria Santos',
    govph_value: 'Hon. Jose Reyes',
    resolved_value: null,
    status: 'unresolved',
    notes: null,
    created_at: '2025-02-19T02:00:00Z',
    resolved_at: null,
    document: {
      id: 'resolution_sb_12_2025-044',
      type: 'resolution',
      number: '2025-044',
      title: 'A Resolution Approving the Barangay Road Concreting Plan',
      pdf_url: `${PDF_BASE}/resolutions/2025-044.pdf`,
    },
  },
  {
    id: 'conflict_moved_by_ordinance_sb_12_2025-101',
    document_id: 'ordinance_sb_12_2025-101',
    conflict_type: 'moved_by',
    facebook_value: 'Hon. Ana Cruz',
    govph_value: 'Hon. Ana C. Cruz',
    resolved_value: null,
    status: 'unresolved',
    notes: null,
    created_at: '2025-03-05T02:00:00Z',
    resolved_at: null,
    document: {
      id: 'ordinance_sb_12_2025-101',
      type: 'ordinance',
      number: '2025-101',
      title: 'An Ordinance Regulating Riverside Fish Pens',
      pdf_url: `${PDF_BASE}/ordinances/2025-101.pdf`,
    },
  },
];

// Persons soft-deleted and waiting in the deletion queue (count only)
export const deletionQueueTotal = 1;
