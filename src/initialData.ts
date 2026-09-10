/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Visitor, Department, CMSConfig, AdminUser, DBClusterStatus } from './types';

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Recursos Humanos', count: 18 },
  { id: '2', name: 'Tecnología', count: 32 },
  { id: '3', name: 'Finanzas y Contabilidad', count: 12 },
  { id: '4', name: 'Operaciones y Logística', count: 25 },
  { id: '5', name: 'Ventas y Mercadeo', count: 14 },
  { id: '6', name: 'Dirección General', count: 8 },
  { id: '7', name: 'Servicio al Cliente', count: 22 }
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

// Current date in metadata is 2026-07-08 (Wednesday)
// Let's create realistic visits for the past week:
// July 2 (Thursday), July 3 (Friday), July 6 (Monday), July 7 (Tuesday), July 8 (Wednesday)
export const DEFAULT_VISITORS: Visitor[] = [
  // Thursday, July 2, 2026
  {
    id: 'vis-101',
    firstName: 'Carlos',
    lastName: 'Pérez',
    cedula: '001-1234567-8',
    department: 'Tecnología',
    hostName: 'Ing. Albert Santana',
    status: 'checked_out',
    checkInTime: '2026-07-02T08:15:00-07:00',
    checkOutTime: '2026-07-02T11:45:00-07:00',
    notes: 'Mantenimiento de servidores',
    credentialCode: 'DPV-20260702-8F2B'
  },
  {
    id: 'vis-102',
    firstName: 'Ana',
    lastName: 'Gómez',
    cedula: '402-2345678-1',
    department: 'Recursos Humanos',
    hostName: 'Lic. María Almonte',
    status: 'checked_out',
    checkInTime: '2026-07-02T09:30:00-07:00',
    checkOutTime: '2026-07-02T10:30:00-07:00',
    notes: 'Entrevista de trabajo',
    credentialCode: 'DPV-20260702-4A1C'
  },
  {
    id: 'vis-103',
    firstName: 'Juan',
    lastName: 'Martínez',
    cedula: '002-3456789-0',
    department: 'Finanzas y Contabilidad',
    hostName: 'Pedro Ramírez',
    status: 'checked_out',
    checkInTime: '2026-07-02T14:00:00-07:00',
    checkOutTime: '2026-07-02T15:30:00-07:00',
    notes: 'Auditoría externa',
    credentialCode: 'DPV-20260702-7D9E'
  },
  // Friday, July 3, 2026
  {
    id: 'vis-104',
    firstName: 'Patricia',
    lastName: 'Hernández',
    cedula: '001-9876543-2',
    department: 'Ventas y Mercadeo',
    hostName: 'Patricia Sosa',
    status: 'checked_out',
    checkInTime: '2026-07-03T09:00:00-07:00',
    checkOutTime: '2026-07-03T12:00:00-07:00',
    notes: 'Presentación de nueva propuesta de medios',
    credentialCode: 'DPV-20260703-9A2B'
  },
  {
    id: 'vis-105',
    firstName: 'José',
    lastName: 'Díaz',
    cedula: '054-4567890-3',
    department: 'Servicio al Cliente',
    hostName: 'Milagros Peña',
    status: 'checked_out',
    checkInTime: '2026-07-03T10:15:00-07:00',
    checkOutTime: '2026-07-03T11:00:00-07:00',
    notes: 'Reclamación de servicio',
    credentialCode: 'DPV-20260703-3D5F'
  },
  {
    id: 'vis-106',
    firstName: 'Laura',
    lastName: 'Sánchez',
    cedula: '402-3344556-9',
    department: 'Dirección General',
    hostName: 'Dr. Joan Bretón',
    status: 'checked_out',
    checkInTime: '2026-07-03T15:00:00-07:00',
    checkOutTime: '2026-07-03T16:30:00-07:00',
    notes: 'Firma de convenio institucional',
    credentialCode: 'DPV-20260703-1E6A'
  },
  // Monday, July 6, 2026
  {
    id: 'vis-107',
    firstName: 'Ricardo',
    lastName: 'Castillo',
    cedula: '001-8765432-1',
    department: 'Tecnología',
    hostName: 'Ing. Albert Santana',
    status: 'checked_out',
    checkInTime: '2026-07-06T08:45:00-07:00',
    checkOutTime: '2026-07-06T10:15:00-07:00',
    notes: 'Instalación de cableado estructurado',
    credentialCode: 'DPV-20260706-5C3E'
  },
  {
    id: 'vis-108',
    firstName: 'Elena',
    lastName: 'Mejía',
    cedula: '001-2233445-5',
    department: 'Recursos Humanos',
    hostName: 'Lic. María Almonte',
    status: 'checked_out',
    checkInTime: '2026-07-06T11:00:00-07:00',
    checkOutTime: '2026-07-06T12:30:00-07:00',
    notes: 'Reunión de inducción',
    credentialCode: 'DPV-20260706-4A7F'
  },
  {
    id: 'vis-109',
    firstName: 'Marcos',
    lastName: 'Arias',
    cedula: '402-5566778-8',
    department: 'Operaciones y Logística',
    hostName: 'Ing. Carlos Ortiz',
    status: 'checked_out',
    checkInTime: '2026-07-06T13:30:00-07:00',
    checkOutTime: '2026-07-06T15:00:00-07:00',
    notes: 'Despacho de mercancía',
    credentialCode: 'DPV-20260706-2F1D'
  },
  // Tuesday, July 7, 2026
  {
    id: 'vis-110',
    firstName: 'Esteban',
    lastName: 'Rosario',
    cedula: '001-7788990-4',
    department: 'Servicio al Cliente',
    hostName: 'Milagros Peña',
    status: 'checked_out',
    checkInTime: '2026-07-07T09:00:00-07:00',
    checkOutTime: '2026-07-07T10:00:00-07:00',
    notes: 'Retiro de carnet corporativo',
    credentialCode: 'DPV-20260707-6B4C'
  },
  {
    id: 'vis-111',
    firstName: 'Gabriela',
    lastName: 'Polanco',
    cedula: '002-8899112-3',
    department: 'Tecnología',
    hostName: 'Ing. Albert Santana',
    status: 'checked_out',
    checkInTime: '2026-07-07T10:30:00-07:00',
    checkOutTime: '2026-07-07T13:00:00-07:00',
    notes: 'Soporte técnico de software',
    credentialCode: 'DPV-20260707-8E5A'
  },
  {
    id: 'vis-112',
    firstName: 'Fernando',
    lastName: 'Cruz',
    cedula: '402-9900112-2',
    department: 'Finanzas y Contabilidad',
    hostName: 'Pedro Ramírez',
    status: 'checked_out',
    checkInTime: '2026-07-07T14:15:00-07:00',
    checkOutTime: '2026-07-07T15:45:00-07:00',
    notes: 'Entrega de facturas trimestrales',
    credentialCode: 'DPV-20260707-1D2C'
  },
  // Wednesday, July 8, 2026 (Today)
  {
    id: 'vis-113',
    firstName: 'Miguel',
    lastName: 'Vargas',
    cedula: '001-1122334-7',
    department: 'Tecnología',
    hostName: 'Ing. Albert Santana',
    status: 'checked_out',
    checkInTime: '2026-07-08T08:00:00-07:00',
    checkOutTime: '2026-07-08T09:45:00-07:00',
    notes: 'Revisión de enlaces de fibra óptica',
    credentialCode: 'DPV-20260708-3F4A'
  },
  {
    id: 'vis-114',
    firstName: 'Lucía',
    lastName: 'Brito',
    cedula: '402-4455667-3',
    department: 'Dirección General',
    hostName: 'Dr. Joan Bretón',
    status: 'inside',
    checkInTime: '2026-07-08T10:15:00-07:00',
    notes: 'Reunión de presupuesto anual',
    credentialCode: 'DPV-20260708-5A2C'
  },
  {
    id: 'vis-115',
    firstName: 'Francisco',
    lastName: 'Núñez',
    cedula: '001-5566778-2',
    department: 'Recursos Humanos',
    hostName: 'Lic. María Almonte',
    status: 'inside',
    checkInTime: '2026-07-08T11:00:00-07:00',
    notes: 'Entrega de documentos de nuevo ingreso',
    credentialCode: 'DPV-20260708-9C4D'
  }
];

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
