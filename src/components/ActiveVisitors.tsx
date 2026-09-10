/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, LogOut, Clock, ShieldCheck, UserMinus, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ActiveVisitors: React.FC = () => {
  const { visitors, checkoutVisitor } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only those who are currently inside (active)
  const activeVisitors = visitors.filter(
    (v) =>
      v.status === 'inside' &&
      (`${v.firstName} ${v.lastName} ${v.cedula} ${v.department} ${v.companyName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalInside = visitors.filter((v) => v.status === 'inside').length;

  const handleCheckout = (id: string) => {
    checkoutVisitor(id);
  };

  // Helper to get formatted elapsed time (or localized time)
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">Monitoreo en Vivo</h3>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                {totalInside} Activos
              </span>
            </div>
            <p className="text-xs text-slate-400">Control de permanencia activa</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o depto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {activeVisitors.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-3 bg-slate-50 text-slate-400 rounded-lg mb-3 border border-slate-100">
                <UserMinus className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                {totalInside === 0
                  ? 'No hay visitantes activos en este momento.'
                  : 'No se encontraron resultados para la búsqueda.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {totalInside === 0
                  ? 'Use el formulario de la izquierda para registrar un ingreso.'
                  : 'Intente buscar con otro término de búsqueda.'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {activeVisitors.map((visitor) => (
                <motion.div
                  key={visitor.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-xl flex items-start justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    {/* Visitor name & label */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-slate-800 truncate">
                        {visitor.firstName} {visitor.lastName}
                      </h4>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold tracking-wider">
                        CÉDULA: {visitor.cedula}
                      </span>
                      {visitor.companyName && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold uppercase tracking-wider">
                          {visitor.companyName}
                        </span>
                      )}
                    </div>

                    {/* Department and Host Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                      <div>
                        <span className="text-slate-400">Área:</span>{' '}
                        <span className="font-semibold text-slate-700">{visitor.department}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Visita a:</span>{' '}
                        <span className="font-medium text-slate-700 truncate inline-block max-w-[140px] align-bottom">
                          {visitor.hostName}
                        </span>
                      </div>
                    </div>

                    {/* Notes, if any */}
                    {visitor.notes && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                        <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate italic text-slate-500">"{visitor.notes}"</span>
                      </div>
                    )}

                    {/* Check-In Timestamp */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono pt-1">
                      <Clock className="h-3 w-3 text-emerald-500" />
                      <span>Ingreso: {formatTime(visitor.checkInTime)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={() => handleCheckout(visitor.id)}
                    className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase border border-red-200 hover:bg-red-50/50 rounded px-2.5 py-1.5 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    title="Registrar Salida del Visitante"
                  >
                    <LogOut className="h-3 w-3" />
                    <span>Salida</span>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>* Registre la salida una vez el visitante se retire.</span>
        <span className="font-mono text-[10px] uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded font-bold">
          CONEXIÓN CIFRADA CLOUD
        </span>
      </div>
    </div>
  );
};
