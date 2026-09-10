/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Visitor } from '../types';
import { ShieldCheck, FileText, Download, ArrowLeft, CheckCircle2, User, Landmark, Building2, Calendar, Clock, HelpCircle, Briefcase } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface BadgeVerificationViewProps {
  badgeCode: string;
  onClose: () => void;
}

// Function to convert OKLAB to RGB for html2canvas compatibility
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

// Function to convert OKLCH to RGB
const oklchToRgb = (l: number, c: number, h: number): [number, number, number] => {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  return oklabToRgb(l, a, b);
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
      const h = parseFloat(hStr);
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

export const BadgeVerificationView: React.FC<BadgeVerificationViewProps> = ({ badgeCode, onClose }) => {
  const { visitors } = useApp();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // 1. Try to find the visitor in the local context
    const found = visitors.find(
      (v) =>
        (v.credentialCode && v.credentialCode.toLowerCase() === badgeCode.toLowerCase()) ||
        v.id.toLowerCase() === badgeCode.toLowerCase()
    );

    if (found) {
      setVisitor(found);
      return;
    }

    // 2. Query Firestore database directly (for external devices scanning QR code)
    const fetchFromFirestore = async () => {
      try {
        // Try direct document ID lookup
        const docRef = doc(db, 'visitors', badgeCode);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          setVisitor(docSnap.data() as Visitor);
          return;
        }

        // Try credentialCode lookup
        const q = query(collection(db, 'visitors'), where('credentialCode', '==', badgeCode));
        const qSnap = await getDocs(q);
        if (!qSnap.empty && isMounted) {
          setVisitor(qSnap.docs[0].data() as Visitor);
          return;
        }
      } catch (err) {
        console.warn('Firestore direct query error:', err);
      }

      // 3. Fallback: Parse query parameters from URL as an offline backup
      if (isMounted) {
        const params = new URLSearchParams(window.location.search);
        const fn = params.get('fn');
        const ln = params.get('ln');
        const c = params.get('c');
        const d = params.get('d');
        const co = params.get('co');
        const n = params.get('n');
        const h = params.get('h');
        const t = params.get('t');

        if (fn && ln && c) {
          setVisitor({
            id: badgeCode,
            firstName: fn,
            lastName: ln,
            cedula: c,
            department: d || 'General',
            hostName: h || 'Recepción',
            status: 'inside',
            checkInTime: t || new Date().toISOString(),
            companyName: co || '',
            notes: n || '',
            credentialCode: badgeCode
          });
        }
      }
    };

    fetchFromFirestore();

    return () => {
      isMounted = false;
    };
  }, [badgeCode, visitors]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-badge-verified');
    if (!element || !visitor) return;

    setIsGeneratingPDF(true);
    
    const originalStylesheets: { element: HTMLElement; disabled: boolean }[] = [];
    let tempStyleTag: HTMLStyleElement | null = null;

    try {
      // 1. Gather all CSS rules / styles
      let combinedCSS = '';
      
      const styleTags = document.querySelectorAll('style');
      for (const tag of Array.from(styleTags)) {
        if (tag.id !== 'temp-pdf-styles-verified') {
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
      tempStyleTag.id = 'temp-pdf-styles-verified';
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
      await new Promise((resolve) => setTimeout(resolve, 200));

      const canvas = await html2canvas(element, {
        scale: 3, // Premium high-res scale for a crisp PDF output
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
      
      const imgWidth = 100; // Standard 100mm printable card size
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidth, imgHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Credencial-DPV-${visitor.firstName}-${visitor.lastName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
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

  if (!visitor) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <HelpCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">Credencial No Encontrada</h3>
          <p className="text-sm text-slate-500">
            El código <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-red-600">{badgeCode}</code> no corresponde a ningún visitante registrado en nuestro sistema.
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md flex items-center gap-2 mx-auto cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Kiosko</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-4 sm:p-6 space-y-8 animate-fade-in">
      
      {/* Verification Header Alert */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-emerald-950 shadow-sm">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="text-center sm:text-left space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 tracking-wider font-mono uppercase block">SISTEMA DE VERIFICACIÓN AUTORIZADO</span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-emerald-900">Credencial Escaneada de Manera Exitosa</h2>
          <p className="text-xs sm:text-sm text-emerald-700 font-medium">Los datos mostrados a continuación corresponden a un visitante registrado legalmente en las instalaciones.</p>
        </div>
        <button
          onClick={onClose}
          className="sm:ml-auto px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cerrar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Editable and Interactive Layout of Credential Card for Print */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm sticky top-24 space-y-4">
            
            <div className="text-center pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">VISTA PREVIA DEL DOCUMENTO</span>
            </div>

            {/* Credential Card styled element that matches the system's beautiful style */}
            <div
              id="printable-badge-verified"
              className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative"
            >
              {/* Header banner */}
              <div className="bg-blue-600 p-5 text-white text-center relative flex flex-col items-center justify-center">
                <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center mb-1">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold tracking-tight text-sm">DP-VISITAS CREDENCIAL</h3>
                <p className="text-[9px] font-mono tracking-widest text-blue-200 uppercase font-bold mt-0.5">Pase de Entrada Autorizado</p>
              </div>

              {/* Physical content */}
              <div className="p-6 space-y-5 bg-white">
                {/* QR Code and Code representing the credential */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                      `${window.location.origin}/?badge=${visitor.credentialCode || visitor.id}`
                    )}`}
                    alt="QR Credencial"
                    referrerPolicy="no-referrer"
                    className="w-32 h-32 bg-white shadow-inner p-1"
                  />
                  <div className="mt-3 text-center">
                    <span className="font-mono text-slate-800 text-xs font-bold tracking-wider">
                      {visitor.credentialCode || 'DP-VISITAS'}
                    </span>
                  </div>
                </div>

                {/* Visitor metadata list */}
                <div className="space-y-3.5 text-xs text-slate-700">
                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Nombre</span>
                    <span className="font-bold text-slate-900 text-right uppercase">
                      {visitor.firstName}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Apellido</span>
                    <span className="font-bold text-slate-900 text-right uppercase">
                      {visitor.lastName}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">No. Cédula</span>
                    <span className="font-bold text-slate-900 font-mono">{visitor.cedula}</span>
                  </div>

                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Área</span>
                    <span className="font-semibold text-slate-800 uppercase">{visitor.department}</span>
                  </div>

                  {visitor.companyName && (
                    <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Empresa</span>
                      <span className="font-semibold text-slate-800 text-right uppercase">{visitor.companyName}</span>
                    </div>
                  )}

                  {visitor.notes && (
                    <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Motivo</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[180px] break-words">{visitor.notes}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Anfitrión</span>
                    <span className="font-semibold text-slate-800 text-right">{visitor.hostName}</span>
                  </div>

                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-100 pb-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Ingreso</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {new Date(visitor.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(visitor.checkInTime).toLocaleDateString()})
                    </span>
                  </div>
                </div>

                {/* Card Footer Status */}
                <div className="pt-2 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    visitor.status === 'inside'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {visitor.status === 'inside' ? 'ACTIVO - EN EL RECINTO' : 'SALIDA REGISTRADA'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-98"
              >
                <Download className="h-4 w-4" />
                <span>{isGeneratingPDF ? 'Generando PDF...' : 'Descargar en Formato PDF'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: General Visitor Data Details Sheet */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <FileText className="text-blue-600 h-5 w-5" />
              Datos Generales del Visitante
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider font-mono uppercase ${
              visitor.status === 'inside' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {visitor.status === 'inside' ? 'En Planta' : 'Fuera de Planta'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre</span>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-bold text-slate-800 text-base uppercase">{visitor.firstName}</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Apellido</span>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-bold text-slate-800 text-base uppercase">{visitor.lastName}</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cédula de Identidad</span>
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-slate-400" />
                <span className="font-mono font-bold text-slate-800 text-base">{visitor.cedula}</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Área / Departamento</span>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="font-bold text-slate-800 uppercase">{visitor.department}</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre de Empresa</span>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-400" />
                <span className="font-bold text-slate-800 uppercase">{visitor.companyName || 'N/A (PARTICULAR)'}</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Código Credencial</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <span className="font-mono font-bold text-blue-600 tracking-wider">{visitor.credentialCode || visitor.id}</span>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nota / Motivo de Visita</span>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                <span className="font-medium text-slate-700 leading-relaxed text-sm">{visitor.notes || 'No se ingresaron notas o propósitos adicionales.'}</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Anfitrión Responsable</span>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-bold text-slate-800 text-sm">{visitor.hostName}</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha y Hora de Entrada</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="font-mono font-semibold text-slate-800 text-xs">
                  {new Date(visitor.checkInTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            {visitor.checkOutTime && (
              <div className="sm:col-span-2 space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block font-mono">Registro de Salida</span>
                <div className="flex items-center gap-2 text-rose-800">
                  <Clock className="h-4 w-4 text-rose-500" />
                  <span className="font-mono font-bold text-sm">
                    {new Date(visitor.checkOutTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            )}

          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] font-medium gap-3">
            <span className="flex items-center gap-1 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Certificado Firmado Digitalmente
            </span>
            <span className="font-mono">ID Único: {visitor.id}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
