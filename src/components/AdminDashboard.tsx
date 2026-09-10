/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Users,
  Settings2,
  Database,
  Trash2,
  Search,
  Download,
  FileText,
  Plus,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  LogOut,
  Building,
  UserPlus,
  User,
  Briefcase,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Server,
  QrCode,
  ShieldCheck,
  Check,
  Copy,
  Bell,
  BellOff,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Visitor, AdminUser, Department } from '../types';

export const AdminDashboard: React.FC = () => {
  const {
    visitors,
    departments,
    cmsConfig,
    admins,
    currentAdmin,
    dbClusters,
    updateCMSConfig,
    addDepartment,
    removeDepartment,
    addAdmin,
    updateAdmin,
    deleteAdmin,
    deleteVisitorRecord,
    clearAllVisitors,
    logoutAdmin,
    simulateDbSync,
    checkoutVisitor,
    notifications,
    markNotificationAsRead,
    clearAllNotifications
  } = useApp();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'analytics' | 'visitors' | 'validator' | 'admins' | 'cms' | 'db_cluster'>('analytics');

  // Sorting state for visitors detailed history
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'dept_asc' | 'dept_desc'>('date_desc');

  // Visitor List Search and Filter states
  const [visitorSearch, setVisitorSearch] = useState('');
  const [visitorDeptFilter, setVisitorDeptFilter] = useState('');
  const [visitorStatusFilter, setVisitorStatusFilter] = useState('');

  // Department Management state
  const [newDeptName, setNewDeptName] = useState('');
  const [deptMessage, setDeptMessage] = useState({ type: '', text: '' });

  // Add Admin Account state
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'super_admin' | 'security_guard' | 'operator'>('operator');
  const [adminMessage, setAdminMessage] = useState({ type: '', text: '' });

  // CMS Form state
  const [cmsTitle, setCmsTitle] = useState(cmsConfig.welcomeTitle);
  const [cmsSubtitle, setCmsSubtitle] = useState(cmsConfig.welcomeSubtitle);
  const [cmsAnnounce, setCmsAnnounce] = useState(cmsConfig.announcement);
  const [cmsShowAnnounce, setCmsShowAnnounce] = useState(cmsConfig.showAnnouncement);
  const [cmsHours, setCmsHours] = useState(cmsConfig.receptionHours);
  const [cmsCapacity, setCmsCapacity] = useState(cmsConfig.allowedCapacity);
  const [cmsSuccess, setCmsSuccess] = useState(false);

  // Syncing simulation state
  const [isSyncing, setIsSyncing] = useState(false);

  // Access Control / Validation state
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [validationResult, setValidationResult] = useState<Visitor | 'not_found' | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // ----------------------------------------------------
  // CALCULATED ANALYTICS
  // ----------------------------------------------------

  // Most Visited Department calculation
  const deptStats = useMemo(() => {
    const stats: Record<string, number> = {};
    // Seed with all current departments
    departments.forEach(d => {
      stats[d.name] = 0;
    });
    // Add visitor weights
    visitors.forEach(v => {
      if (stats[v.department] !== undefined) {
        stats[v.department]++;
      } else {
        stats[v.department] = 1;
      }
    });

    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [visitors, departments]);

  const mostVisitedDept = useMemo(() => {
    return deptStats[0] || { name: 'Ninguno', count: 0 };
  }, [deptStats]);

  // Aggregate visits by day of the current week (Jul 2 - Jul 8, 2026)
  // Let's count them for standard days: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo
  const dailyStats = useMemo(() => {
    const counts = { Lunes: 0, Martes: 0, Miércoles: 0, Jueves: 0, Viernes: 0, Sábado: 0, Domingo: 0 };
    visitors.forEach(v => {
      const date = new Date(v.checkInTime);
      const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = days[dayIndex] as keyof typeof counts;
      counts[dayName]++;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [visitors]);

  // Total visits per week (Comparison: This week vs Previous week)
  const weeklyStats = useMemo(() => {
    let thisWeek = 0;
    let lastWeek = 0;
    const now = new Date('2026-07-08T11:41:59-07:00').getTime();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

    visitors.forEach(v => {
      const checkInTime = new Date(v.checkInTime).getTime();
      const diff = now - checkInTime;
      if (diff >= 0 && diff < oneWeekMs) {
        thisWeek++;
      } else if (diff >= oneWeekMs && diff < twoWeeksMs) {
        lastWeek++;
      }
    });

    return { thisWeek, lastWeek };
  }, [visitors]);

  const totalVisitsCount = visitors.length;
  const activeVisitsCount = visitors.filter(v => v.status === 'inside').length;

  // Filtered and Sorted Visitors List
  const filteredVisitors = useMemo(() => {
    let list = visitors.filter(v => {
      const matchSearch = `${v.firstName} ${v.lastName} ${v.cedula} ${v.hostName} ${v.companyName || ''} ${v.credentialCode || ''}`.toLowerCase().includes(visitorSearch.toLowerCase());
      const matchDept = visitorDeptFilter ? v.department === visitorDeptFilter : true;
      const matchStatus = visitorStatusFilter ? v.status === visitorStatusFilter : true;
      return matchSearch && matchDept && matchStatus;
    });

    // Apply sorting
    list.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
      }
      if (sortBy === 'name_asc') {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
      if (sortBy === 'name_desc') {
        return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      }
      if (sortBy === 'dept_asc') {
        return a.department.localeCompare(b.department);
      }
      if (sortBy === 'dept_desc') {
        return b.department.localeCompare(a.department);
      }
      return 0;
    });

    return list;
  }, [visitors, visitorSearch, visitorDeptFilter, visitorStatusFilter, sortBy]);

  // ----------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------

  const handleCmsSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCMSConfig({
      welcomeTitle: cmsTitle,
      welcomeSubtitle: cmsSubtitle,
      announcement: cmsAnnounce,
      showAnnouncement: cmsShowAnnounce,
      receptionHours: cmsHours,
      allowedCapacity: Number(cmsCapacity)
    });
    setCmsSuccess(true);
    setTimeout(() => setCmsSuccess(false), 3000);
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    setDeptMessage({ type: '', text: '' });
    if (!newDeptName.trim()) return;

    const res = addDepartment(newDeptName);
    if (res.success) {
      setNewDeptName('');
      setDeptMessage({ type: 'success', text: 'Departamento agregado correctamente.' });
    } else {
      setDeptMessage({ type: 'error', text: res.error || 'No se pudo agregar.' });
    }
  };

  const handleValidateCredential = (code: string) => {
    if (!code.trim()) return;
    setIsScanning(true);
    setValidationResult(null);
    setScannedCode(code.trim());
    
    setTimeout(() => {
      const found = visitors.find(v => 
        v.credentialCode?.toUpperCase() === code.trim().toUpperCase() || 
        v.cedula.replace(/[-]/g, '') === code.trim().replace(/[-]/g, '') ||
        v.cedula === code.trim()
      );
      
      if (found) {
        setValidationResult(found);
      } else {
        setValidationResult('not_found');
      }
      setIsScanning(false);
    }, 850);
  };

  const handleCheckoutFromValidator = (visitorId: string) => {
    checkoutVisitor(visitorId);
    setTimeout(() => {
      // Find updated status from visitors array
      setValidationResult(prev => {
        if (prev && prev !== 'not_found' && prev.id === visitorId) {
          return { ...prev, status: 'checked_out', checkOutTime: new Date().toISOString() };
        }
        return prev;
      });
    }, 150);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMessage({ type: '', text: '' });

    if (!newAdminUser.trim() || !newAdminFullName.trim() || !newAdminEmail.trim()) {
      setAdminMessage({ type: 'error', text: 'Complete todos los campos.' });
      return;
    }

    const res = addAdmin({
      username: newAdminUser,
      fullName: newAdminFullName,
      email: newAdminEmail,
      role: newAdminRole,
      twoFactorEnabled: true // enabled by default for high safety requested!
    });

    if (res.success) {
      setNewAdminUser('');
      setNewAdminFullName('');
      setNewAdminEmail('');
      setAdminMessage({ type: 'success', text: 'Usuario de administración agregado con 2FA habilitado.' });
    } else {
      setAdminMessage({ type: 'error', text: res.error || 'No se pudo agregar el usuario.' });
    }
  };

  const handleToggle2FA = (adminId: string, currentStatus: boolean) => {
    updateAdmin(adminId, { twoFactorEnabled: !currentStatus });
  };

  const handleDeleteAdmin = (id: string) => {
    const res = deleteAdmin(id);
    if (!res.success) {
      alert(res.error);
    }
  };

  const handleSyncDb = () => {
    setIsSyncing(true);
    simulateDbSync();
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleClearAllVisitors = async () => {
    const confirmed = window.confirm(
      '¿Está seguro de que desea eliminar permanentemente TODOS los registros de visitas de la base de datos Firestore? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    setIsDeletingAll(true);
    try {
      await clearAllVisitors();
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Export report to CSV
  const handleExportCSV = () => {
    if (filteredVisitors.length === 0) return;

    // Headers
    const headers = ['ID', 'Nombre', 'Apellido', 'Cédula', 'Empresa', 'Departamento', 'Anfitrión', 'Estado', 'Entrada', 'Salida', 'Notas'];
    const rows = filteredVisitors.map(v => [
      v.id,
      v.firstName,
      v.lastName,
      v.cedula,
      v.companyName || '',
      v.department,
      v.hostName,
      v.status === 'inside' ? 'En Planta' : 'Salida',
      v.checkInTime,
      v.checkOutTime || '',
      v.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Visitas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export detailed report of visits to XLSX
  const handleDetailedExportXLSX = () => {
    if (visitors.length === 0) return;

    // Headers
    const headers = [
      'NOMBRES',
      'APELLIDOS',
      'NOMBRE DE EMPRESA',
      'ENTRADA',
      'SALIDA',
      'FECHA DE VISITA',
      'HORA DE INGRESO',
      'HORA DE SALIDA',
      'ÁREA VISITADA'
    ];

    const rows = visitors.map(v => {
      const checkInDate = new Date(v.checkInTime);
      const fechaVisita = checkInDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const horaIngreso = checkInDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const horaSalida = v.checkOutTime
        ? new Date(v.checkOutTime).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : 'PENDIENTE';

      return [
        v.firstName.trim().toUpperCase(),
        v.lastName.trim().toUpperCase(),
        v.companyName ? v.companyName.trim().toUpperCase() : 'PARTICULAR',
        'REGISTRADO',
        v.status === 'checked_out' ? 'COMPLETADO' : 'PENDIENTE',
        fechaVisita,
        horaIngreso,
        horaSalida,
        v.department.trim().toUpperCase()
      ];
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Apply auto-column widths for nicer presentation
    const colWidths = headers.map((header, i) => {
      const maxLength = Math.max(
        header.length,
        ...rows.map(row => String(row[i] || '').length)
      );
      return { wch: maxLength + 3 };
    });
    worksheet['!cols'] = colWidths;

    // Create workbook and append sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Visitas Detalladas');

    // Trigger download
    XLSX.writeFile(workbook, `Reporte_Detallado_Visitas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="bg-slate-50 min-h-[75vh] rounded-xl border border-slate-200 shadow-lg overflow-hidden flex flex-col md:flex-row w-full">
      
      {/* Admin Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-900 text-slate-300 p-4 md:p-6 flex flex-col md:justify-between border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
        <div className="space-y-4 md:space-y-8">
          
          {/* Brand */}
          <div className="flex items-center justify-between md:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-base md:text-lg shadow-lg shadow-blue-900/40 shrink-0">
                DP
              </div>
              <div>
                <h1 className="text-white font-bold tracking-tight text-sm md:text-lg leading-none">DP-VISITAS</h1>
                <p className="text-[9px] md:text-[10px] font-mono tracking-wider text-slate-500 font-semibold uppercase mt-0.5 md:mt-1">PANEL CONTROL</p>
              </div>
            </div>
            
            {/* Mobile User Profile Quick Display */}
            <div className="flex md:hidden items-center gap-2">
              <div className="w-7 h-7 bg-slate-800 text-white font-bold rounded-full flex items-center justify-center text-[10px] border border-slate-700">
                {currentAdmin?.username.slice(0, 2).toUpperCase() || 'AD'}
              </div>
            </div>
          </div>

          {/* Nav Items - horizontal scrolling on mobile, vertical list on desktop */}
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1.5 md:pb-0 scrollbar-none space-y-0 md:space-y-1 -mx-4 md:mx-0 px-4 md:px-0 shrink-0">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 md:gap-3 px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700/50 font-semibold'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-100'
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>Analíticas y KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('visitors')}
              className={`flex items-center gap-2 md:gap-3 px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer shrink-0 ${
                activeTab === 'visitors'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700/50 font-semibold'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-100'
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Registro de Visitas</span>
            </button>

            <button
              onClick={() => setActiveTab('validator')}
              className={`flex items-center gap-2 md:gap-3 px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer shrink-0 ${
                activeTab === 'validator'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700/50 font-semibold'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-100'
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Punto de Acceso</span>
              <span className="inline sm:hidden">Acceso</span>
            </button>

            <button
              onClick={() => setActiveTab('admins')}
              className={`flex items-center gap-2 md:gap-3 px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer shrink-0 ${
                activeTab === 'admins'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700/50 font-semibold'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-100'
              }`}
            >
              <UserPlus className="h-4 w-4 shrink-0" />
              <span>Usuarios</span>
            </button>

            <button
              onClick={() => setActiveTab('cms')}
              className={`flex items-center gap-2 md:gap-3 px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer shrink-0 ${
                activeTab === 'cms'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700/50 font-semibold'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-100'
              }`}
            >
              <Settings2 className="h-4 w-4 shrink-0" />
              <span>CMS</span>
            </button>

            <button
              onClick={() => setActiveTab('db_cluster')}
              className={`flex items-center gap-2 md:gap-3 px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer shrink-0 ${
                activeTab === 'db_cluster'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700/50 font-semibold'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-100'
              }`}
            >
              <Database className="h-4 w-4 shrink-0" />
              <span>Clúster DB</span>
            </button>
          </nav>
        </div>

        {/* Admin Footer & Log Out - hidden or compact on mobile, shown on desktop */}
        <div className="hidden md:block pt-6 border-t border-slate-800 mt-6 md:mt-0 space-y-4">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 bg-slate-800 text-white font-bold rounded-full flex items-center justify-center text-xs border border-slate-700">
              {currentAdmin?.username.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentAdmin?.fullName}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{currentAdmin?.email}</p>
            </div>
          </div>
          <button
            onClick={logoutAdmin}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-850 hover:bg-rose-950 hover:text-rose-200 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-all border border-slate-800"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Compact logout button for mobile/tablet only */}
        <div className="flex md:hidden items-center justify-between pt-2 border-t border-slate-800 mt-2">
          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase truncate max-w-[140px]">
            {currentAdmin?.username}
          </span>
          <button
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-850 hover:bg-rose-950 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-800 cursor-pointer transition-all"
          >
            <LogOut className="h-3 w-3" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* Admin Content Area */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        
        {/* Header bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">DP-VISITAS PANEL DE CONTROL</span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mt-0.5">
              {activeTab === 'analytics' && 'Dashboard de Analíticas'}
              {activeTab === 'visitors' && 'Historial de Visitas'}
              {activeTab === 'validator' && 'Control de Acceso y Validador'}
              {activeTab === 'admins' && 'Cuentas de Administradores'}
              {activeTab === 'cms' && 'Sistema de Gestión de Contenido'}
              {activeTab === 'db_cluster' && 'Consola del Clúster de Base de Datos'}
            </h2>
          </div>
          
          {/* Quick Stats Summary */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Detailed Report Button */}
            <button
              onClick={handleDetailedExportXLSX}
              className="px-3 py-2 sm:p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold shadow-md shrink-0"
              title="Generar Reporte Detallado de Visitas"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Reporte Detallado</span>
              <span className="inline sm:hidden">Reporte</span>
            </button>

            <button
              onClick={handleSyncDb}
              disabled={isSyncing}
              className="px-3 py-2 sm:p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-850 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 text-xs font-medium shadow-sm shrink-0"
              title="Sincronizar Cloud Database"
            >
              <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isSyncing ? 'animate-spin text-slate-900' : ''}`} />
              <span className="hidden sm:inline">Sincronizar DB</span>
              <span className="inline sm:hidden">Sinc. DB</span>
            </button>

            {/* Realtime Notifications Dropdown bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 sm:p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-850 cursor-pointer active:scale-95 transition-all relative shadow-sm"
                title="Notificaciones en Tiempo Real"
              >
                <Bell className="h-4 w-4 shrink-0" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-bounce shadow-sm">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Invisible Backdrop overlay to dismiss dropdown */}
                    <div className="fixed inset-0 z-45" onClick={() => setShowNotifications(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-32px)] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">Notificaciones de Actividad</h4>
                          <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider mt-0.5">Alertas de Ingreso/Egreso</p>
                        </div>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => clearAllNotifications()}
                            className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                          >
                            Limpiar todo
                          </button>
                        )}
                      </div>

                      {/* Notifications List Body */}
                      <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            <BellOff className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-semibold">Sin alertas recientes</p>
                            <p className="text-[10px] text-slate-400 mt-1">Las entradas y salidas del día aparecerán aquí en vivo.</p>
                          </div>
                        ) : (
                          [...notifications]
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((notif) => (
                              <div
                                key={notif.id}
                                onClick={() => markNotificationAsRead(notif.id)}
                                className={`p-3.5 hover:bg-slate-50/60 transition-all cursor-pointer flex gap-3 relative group text-left ${
                                  !notif.read ? 'bg-blue-50/15' : ''
                                }`}
                              >
                                {/* Left icon indicator */}
                                <div className="mt-0.5">
                                  {notif.type === 'check_in' ? (
                                    <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                                      <LogIn className="h-3.5 w-3.5" />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-100">
                                      <LogOut className="h-3.5 w-3.5" />
                                    </div>
                                  )}
                                </div>

                                {/* Texts */}
                                <div className="flex-1 space-y-0.5 text-xs">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className="font-bold text-slate-800">
                                      {notif.visitorName}
                                    </p>
                                    {!notif.read && (
                                      <span className="h-1.5 w-1.5 bg-blue-600 rounded-full mt-1 shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-slate-500 text-[11px]">
                                    {notif.type === 'check_in'
                                      ? 'Registró su ingreso oficial.'
                                      : 'Registró su salida y egreso.'}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    Para: {notif.hostName} ({notif.department})
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-mono pt-1">
                                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 shadow-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              SESIÓN SEGURA
            </div>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <AnimatePresence mode="wait">
          
          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* KPIs Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Visitas */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Visitas</p>
                    <h3 className="text-2xl font-bold text-slate-850 mt-1 font-mono">{totalVisitsCount}</h3>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1 font-mono">
                      +{(weeklyStats.thisWeek - weeklyStats.lastWeek) >= 0 ? '+' : ''}
                      {weeklyStats.thisWeek - weeklyStats.lastWeek} esta semana
                    </p>
                  </div>
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                </div>

                {/* Visitantes Activos */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Planta</p>
                    <h3 className="text-2xl font-bold text-slate-850 mt-1 font-mono">{activeVisitsCount}</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Concurrencia activa actual</p>
                  </div>
                  <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>

                {/* Área Más Visitada */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Área Más Demandada</p>
                    <h3 className="text-sm font-bold text-slate-850 mt-2 truncate max-w-[130px]" title={mostVisitedDept.name}>
                      {mostVisitedDept.name}
                    </h3>
                    <p className="text-[10px] text-blue-600 font-bold mt-1 font-mono">{mostVisitedDept.count} ingresos</p>
                  </div>
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Building className="h-5 w-5" />
                  </div>
                </div>

                {/* Capacidad Ocupada */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capacidad de Recepción</p>
                    <h3 className="text-2xl font-bold text-slate-850 mt-1 font-mono">
                      {Math.round((activeVisitsCount / cmsConfig.allowedCapacity) * 100)}%
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {activeVisitsCount} de {cmsConfig.allowedCapacity} máx
                    </p>
                  </div>
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* SVG Visit Trends per Day */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Flujo de Visitas por Día</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Visitas acumuladas en la semana laboral actual</p>
                    </div>
                    <span className="p-1.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-100">
                      <Calendar className="h-4 w-4" />
                    </span>
                  </div>

                  {/* Elegant Hand-crafted SVG Bar Graph */}
                  <div className="h-64 w-full">
                    <svg viewBox="0 0 500 240" className="w-full h-full">
                      {/* Grid Lines */}
                      <line x1="30" y1="20" x2="480" y2="20" stroke="#f3f4f6" strokeWidth="1" />
                      <line x1="30" y1="70" x2="480" y2="70" stroke="#f3f4f6" strokeWidth="1" />
                      <line x1="30" y1="120" x2="480" y2="120" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3" />
                      <line x1="30" y1="170" x2="480" y2="170" stroke="#f3f4f6" strokeWidth="1" />
                      <line x1="30" y1="200" x2="480" y2="200" stroke="#e5e7eb" strokeWidth="1.5" />

                      {/* Render Bars */}
                      {dailyStats.map((day, idx) => {
                        const maxVal = Math.max(...dailyStats.map(d => d.count), 5);
                        const graphHeight = 160;
                        const barWidth = 32;
                        const spacing = 62;
                        const x = 45 + idx * spacing;
                        const barHeight = (day.count / maxVal) * graphHeight;
                        const y = 200 - barHeight;

                        return (
                          <g key={day.name} className="group cursor-pointer">
                            {/* Bar Tooltip label */}
                            <text
                              x={x + barWidth / 2}
                              y={y - 8}
                              textAnchor="middle"
                              className="fill-zinc-950 font-bold font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {day.count}
                            </text>
                            
                            {/* Bar with gradient look */}
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={Math.max(barHeight, 4)}
                              rx="6"
                              className="fill-slate-800 group-hover:fill-blue-600 transition-all duration-300"
                            />
                            
                            {/* X-Axis labels */}
                            <text
                              x={x + barWidth / 2}
                              y="218"
                              textAnchor="middle"
                              className="fill-gray-400 font-mono text-[10px] font-semibold"
                            >
                              {day.name.slice(0, 3)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Left Axis Labels */}
                      <text x="15" y="24" className="fill-gray-400 font-mono text-[9px]" textAnchor="end">MAX</text>
                      <text x="15" y="124" className="fill-gray-400 font-mono text-[9px]" textAnchor="end">MID</text>
                      <text x="15" y="204" className="fill-gray-400 font-mono text-[9px]" textAnchor="end">0</text>
                    </svg>
                  </div>
                </div>

                {/* Most Visited Department Ranking List */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">Flujo por Departamentos</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Demanda y distribución de visitas registradas</p>
                      </div>
                      <span className="p-1.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-100">
                        <Building className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="space-y-4">
                      {deptStats.slice(0, 5).map((dept, index) => {
                        const maxCount = Math.max(...deptStats.map(d => d.count), 1);
                        const percentage = Math.round((dept.count / maxCount) * 100);
                        
                        return (
                          <div key={dept.name} className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-slate-700 truncate max-w-[180px] flex items-center gap-2">
                                <span className="h-5 w-5 bg-slate-100 text-slate-800 font-mono rounded-md flex items-center justify-center text-[10px] font-bold border border-slate-200">
                                  {index + 1}
                                </span>
                                {dept.name}
                              </span>
                              <span className="font-mono text-slate-900 font-bold">{dept.count} visitas</span>
                            </div>
                            
                            {/* Custom progress bar */}
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                    <span>* Filtro optimizado en base a concurrencia activa</span>
                    <span className="text-emerald-500 font-bold">ACTUALIZADO</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VISITORS RECORD TAB */}
          {activeTab === 'visitors' && (
            <motion.div
              key="visitors"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Filter Row */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar visitante, cédula o anfitrión..."
                    value={visitorSearch}
                    onChange={(e) => setVisitorSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium bg-white text-slate-800"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3.5">
                  {/* Department Filter */}
                  <select
                    value={visitorDeptFilter}
                    onChange={(e) => setVisitorDeptFilter(e.target.value)}
                    className="px-3.5 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  >
                    <option value="">Todos los Departamentos</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={visitorStatusFilter}
                    onChange={(e) => setVisitorStatusFilter(e.target.value)}
                    className="px-3.5 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  >
                    <option value="">Todos los Estados</option>
                    <option value="inside">En Planta (Activos)</option>
                    <option value="checked_out">Salida Registrada</option>
                  </select>

                  {/* Sort Selector */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3.5 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  >
                    <option value="date_desc">Ordenar: Recientes Primero</option>
                    <option value="date_asc">Ordenar: Antiguos Primero</option>
                    <option value="name_asc">Ordenar: Nombre (A-Z)</option>
                    <option value="name_desc">Ordenar: Nombre (Z-A)</option>
                    <option value="dept_asc">Ordenar: Departamento (A-Z)</option>
                    <option value="dept_desc">Ordenar: Departamento (Z-A)</option>
                  </select>

                  {/* Export CSV Button */}
                  <button
                    onClick={handleExportCSV}
                    disabled={filteredVisitors.length === 0}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Exportar Reporte (CSV)</span>
                  </button>

                  {/* Clear All Visitors Button */}
                  <button
                    onClick={handleClearAllVisitors}
                    disabled={visitors.length === 0 || isDeletingAll}
                    className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-40 disabled:pointer-events-none text-rose-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                    title="Eliminar todos los registros de visitas en Firestore"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{isDeletingAll ? 'Eliminando...' : 'Eliminar Todo'}</span>
                  </button>
                </div>
              </div>

              {/* Table or Cards */}
              <div className="overflow-x-auto">
                {filteredVisitors.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No se encontraron registros de visitas.</p>
                    <p className="text-xs text-gray-400 mt-1">Asegúrese de modificar el filtro o registrar un visitante.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        <th className="py-4 px-5">Visitante</th>
                        <th className="py-4 px-5">No. Cédula</th>
                        <th className="py-4 px-5">Credencial</th>
                        <th className="py-4 px-5">Departamento</th>
                        <th className="py-4 px-5">Atendido Por</th>
                        <th className="py-4 px-5">Ingreso / Egreso</th>
                        <th className="py-4 px-5">Estado</th>
                        <th className="py-4 px-5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredVisitors.map((visitor) => (
                        <tr key={visitor.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{visitor.firstName} {visitor.lastName}</span>
                              {visitor.companyName && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold uppercase tracking-wider">
                                  {visitor.companyName}
                                </span>
                              )}
                            </div>
                            {visitor.notes && (
                              <div className="text-[10px] text-slate-400 italic max-w-xs truncate mt-0.5">
                                "{visitor.notes}"
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-5 font-mono text-slate-600 font-semibold">{visitor.cedula}</td>
                          <td className="py-4 px-5 font-mono">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
                              <QrCode className="h-3.5 w-3.5 text-slate-500" />
                              {visitor.credentialCode || 'SIN CÓDIGO'}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className="font-medium text-slate-800">{visitor.department}</span>
                          </td>
                          <td className="py-4 px-5 text-slate-600 font-medium">{visitor.hostName}</td>
                          <td className="py-4 px-5 space-y-1">
                            <div className="text-slate-700 font-mono flex items-center gap-1">
                              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                              {new Date(visitor.checkInTime).toLocaleString()}
                            </div>
                            {visitor.checkOutTime ? (
                              <div className="text-slate-500 font-mono flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-rose-500 rounded-full" />
                                {new Date(visitor.checkOutTime).toLocaleString()}
                              </div>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-semibold uppercase bg-amber-50 px-2 py-0.5 rounded-md font-mono border border-amber-100">
                                Aún adentro
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                                visitor.status === 'inside'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {visitor.status === 'inside' ? 'En Planta' : 'Retirado'}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={() => deleteVisitorRecord(visitor.id)}
                              className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors inline-flex"
                              title="Eliminar Registro Permanente"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* CONTROL DE ACCESO / VALIDADOR TAB */}
          {activeTab === 'validator' && (
            <motion.div
              key="validator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Input and Quick-test simulation */}
              <div className="lg:col-span-5 space-y-6">
                {/* Manual input card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Escaneo de Credenciales</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Ingrese el número de cédula o el identificador alfanumérico único para validar el acceso y ver el estado de la visita.
                  </p>
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleValidateCredential(manualCodeInput);
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider mb-1">
                        Código de Credencial o Cédula
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="Ej: DPV-20260708-5A2C ó 001-1122334-7"
                          value={manualCodeInput}
                          onChange={(e) => setManualCodeInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-semibold font-mono bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isScanning}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Procesando Escaneo...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="h-3.5 w-3.5" />
                          <span>Escanear / Validar</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Quick Simulation List */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">Simulador de Acceso Rápido</h4>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold uppercase rounded font-mono">Demo</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Haga clic en cualquiera de las visitas activas para simular el escaneo automático del carnet en el torniquete de entrada/salida.
                  </p>

                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {visitors.filter(v => v.status === 'inside').length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-xl">
                        No hay visitantes activos adentro actualmente para simular.
                      </div>
                    ) : (
                      visitors
                        .filter(v => v.status === 'inside')
                        .map((visitor) => (
                          <button
                            key={visitor.id}
                            onClick={() => {
                              setManualCodeInput(visitor.credentialCode || '');
                              handleValidateCredential(visitor.credentialCode || '');
                            }}
                            className="w-full text-left p-3 border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                                {visitor.firstName} {visitor.lastName}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                Cédula: {visitor.cedula}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono bg-blue-50 group-hover:bg-blue-100 text-blue-800 px-2 py-1 rounded text-[9px] font-bold border border-blue-100 transition-colors">
                                {visitor.credentialCode || 'VERIFICAR'}
                              </span>
                              <p className="text-[9px] text-slate-400 mt-1 font-mono">
                                Visita a: {visitor.hostName}
                              </p>
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Animated Scan feedback and physical-look Badge */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col min-h-[480px]">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 tracking-wider font-mono uppercase">Consola del Validador Óptico</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  {/* Body area */}
                  <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50/30">
                    {isScanning ? (
                      /* Scanning Animation Screen */
                      <div className="text-center space-y-4 py-12">
                        <div className="relative w-44 h-44 mx-auto border-2 border-blue-500 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
                          {/* Simulated Scanning Laser */}
                          <motion.div
                            initial={{ y: -10 }}
                            animate={{ y: 176 }}
                            transition={{
                              repeat: Infinity,
                              repeatType: "reverse",
                              duration: 1.2,
                              ease: "easeInOut"
                            }}
                            className="absolute left-0 right-0 h-1 bg-green-500 shadow-[0_0_12px_#22c55e] z-10"
                          />
                          <QrCode className="h-20 w-20 text-blue-500/30 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-xs font-bold font-mono tracking-wider text-slate-600 uppercase">LEYENDO CREDENCIAL...</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: {scannedCode}</p>
                        </div>
                      </div>
                    ) : validationResult === null ? (
                      /* Idle Screen */
                      <div className="text-center py-12 max-w-sm">
                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-inner">
                          <QrCode className="h-7 w-7" />
                        </div>
                        <h4 className="font-bold text-slate-700 text-sm">Dispositivo Listo para Escanear</h4>
                        <p className="text-xs text-slate-400 mt-2">
                          Utilice un código de credencial alfanumérico o cédula en la izquierda, o simule el pase rápido de un visitante para iniciar la comprobación de seguridad.
                        </p>
                      </div>
                    ) : validationResult === 'not_found' ? (
                      /* Not Found / Error Screen */
                      <div className="text-center py-12 max-w-sm">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 animate-bounce">
                          <AlertTriangle className="h-7 w-7" />
                        </div>
                        <h4 className="font-bold text-red-600 text-sm">Acceso Denegado</h4>
                        <p className="text-xs text-slate-600 mt-2 font-mono bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                          Código: "{scannedCode}"
                        </p>
                        <p className="text-xs text-slate-400 mt-3">
                          No se encontró ninguna visita activa o histórica registrada con esta credencial. Por favor verifique el código o dirija al visitante a registrarse.
                        </p>
                      </div>
                    ) : (
                      /* Visitor Badge Validation Card */
                      <div className="w-full max-w-md bg-white rounded-2xl border-2 border-slate-200 shadow-md overflow-hidden relative">
                        {/* Status Ribbon */}
                        <div
                          className={`py-3 px-5 text-center font-mono text-xs font-bold tracking-widest text-white uppercase flex items-center justify-center gap-2 ${
                            validationResult.status === 'inside'
                              ? 'bg-emerald-600 animate-pulse'
                              : 'bg-slate-700'
                          }`}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>
                            {validationResult.status === 'inside'
                              ? 'ACCESO AUTORIZADO - ACTIVO'
                              : 'VISITANTE YA RETIRADO'}
                          </span>
                        </div>

                        {/* Physical layout */}
                        <div className="p-6 space-y-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Nombre del Visitante</span>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                                {validationResult.firstName} {validationResult.lastName}
                              </h3>
                              {validationResult.companyName && (
                                <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  <Briefcase className="h-3 w-3" />
                                  <span>{validationResult.companyName}</span>
                                </div>
                              )}
                              <p className="text-xs text-slate-500 font-mono">
                                Cédula: <span className="font-semibold text-slate-700">{validationResult.cedula}</span>
                              </p>
                            </div>

                            {/* Badge QR representation */}
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center shrink-0">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(
                                  `${window.location.origin}/?badge=${encodeURIComponent(validationResult.credentialCode || validationResult.id)}` +
                                  `&fn=${encodeURIComponent(validationResult.firstName)}` +
                                  `&ln=${encodeURIComponent(validationResult.lastName)}` +
                                  `&c=${encodeURIComponent(validationResult.cedula)}` +
                                  `&d=${encodeURIComponent(validationResult.department)}` +
                                  `&co=${encodeURIComponent(validationResult.companyName || '')}` +
                                  `&n=${encodeURIComponent(validationResult.notes || '')}` +
                                  `&h=${encodeURIComponent(validationResult.hostName)}` +
                                  `&t=${encodeURIComponent(validationResult.checkInTime)}`
                                )}`}
                                alt="QR Credencial"
                                referrerPolicy="no-referrer"
                                className="w-20 h-20 bg-white"
                              />
                              <span className="text-[9px] font-bold font-mono tracking-wider mt-1 text-slate-600 uppercase">
                                {validationResult.credentialCode || 'DP-VISITAS'}
                              </span>
                            </div>
                          </div>

                          {/* Highlighted Core Destination / Person Details */}
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3.5">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                <User className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Persona a Quien Visita (Anfitrión)</p>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{validationResult.hostName}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3 pt-3 border-t border-slate-200/50">
                              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                <Building className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Departamento que va a visitar</p>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{validationResult.department}</p>
                              </div>
                            </div>
                          </div>

                          {/* Visitation Details Grid */}
                          <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Hora de Entrada</p>
                              <p className="font-mono font-medium text-slate-700 mt-0.5">
                                {new Date(validationResult.checkInTime).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Hora de Salida</p>
                              <p className="font-mono font-medium text-slate-700 mt-0.5">
                                {validationResult.checkOutTime
                                  ? new Date(validationResult.checkOutTime).toLocaleString()
                                  : <span className="text-emerald-600 font-bold uppercase text-[10px]">Aún en Planta</span>}
                              </p>
                            </div>
                          </div>

                          {validationResult.notes && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Motivo de Visita</p>
                              <p className="text-slate-600 mt-0.5 italic">"{validationResult.notes}"</p>
                            </div>
                          )}

                          {/* Actions Inside Card */}
                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(validationResult.credentialCode || '');
                                setCopiedCodeId(validationResult.id);
                                setTimeout(() => setCopiedCodeId(null), 2000);
                              }}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 active:scale-95"
                            >
                              {copiedCodeId === validationResult.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copiar Código</span>
                                </>
                              )}
                            </button>

                            {validationResult.status === 'inside' && (
                              <button
                                onClick={() => handleCheckoutFromValidator(validationResult.id)}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95 ml-auto"
                              >
                                <LogOut className="h-3.5 w-3.5" />
                                <span>Registrar Salida</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ADMIN MANAGEMENT TAB */}
          {activeTab === 'admins' && (
            <motion.div
              key="admins"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              
              {/* Admin list table */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Usuarios con Acceso Administrativo</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">Nombre / Correo</th>
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4">Rol</th>
                        <th className="py-3 px-4 text-center">Seguridad 2FA</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {admins.map((adm) => (
                        <tr key={adm.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{adm.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{adm.email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">@{adm.username}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono border ${
                                adm.role === 'super_admin'
                                  ? 'bg-slate-900 text-white border-slate-950'
                                  : adm.role === 'security_guard'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {adm.role === 'super_admin' && 'Súper Admin'}
                              {adm.role === 'security_guard' && 'Guardia'}
                              {adm.role === 'operator' && 'Operador'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggle2FA(adm.id, adm.twoFactorEnabled)}
                              className="inline-flex cursor-pointer text-slate-900 focus:outline-hidden transition-transform active:scale-95 animate-none"
                              title={adm.twoFactorEnabled ? "Deshabilitar 2FA" : "Habilitar 2FA"}
                            >
                              {adm.twoFactorEnabled ? (
                                <span className="flex items-center gap-1 text-emerald-600 font-semibold font-mono text-[10px]">
                                  <ToggleRight className="h-5 w-5" /> ACTIVO
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-400 font-semibold font-mono text-[10px]">
                                  <ToggleLeft className="h-5 w-5" /> INACTIVO
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteAdmin(adm.id)}
                              disabled={adm.id === 'adm-1' || currentAdmin?.id === adm.id}
                              className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 disabled:opacity-30 rounded-lg cursor-pointer transition-colors inline-flex"
                              title="Eliminar Cuenta Administrativa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create new admin account form */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    Nueva Cuenta Admin
                  </h3>

                  {adminMessage.text && (
                    <div
                      className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                        adminMessage.type === 'success'
                          ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                          : 'bg-rose-50 border border-rose-100 text-rose-800'
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{adminMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Usuario</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. pedro88"
                        value={newAdminUser}
                        onChange={(e) => setNewAdminUser(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono bg-white text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Pedro Alcántara"
                        value={newAdminFullName}
                        onChange={(e) => setNewAdminFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white text-slate-800 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Correo Corporativo</label>
                      <input
                        type="email"
                        required
                        placeholder="Ej. p.alcantara@corp.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white text-slate-800 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Rol y Privilegios</label>
                      <select
                        value={newAdminRole}
                        onChange={(e) => setNewAdminRole(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:border-blue-500 text-slate-700 cursor-pointer font-medium"
                      >
                        <option value="operator">Operador / Recepción</option>
                        <option value="security_guard">Seguridad de Planta</option>
                        <option value="super_admin">Administrador Global</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      Crear Nueva Cuenta
                    </button>
                  </form>
                </div>

                <div className="pt-4 border-t border-gray-100 text-[10px] text-gray-400 mt-4 leading-normal">
                  <span className="font-semibold block text-gray-500 uppercase tracking-wider mb-1">MFA REQUISITO</span>
                  Toda cuenta nueva es inicializada con el factor de autenticación doble (2FA) habilitado automáticamente por políticas de seguridad bancaria.
                </div>
              </div>
            </motion.div>
          )}

          {/* CMS SETTINGS TAB */}
          {activeTab === 'cms' && (
            <motion.div
              key="cms"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              
              {/* CMS Settings Editor */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Modificar Contenidos de Recepción</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Control directo de los textos de la página de registro</p>
                  </div>
                </div>

                {cmsSuccess && (
                  <div className="mb-5 p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span>¡Contenidos actualizados! El formulario de visitas se ha reconfigurado en tiempo real.</span>
                  </div>
                )}

                <form onSubmit={handleCmsSave} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Título de Bienvenida</label>
                    <input
                      type="text"
                      required
                      value={cmsTitle}
                      onChange={(e) => setCmsTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Subtítulo explicativo</label>
                    <textarea
                      required
                      value={cmsSubtitle}
                      onChange={(e) => setCmsSubtitle(e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none bg-white text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mensaje de Aviso / Banner</label>
                    <textarea
                      required
                      value={cmsAnnounce}
                      onChange={(e) => setCmsAnnounce(e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 bg-rose-50/25 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCmsShowAnnounce(!cmsShowAnnounce)}
                      className="focus:outline-hidden cursor-pointer"
                    >
                      {cmsShowAnnounce ? (
                        <ToggleRight className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-400" />
                      )}
                    </button>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Mostrar Banner de Aviso en Recepción</span>
                      <p className="text-[10px] text-slate-400">Si está inactivo, el recuadro rojo de emergencia se ocultará de la pantalla de inicio.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Horario de Atención</label>
                      <input
                        type="text"
                        required
                        value={cmsHours}
                        onChange={(e) => setCmsHours(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Capacidad Máxima Permitida</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={cmsCapacity}
                        onChange={(e) => setCmsCapacity(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    <span>Guardar y Publicar en Recepción</span>
                  </button>
                </form>
              </div>

              {/* Department Manager Panel */}
              <div className="space-y-6">
                
                {/* Add/Remove Departments */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Departamentos
                  </h3>

                  {deptMessage.text && (
                    <div
                      className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        deptMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      <span>{deptMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddDept} className="flex gap-2 mb-4 w-full">
                    <input
                      type="text"
                      required
                      placeholder="Ej. Legal"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium bg-white text-slate-800"
                    />
                    <button
                      type="submit"
                      className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer hover:shadow-md active:scale-95 transition-all shrink-0"
                    >
                      Añadir
                    </button>
                  </form>

                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-thin">
                    {departments.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-2.5 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-lg text-xs font-medium">
                        <span className="text-slate-800">{d.name}</span>
                        <button
                          onClick={() => removeDepartment(d.id)}
                          disabled={departments.length <= 1}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-md cursor-pointer transition-colors"
                          title="Eliminar Departamento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Optimización Automática</span>
                    Los cambios de departamentos e información de la pantalla de inicio se sincronizan de inmediato sin reiniciar servidores de frontend.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CLOUD DB DISTRIBUTED CLUSTER TAB */}
          {activeTab === 'db_cluster' && (
            <motion.div
              key="db_cluster"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 text-slate-200 p-6 rounded-xl border border-slate-800 relative overflow-hidden shadow-lg">
                {/* Ambient glow decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-20 -mr-20 -mt-20" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                      <Server className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">PLATAFORMA ESCALABLE NATIVA</span>
                      <h3 className="text-xl font-bold tracking-tight text-white mt-0.5">Clúster de Base de Datos Distribuida</h3>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSyncDb}
                    disabled={isSyncing}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>Sincronizando Nodos...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 text-white" />
                        <span>Forzar Sincronización Manual</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Cloud Cluster Nodes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {dbClusters.map((cluster) => (
                    <div
                      key={cluster.region}
                      className="p-5 bg-slate-850/60 border border-slate-800 rounded-xl flex flex-col justify-between h-40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-400">{cluster.region}</span>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            cluster.status === 'healthy'
                              ? 'bg-emerald-400'
                              : cluster.status === 'syncing'
                              ? 'bg-blue-400 animate-spin'
                              : 'bg-amber-400 animate-pulse'
                          }`}
                          title={`Estado: ${cluster.status}`}
                        />
                      </div>

                      <div className="py-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Conexiones Activas</span>
                        <span className="text-xl font-extrabold text-white font-mono">{cluster.activeConnections}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800/50">
                        <span>Latencia: <strong className="text-blue-400">{cluster.latency}ms</strong></span>
                        <span>Sincronía: {cluster.lastSync}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-slate-850/40 border border-slate-800/50 rounded-xl flex items-start gap-3 text-xs text-slate-400">
                  <ShieldAlert className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-200">Políticas de Replicación de Alta Disponibilidad (DR-MFA)</span>
                    Los datos de los visitantes se almacenan utilizando un motor de transacciones ACID distribuido con replicación asíncrona de 3 regiones para tolerar fallas de hardware regionales y picos de tráfico extremo, asegurando que DP-VISITAS mantenga un tiempo de actividad continuo superior al 99.99%.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};
