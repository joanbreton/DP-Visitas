/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Building,
  Building2,
  User,
  Copy,
  Check,
  LogOut,
  Printer,
  X,
  Clock,
  FileText
} from 'lucide-react';
import { Visitor } from '../types';
import { generateVisitorBadgeUrl } from '../utils/qrHelper';

interface VisitorValidationCardProps {
  visitor: Visitor;
  onClose?: () => void;
  onCheckout?: () => void;
  onPrint?: () => void;
  showCloseButton?: boolean;
}

export const VisitorValidationCard: React.FC<VisitorValidationCardProps> = ({
  visitor,
  onClose,
  onCheckout,
  onPrint,
  showCloseButton = false
}) => {
  const [copied, setCopied] = useState(false);

  const qrUrl = generateVisitorBadgeUrl(visitor);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    qrUrl
  )}`;

  const handleCopyCode = () => {
    const code = visitor.credentialCode || visitor.id;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isInside = visitor.status === 'inside';

  // Format entry and exit dates
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleString([], {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden relative transition-all">
      {/* Top Banner Ribbon */}
      <div
        className={`py-3 px-5 text-center font-mono text-xs font-bold tracking-widest text-white uppercase flex items-center justify-between ${
          isInside ? 'bg-slate-800' : 'bg-slate-800'
        }`}
      >
        <div className="flex items-center justify-center gap-2 mx-auto">
          <ShieldCheck className={`h-4 w-4 ${isInside ? 'text-emerald-400' : 'text-slate-300'}`} />
          <span>{isInside ? 'VISITANTE EN PLANTA (ACTIVO)' : 'VISITANTE YA RETIRADO'}</span>
        </div>

        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="Cerrar ficha"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-6 space-y-5">
        {/* Visitor Name & QR Code Header Row */}
        <div className="flex justify-between items-start gap-4">
          {/* Left Column: Visitor Identification */}
          <div className="flex-1 min-w-0 pr-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              NOMBRE DEL VISITANTE
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mt-1 break-words">
              {visitor.firstName} {visitor.lastName}
            </h3>

            {visitor.companyName && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-[180px]">{visitor.companyName}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 font-mono mt-2 font-medium">
              Cédula:{' '}
              <span className="font-semibold text-slate-800 font-mono">{visitor.cedula}</span>
            </p>
          </div>

          {/* Right Column: QR Code & Credential Code */}
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center shrink-0">
            <img
              src={qrImageUrl}
              alt="QR Credencial"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-lg"
            />
            <span className="text-[10px] font-mono font-bold text-slate-600 tracking-wider mt-1.5 text-center">
              {visitor.credentialCode || visitor.id}
            </span>
          </div>
        </div>

        {/* Host & Department Detailed Box */}
        <div className="bg-sky-50/40 border border-sky-100/90 rounded-2xl p-4 space-y-3.5">
          {/* Host Item */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                PERSONA A QUIEN VISITA (ANFITRIÓN)
              </span>
              <span className="text-sm font-bold text-slate-900 block truncate mt-0.5">
                {visitor.hostName}
              </span>
            </div>
          </div>

          <div className="border-t border-sky-100" />

          {/* Department Item */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Building className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                DEPARTAMENTO QUE VA A VISITAR
              </span>
              <span className="text-sm font-bold text-slate-900 block truncate mt-0.5">
                {visitor.department}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Notes */}
        {visitor.notes && (
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start gap-2 text-xs text-slate-600">
            <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                MOTIVO / OBSERVACIONES
              </span>
              <p className="mt-0.5 text-slate-700">{visitor.notes}</p>
            </div>
          </div>
        )}

        {/* Entry and Exit Timestamps */}
        <div className="grid grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              HORA DE ENTRADA
            </span>
            <span className="font-semibold font-mono text-slate-800 text-xs block mt-0.5">
              {formatDateTime(visitor.checkInTime)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              HORA DE SALIDA
            </span>
            <span className="font-semibold text-xs block mt-0.5">
              {visitor.checkOutTime ? (
                <span className="font-mono text-slate-800">
                  {formatDateTime(visitor.checkOutTime)}
                </span>
              ) : (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En estancia activa
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="pt-2 flex items-center gap-2 flex-wrap border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-200 cursor-pointer active:scale-95 transition-all shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>Copiar Código</span>
              </>
            )}
          </button>

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-blue-200 active:scale-95"
            >
              <Printer className="h-3.5 w-3.5 text-blue-600" />
              <span>Imprimir Carnet</span>
            </button>
          )}

          {isInside && onCheckout && (
            <button
              type="button"
              onClick={onCheckout}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ml-auto"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Registrar Salida</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
