/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Visitor {
  id: string;
  firstName: string;
  lastName: string;
  cedula: string;
  department: string;
  hostName: string;
  status: 'inside' | 'checked_out';
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  notes?: string;
  credentialCode?: string; // e.g. DPV-20260708-A4F2
  companyName?: string;
}

export interface RealtimeNotification {
  id: string;
  visitorName: string;
  hostName: string;
  department: string;
  timestamp: string;
  read: boolean;
}

export interface Department {
  id: string;
  name: string;
  count: number; // Used for analytics cache
}

export interface CMSConfig {
  welcomeTitle: string;
  welcomeSubtitle: string;
  announcement: string;
  showAnnouncement: boolean;
  receptionHours: string;
  allowedCapacity: number;
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'super_admin' | 'security_guard' | 'operator';
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  createdAt: string;
}

export interface DBClusterStatus {
  region: string;
  status: 'healthy' | 'replicating' | 'syncing';
  latency: number; // in ms
  activeConnections: number;
  lastSync: string;
}
