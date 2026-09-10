/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, AlertTriangle, ArrowLeft, X } from 'lucide-react';
import { Visitor } from '../types';
import { useApp } from '../context/AppContext';
import { VisitorValidationCard } from './VisitorValidationCard';
import { findVisitorByCodeOrCedula } from '../utils/qrHelper';

interface VisitorVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const VisitorVerificationModal: React.FC<VisitorVerificationModalProps> = ({
  isOpen,
  onClose,
  initialQuery = ''
}) => {
  const { visitors, checkoutVisitor } = useApp();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery);
    } else if (isOpen) {
      setHasSearched(false);
      setSelectedVisitor(null);
    }
  }, [initialQuery, isOpen]);

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSelectedVisitor(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const found = findVisitorByCodeOrCedula(visitors, query);

    if (found) {
      setSelectedVisitor(found);
    } else {
      // Check if URL parameters contain fallback visitor data
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const fn = params.get('fn');
        const ln = params.get('ln');
        const c = params.get('c');
        const d = params.get('d');
        const h = params.get('h');
        if (fn && ln && c) {
          const fallbackVisitor: Visitor = {
            id: `vis-${params.get('badge') || 'qr'}`,
            firstName: fn,
            lastName: ln,
            cedula: c,
            department: d || 'General',
            hostName: h || 'Anfitrión',
            companyName: params.get('co') || undefined,
            status: (params.get('s') as 'inside' | 'checked_out') || 'inside',
            checkInTime: params.get('t') || new Date().toISOString(),
            checkOutTime: params.get('out') || undefined,
            notes: params.get('n') || undefined,
            credentialCode: params.get('badge') || query
          };
          setSelectedVisitor(fallbackVisitor);
          return;
        }
      }
      setSelectedVisitor(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleCheckout = (visitorId: string) => {
    checkoutVisitor(visitorId);
    // Refresh the selected visitor in state
    setSelectedVisitor((prev) => (prev ? { ...prev, status: 'checked_out', checkOutTime: new Date().toISOString() } : null));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg my-8 flex flex-col items-center"
        >
          {/* Top Search bar for querying by Credential Code or Cédula */}
          <div className="w-full mb-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-lg">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por código de credencial o cédula..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Validation Card Result */}
          {selectedVisitor ? (
            <VisitorValidationCard
              visitor={selectedVisitor}
              onClose={onClose}
              showCloseButton={true}
              onCheckout={() => handleCheckout(selectedVisitor.id)}
              onPrint={() => window.print()}
            />
          ) : hasSearched ? (
            <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No se encontró información</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No existe ninguna visita registrada con el código o cédula{' '}
                <span className="font-mono font-bold text-slate-700">"{searchQuery}"</span>.
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Verifique que el código alfanumérico o los números de cédula sean correctos.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver al Sistema</span>
              </button>
            </div>
          ) : (
            <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-100">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Consultar Ficha de Visitante</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Ingrese el código de credencial (ej. DPV-20260910-WNRC) o el número de cédula del visitante para visualizar su ficha oficial.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
