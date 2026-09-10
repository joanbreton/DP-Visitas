/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { VisitorForm } from './components/VisitorForm';
import { ActiveVisitors } from './components/ActiveVisitors';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { VisitorVerificationModal } from './components/VisitorVerificationModal';
import {
  Building,
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  Monitor,
  Lock,
  CheckCircle,
  Flame,
  Database,
  Search,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { cmsConfig, currentAdmin, is2FAVerified, visitors, isFirestoreConnected } = useApp();
  
  // App views: 'reception' | 'admin'
  const [view, setView] = useState<'reception' | 'admin'>('reception');
  const [badgeQuery, setBadgeQuery] = useState<string | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  useEffect(() => {
    const handleUrlQuery = () => {
      const params = new URLSearchParams(window.location.search);
      const badge = params.get('badge') || params.get('cedula');
      if (badge) {
        setBadgeQuery(badge);
        setIsVerificationModalOpen(true);
      }
    };

    handleUrlQuery();
    window.addEventListener('popstate', handleUrlQuery);
    return () => window.removeEventListener('popstate', handleUrlQuery);
  }, []);

  const handleCloseVerification = () => {
    setIsVerificationModalOpen(false);
    setBadgeQuery(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('badge');
    url.searchParams.delete('cedula');
    url.searchParams.delete('fn');
    url.searchParams.delete('ln');
    url.searchParams.delete('c');
    url.searchParams.delete('d');
    url.searchParams.delete('h');
    url.searchParams.delete('co');
    url.searchParams.delete('t');
    url.searchParams.delete('out');
    url.searchParams.delete('s');
    url.searchParams.delete('n');
    const newSearch = url.searchParams.toString();
    window.history.pushState({}, '', url.pathname + (newSearch ? `?${newSearch}` : ''));
  };

  const totalInside = visitors.filter(v => v.status === 'inside').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans transition-colors antialiased">
      
      {/* Top Universal Navbar */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 sm:py-4 sm:px-6 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0 shadow-xs">
              DP
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-mono tracking-wider text-slate-400 font-bold uppercase block leading-none">SISTEMA CORPORATIVO</span>
              <h1 className="text-slate-800 font-bold tracking-tight text-lg sm:text-xl mt-0.5 sm:mt-1">DP-VISITAS</h1>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Database indicator */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors ${
                isFirestoreConnected
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
              title={
                isFirestoreConnected
                  ? 'Base de datos Google Cloud Firestore conectada y sincronizada en tiempo real'
                  : 'Conectando con Google Cloud Firestore...'
              }
            >
              <Database className="h-3.5 w-3.5 shrink-0" />
              <span className={`w-1.5 h-1.5 rounded-full ${isFirestoreConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-medium">
                {isFirestoreConnected ? 'Firestore: En línea' : 'Reconectando DB'}
              </span>
            </div>

            {/* Credential Lookup Action */}
            <button
              onClick={() => {
                setBadgeQuery('');
                setIsVerificationModalOpen(true);
              }}
              className="px-2.5 py-2 sm:px-3.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer active:scale-97 transition-all flex items-center gap-1.5 border border-slate-200"
              title="Consultar ficha de visitante por código o cédula"
            >
              <Search className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Consultar Credencial</span>
              <span className="inline sm:hidden">Consultar</span>
            </button>

            {view === 'reception' ? (
              <button
                onClick={() => setView('admin')}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer active:scale-97 transition-all flex items-center gap-1.5 sm:gap-2"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Consola Administrativa</span>
                <span className="inline sm:hidden">Consola</span>
              </button>
            ) : (
              <button
                onClick={() => setView('reception')}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer active:scale-97 transition-all flex items-center gap-1.5 sm:gap-2"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Volver a Recepción (Kiosk)</span>
                <span className="inline sm:hidden">Recepción</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* RECEPTION PUBLIC KIOSK VIEW */}
          {view === 'reception' ? (
            <motion.div
              key="reception-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 md:space-y-8"
            >
              
              {/* Intro Welcome Hero */}
              <div className="text-center max-w-2xl mx-auto space-y-3 py-4">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight leading-tight">
                  {cmsConfig.welcomeTitle}
                </h2>
                <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
                  {cmsConfig.welcomeSubtitle}
                </p>

                {/* Quick Credential / Cédula Lookup Bar */}
                <div className="max-w-lg mx-auto pt-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem('searchQuery') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        setBadgeQuery(input.value.trim());
                        setIsVerificationModalOpen(true);
                      }
                    }}
                    className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
                  >
                    <div className="pl-3 text-slate-400">
                      <Search className="h-4 w-4" />
                    </div>
                    <input
                      name="searchQuery"
                      type="text"
                      placeholder="Buscar ficha por Cédula o Código de Credencial..."
                      className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden font-medium"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all shrink-0 flex items-center gap-1"
                    >
                      <span>Ver Ficha</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Dynamic CMS Banner Notice */}
              {cmsConfig.showAnnouncement && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 max-w-3xl mx-auto text-rose-900 shadow-sm"
                >
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs md:text-sm">
                    <span className="font-bold block text-rose-950 uppercase tracking-wide font-mono text-[10px] mb-0.5">AVISO IMPORTANTE RESTRICCIÓN</span>
                    <p className="font-medium">{cmsConfig.announcement}</p>
                  </div>
                </motion.div>
              )}

              {/* Interactive Grid: Form on Left | Active List on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Form Module */}
                <div className="lg:col-span-5">
                  <VisitorForm />
                </div>

                {/* Active Visitors Control Module */}
                <div className="lg:col-span-7 h-full">
                  <ActiveVisitors />
                </div>

              </div>

              {/* Capacity Progress Tracker */}
              <div className="max-w-xl mx-auto bg-white border border-slate-200 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-tighter animate-pulse shrink-0">
                    En Vivo
                  </span>
                  <span className="text-slate-500 font-medium">Ocupación Recinto:</span>
                  <strong className="text-slate-800 font-mono font-extrabold">{totalInside} / {cmsConfig.allowedCapacity} personas</strong>
                </div>
                
                <div className="w-full sm:flex-1 sm:max-w-[150px] md:max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      totalInside >= cmsConfig.allowedCapacity * 0.85 ? 'bg-rose-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, (totalInside / cmsConfig.allowedCapacity) * 100)}%` }}
                  />
                </div>
              </div>

            </motion.div>
          ) : (
            /* ADMINISTRATIVE CONTROL SCREEN VIEW */
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full flex items-center justify-center min-h-[70vh]"
            >
              {currentAdmin && is2FAVerified ? (
                // Full Dashboard once logged in & authenticated with 2FA
                <div className="w-full">
                  <AdminDashboard />
                </div>
              ) : (
                // Safe credential checking & 2FA authenticator flow
                <div className="w-full py-6">
                  <AdminLogin onSuccess={() => setView('admin')} />
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Universal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>© 2026 DP-VISITAS. Diseñado con altos estándares de seguridad y concurrencia distributiva.</p>
          <div className="flex gap-4">
            <span>DB: <span className="text-green-500 font-bold">CONECTADA (Distribuida)</span></span>
            <span>Cloud: <span className="text-blue-500 font-bold">AWS/Azure Scalable</span></span>
          </div>
        </div>
      </footer>

      {/* Visitor Verification & Badge Info Modal */}
      {isVerificationModalOpen && (
        <VisitorVerificationModal
          isOpen={isVerificationModalOpen}
          initialQuery={badgeQuery || ''}
          onClose={handleCloseVerification}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
