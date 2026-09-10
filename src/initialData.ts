/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Visitor, Department, CMSConfig, AdminUser, DBClusterStatus } from './types';

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Recursos Humanos', count: 0 },
  { id: '2', name: 'Tecnología', count: 0 },
  { id: '3', name: 'Finanzas y Contabilidad', count: 0 },
  { id: '4', name: 'Operaciones y Logística', count: 0 },
  { id: '5', name: 'Ventas y Mercadeo', count: 0 },
  { id: '6', name: 'Dirección General', count: 0 },
  { id: '7', name: 'Servicio al Cliente', count: 0 }
];

export const DEFAULT_CMS_CONFIG: CMSConfig = {
  welcomeTitle: "DP-VISITAS",
  welcomeSubtitle: "Sistema integral y seguro para el registro y control de accesos. Por favor, registre su entrada o salida en la recepción.",
  announcement: "AVISO: Toda visita debe portar su carnet de identificación en un lugar visible mientras permanezca en las instalaciones.",
  showAnnouncement: true,
  receptionHours: "Lunes a Viernes, 8:00 AM - 4:00 PM",
  allowedCapacity: 30
};

export const DEFAULT_ADMINS: AdminUser[] = [
  {
    id: 'adm-1',
    username: 'admin',
    fullName: 'Joan Bretón',
    email: 'joanbreton@gmail.com',
    role: 'super_admin',
    twoFactorEnabled: true,
    twoFactorSecret: 'DP-VISITAS-2FA-TOKEN-2026',
    createdAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'adm-2',
    username: 'mgarcia',
    fullName: 'Manuel García',
    email: 'm.garcia@corporativo.com',
    role: 'security_guard',
    twoFactorEnabled: false,
    twoFactorSecret: 'OFFLINE',
    createdAt: '2026-03-10T14:30:00Z'
  },
  {
    id: 'adm-3',
    username: 'lrodriguez',
    fullName: 'Laura Rodríguez',
    email: 'l.rodriguez@corporativo.com',
    role: 'operator',
    twoFactorEnabled: true,
    twoFactorSecret: 'DP-VISITAS-OPERATOR-2FA',
    createdAt: '2026-05-22T11:15:00Z'
  }
];

export const DEFAULT_VISITORS: Visitor[] = [];

export const DEFAULT_DB_CLUSTERS: DBClusterStatus[] = [
  {
    region: 'Google Cloud Firestore (bamboo-aleph-4dzmz)',
    status: 'healthy',
    latency: 9,
    activeConnections: 142,
    lastSync: 'En tiempo real'
  },
  {
    region: 'us-west2 (Multi-Región Cloud Spanner / Firestore)',
    status: 'healthy',
    latency: 16,
    activeConnections: 98,
    lastSync: 'Hace un momento'
  },
  {
    region: 'europe-west1 (Réplica de Contingencia Global)',
    status: 'healthy',
    latency: 58,
    activeConnections: 45,
    lastSync: 'Hace 4 segundos'
  }
];
