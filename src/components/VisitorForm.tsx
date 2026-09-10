/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  ClipboardList,
  Briefcase,
  UserCheck,
  CreditCard,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Printer,
  X,
  Check,
  Copy,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Visitor } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generateVisitorBadgeUrl } from '../utils/qrHelper';

// Function to convert OKLCH to RGB
const oklchToRgb = (l: number, c: number, h: number): [number, number, number] => {
  // If L is given as a percentage, convert it to 0-1 range
  const normalizedL = l > 1 ? l / 100 : l;
  const hueRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hueRad);
  const b = c * Math.sin(hueRad);

  const l_ = normalizedL + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = normalizedL - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = normalizedL - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLinear = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const toSRGB = (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 255;
    return Math.round((x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255);
  };

  return [toSRGB(rLinear), toSRGB(gLinear), toSRGB(bLinear)];
};

// Function to convert OKLAB to RGB
const oklabToRgb = (l: number, a: number, b: number): [number, number, number] => {
  const normalizedL = l > 1 ? l / 100 : l;
  
  const l_ = normalizedL + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = normalizedL - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = normalizedL - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLinear = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const toSRGB = (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 255;
    return Math.round((x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255);
  };

  return [toSRGB(rLinear), toSRGB(gLinear), toSRGB(bLinear)];
};

// Regex to capture oklch color values: oklch(L C H [/ A])
const oklchRegex = /oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)(?:\s*\/\s*([\d.%]+))?\s*\)/gi;

// Regex to capture oklab color values: oklab(L a b [/ A])
const oklabRegex = /oklab\(\s*([\d.]+%?)\s+([\d.-]+%?)\s+([\d.-]+%?)(?:\s*\/\s*([\d.%]+))?\s*\)/gi;

const replaceModernColorsInString = (str: string): string => {
  if (!str) return str;
  
  // Replace oklch
  let clean = str.replace(oklchRegex, (_match, lStr, cStr, hStr, aStr) => {
    try {
      const l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
      const c = cStr.endsWith('%') ? parseFloat(cStr) / 100 : parseFloat(cStr);
      const h = hStr.endsWith('%') ? parseFloat(hStr) / 100 : parseFloat(hStr);
      const [r, g, b] = oklchToRgb(l, c, h);
      
      if (aStr) {
        let alpha = aStr.trim();
        if (alpha.endsWith('%')) {
          alpha = (parseFloat(alpha) / 100).toString();
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return `rgb(${r}, ${g}, ${b})`;
    } catch (e) {
      return 'rgb(37, 99, 235)'; // Fallback to blue-600
    }
  });

  // Replace oklab
  clean = clean.replace(oklabRegex, (_match, lStr, aStrVal, bStrVal, alphaStr) => {
    try {
      const parsedL = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
      const parsedA = aStrVal.endsWith('%') ? parseFloat(aStrVal) / 100 : parseFloat(aStrVal);
      const parsedB = bStrVal.endsWith('%') ? parseFloat(bStrVal) / 100 : parseFloat(bStrVal);
      const [r, g, b] = oklabToRgb(parsedL, parsedA, parsedB);
      
      if (alphaStr) {
        let alpha = alphaStr.trim();
        if (alpha.endsWith('%')) {
          alpha = (parseFloat(alpha) / 100).toString();
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return `rgb(${r}, ${g}, ${b})`;
    } catch (e) {
      return 'rgb(37, 99, 235)'; // Fallback to blue-600
    }
  });

  return clean;
};

export const VisitorForm: React.FC = () => {
  const { departments, addVisitor, cmsConfig } = useApp();
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cedula, setCedula] = useState('');
  const [department, setDepartment] = useState('');
  const [hostName, setHostName] = useState('');
  const [notes, setNotes] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // Alert states
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Modal credential badge states
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [newlyRegistered, setNewlyRegistered] = useState<Visitor | null>(null);
  const [copiedBadgeCode, setCopiedBadgeCode] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-badge');
    if (!element) return;

    setIsGeneratingPDF(true);
    
    const originalStylesheets: { element: HTMLElement; disabled: boolean }[] = [];
    let tempStyleTag: HTMLStyleElement | null = null;

    try {
      // 1. Gather all CSS rules / styles
      let combinedCSS = '';
      
      const styleTags = document.querySelectorAll('style');
      for (const tag of Array.from(styleTags)) {
        if (tag.id !== 'temp-pdf-styles') {
          combinedCSS += '\n' + (tag.textContent || '');
        }
      }

      const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
      for (const link of Array.from(linkTags) as HTMLLinkElement[]) {
        try {
          if (link.href && (link.href.startsWith(window.location.origin) || link.href.startsWith('/'))) {
            const response = await fetch(link.href);
            if (response.ok) {
              combinedCSS += '\n' + await response.text();
            }
          }
        } catch (e) {
          console.warn('Could not fetch external stylesheet for PDF generation:', link.href, e);
        }
      }

      // 2. Convert all oklch() and oklab() colors to rgb/rgba in the CSS text
      const cleanCSS = replaceModernColorsInString(combinedCSS);

      // 3. Create a temporary stylesheet with the cleaned CSS
      tempStyleTag = document.createElement('style');
      tempStyleTag.id = 'temp-pdf-styles';
      tempStyleTag.textContent = cleanCSS;
      document.head.appendChild(tempStyleTag);

      // 4. Disable all original style and link tags to hide oklch from html2canvas
      styleTags.forEach((tag) => {
        const styleEl = tag as HTMLStyleElement;
        originalStylesheets.push({ element: styleEl, disabled: styleEl.disabled });
        styleEl.disabled = true;
      });
      linkTags.forEach((link) => {
        const linkEl = link as HTMLLinkElement;
        originalStylesheets.push({ element: linkEl, disabled: linkEl.disabled });
        linkEl.disabled = true;
      });

      // Small delay to make sure UI is fully settled with the new style rule
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(element, {
        scale: 2.5, // High resolution scale for a crisp PDF output
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Clean inline styles on elements in the cloned document as well
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const styleAttr = htmlEl.getAttribute('style');
            if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
              htmlEl.setAttribute('style', replaceModernColorsInString(styleAttr));
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 85; // Standard 85mm ID Badge width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidth, imgHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Carnet-Visitante-${newlyRegistered?.firstName || 'Visita'}-${newlyRegistered?.lastName || 'Autorizada'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF, falling back to standard print:', error);
      window.print();
    } finally {
      // 5. Restore original stylesheets
      originalStylesheets.forEach(({ element, disabled }) => {
        (element as any).disabled = disabled;
      });
      // 6. Remove the temporary style tag
      if (tempStyleTag && tempStyleTag.parentNode) {
        tempStyleTag.parentNode.removeChild(tempStyleTag);
      }
      setIsGeneratingPDF(false);
    }
  };

  // Handle automatic cédula formatting (001-0000000-0)
  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Keep only digits
    if (value.length > 11) value = value.slice(0, 11);
    
    // Format: 000-0000000-0
    let formatted = value;
    if (value.length > 3 && value.length <= 10) {
      formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length > 10) {
      formatted = `${value.slice(0, 3)}-${value.slice(3, 10)}-${value.slice(10)}`;
    }
    
    setCedula(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('');

    if (!firstName.trim() || !lastName.trim() || !cedula.trim() || !department || !hostName.trim()) {
      setStatus('error');
      setMessage('Por favor, rellene todos los campos obligatorios (*).');
      return;
    }

    // Minimum Cédula validation (DR style is 11 digits, formatted has 13 chars)
    if (cedula.replace(/\D/g, '').length < 11) {
      setStatus('error');
      setMessage('El número de cédula debe tener 11 dígitos.');
      return;
    }

    const result = addVisitor(firstName, lastName, cedula, department, hostName, notes, companyName);

    if (result.success) {
      if (result.visitor) {
        setNewlyRegistered(result.visitor);
        setShowCredentialModal(true);
      }
      setStatus('success');
      setMessage(`¡Registro exitoso! Bienvenido, ${firstName} ${lastName}. Su entrada ha sido registrada.`);
      
      // Reset form
      setFirstName('');
      setLastName('');
      setCedula('');
      setDepartment('');
      setHostName('');
      setNotes('');
      setCompanyName('');

      // Auto clear success message
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } else {
      setStatus('error');
      setMessage(result.error || 'Ocurrió un error al registrar la visita.');
    }
  };

  return (
    <div id="visitor-registration-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Registro de Visita</h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">DP-VISITAS SECURE ACCESS</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
              status === 'success'
                ? 'bg-emerald-50 border border-emerald-150 text-emerald-800'
                : 'bg-rose-50 border border-rose-150 text-rose-800'
            }`}
          >
            {status === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-semibold block">
                {status === 'success' ? 'Operación Exitosa' : 'Atención Requerida'}
              </span>
              <p className="mt-0.5 font-medium">{message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="h-3 w-3 text-slate-400" />
              Nombre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Juan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
            />
          </div>

          {/* Apellido */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="h-3 w-3 text-slate-400" />
              Apellido <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Pérez"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cédula */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="h-3 w-3 text-slate-400" />
              No. de Cédula <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="001-0000000-0"
              value={cedula}
              onChange={handleCedulaChange}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono font-medium text-slate-800"
            />
          </div>

          {/* Departamento */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="h-3 w-3 text-slate-400" />
              Departamento <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-slate-800 bg-white"
            >
              <option value="" disabled>Seleccione depto.</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.name}>
                  {dep.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* A quién visita */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-slate-400" />
            ¿A quién visita? <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Ing. Marcos Díaz"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
          />
        </div>

        {/* Nombre de la Empresa */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Briefcase className="h-3 w-3 text-slate-400" />
            Nombre de Empresa <span className="text-slate-300 font-normal text-[10px]">(Opcional)</span>
          </label>
          <input
            type="text"
            placeholder="Ej: Acme Corp, Servicios SRL..."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
          />
        </div>

        {/* Notas / Propósito */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FileText className="h-3 w-3 text-slate-400" />
            Notas / Motivo <span className="text-slate-300 font-normal text-[10px]">(Opcional)</span>
          </label>
          <textarea
            placeholder="Ej. Reunión comercial, Soporte..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium text-slate-800"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-98"
        >
          <CheckCircle2 className="h-4 w-4" />
          Registrar Entrada
        </button>

        {/* Reception Hours indicator */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-mono">
            <Clock className="h-3.5 w-3.5" /> Horario: {cmsConfig.receptionHours}
          </span>
          <span className="font-mono">Capacidad: {cmsConfig.allowedCapacity} máx.</span>
        </div>
      </form>

      {/* Dynamic Visitor Badge Modal Popup */}
      <AnimatePresence>
        {showCredentialModal && newlyRegistered && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:backdrop-blur-none">
            <motion.div
              id="printable-badge"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden relative print:border-none print:shadow-none print:rounded-none"
            >
              {/* Card Header banner */}
              <div className="bg-blue-600 p-5 text-white text-center relative flex flex-col items-center justify-center">
                <button
                  onClick={() => {
                    setShowCredentialModal(false);
                    setNewlyRegistered(null);
                  }}
                  className="absolute right-3.5 top-3.5 p-1 bg-blue-700 hover:bg-blue-800 text-blue-100 hover:text-white rounded-lg transition-colors cursor-pointer print:hidden"
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center mb-1">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold tracking-tight text-sm">DP-VISITAS CREDENCIAL</h3>
                <p className="text-[9px] font-mono tracking-widest text-blue-200 uppercase font-bold mt-0.5">Pase de Entrada Autorizado</p>
              </div>

              {/* Physical layout */}
              <div className="p-6 space-y-5">
                {/* QR Code and Credentials Identifier Code */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      generateVisitorBadgeUrl(newlyRegistered)
                    )}`}
                    alt="QR Credencial"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    className="w-36 h-36 bg-white shadow-inner p-1 rounded-lg"
                  />
                  
                  <div className="flex items-center gap-2 mt-4 print:hidden">
                    <span className="font-mono bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 tracking-wider">
                      {newlyRegistered.credentialCode}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newlyRegistered.credentialCode || '');
                        setCopiedBadgeCode(true);
                        setTimeout(() => setCopiedBadgeCode(false), 2000);
                      }}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-blue-600 text-slate-500 cursor-pointer active:scale-90 transition-all shadow-xs print:hidden"
                      title="Copiar código"
                    >
                      {copiedBadgeCode ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Print-only identifier code */}
                  <div className="hidden print:block mt-3 text-center">
                    <span className="font-mono text-slate-800 text-sm font-bold tracking-wider">
                      {newlyRegistered.credentialCode}
                    </span>
                  </div>
                </div>

                {/* Visitor Metadata details list */}
                <div className="space-y-3.5 text-xs text-slate-700">
                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Nombre completo</span>
                    <span className="font-bold text-slate-900 text-right">
                      {newlyRegistered.firstName} {newlyRegistered.lastName}
                    </span>
                  </div>
                  
                  {newlyRegistered.companyName && (
                    <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Empresa</span>
                      <span className="font-semibold text-slate-800 text-right uppercase">
                        {newlyRegistered.companyName}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">No. Cédula</span>
                    <span className="font-semibold text-slate-800 font-mono">{newlyRegistered.cedula}</span>
                  </div>

                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Visita a</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {newlyRegistered.hostName} ({newlyRegistered.department})
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Ingreso</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {new Date(newlyRegistered.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(newlyRegistered.checkInTime).toLocaleDateString()})
                    </span>
                  </div>
                </div>

                {/* Printable Action Buttons */}
                <div className="space-y-2 pt-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('badge', newlyRegistered.credentialCode || newlyRegistered.id);
                      window.history.pushState({}, '', url.toString());
                      window.dispatchEvent(new PopStateEvent('popstate'));
                      setShowCredentialModal(false);
                      setNewlyRegistered(null);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Ver Ficha de Información / Validación</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isGeneratingPDF}
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 flex-1 active:scale-95 disabled:cursor-not-allowed"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>{isGeneratingPDF ? 'Generando PDF...' : 'Imprimir Carnet'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCredentialModal(false);
                        setNewlyRegistered(null);
                      }}
                      className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 active:scale-95 border border-slate-200"
                    >
                      <span>Cerrar</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
