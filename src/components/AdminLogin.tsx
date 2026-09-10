/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, User, AlertCircle, KeyRound, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminLogin: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { loginAdmin, verify2FA, currentAdmin, logoutAdmin } = useApp();
  
  // Login flow steps: 'credentials' | '2fa'
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  
  // Form values
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 2FA code regenerator simulation
  const [currentOtpCode, setCurrentOtpCode] = useState('123456');
  const [timeLeft, setTimeLeft] = useState(30);

  // Countdown timer simulation for 2FA authenticator
  useEffect(() => {
    if (step !== '2fa') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Generate new fake code when timer runs out
          const newCodes = ['123456', '888888', '654321', '777777', '909090'];
          const randomCode = newCodes[Math.floor(Math.random() * newCodes.length)];
          setCurrentOtpCode(randomCode);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Por favor, introduzca su usuario y contraseña de acceso.');
      return;
    }

    setLoading(true);
    
    // Simulate short server latency for high security look
    setTimeout(() => {
      setLoading(false);
      const result = loginAdmin(username);

      if (result.success) {
        if (result.requires2FA) {
          setStep('2fa');
          setError('');
        } else {
          onSuccess();
        }
      } else {
        setError(result.error || 'Credenciales inválidas.');
      }
    }, 800);
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpCode.length < 6) {
      setError('Por favor ingrese el código completo de 6 dígitos.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const result = verify2FA(otpCode);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Código incorrecto. Intente con el código mostrado abajo.');
      }
    }, 600);
  };

  const handleCancel = () => {
    logoutAdmin();
    setStep('credentials');
    setUsername('');
    setPassword('');
    setOtpCode('');
    setError('');
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
      <div className="p-8 md:p-10">
        {/* Logo / Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-4 shadow-md shadow-blue-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Acceso Administrativo</h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Consola de Control DP-VISITAS</p>
        </div>

        {/* Global Error Banner */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2.5 text-xs font-semibold"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 'credentials' ? (
            <motion.form
              key="credentials-form"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleCredentialsSubmit}
              className="space-y-4"
            >
              {/* Username Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Usuario Administrativo
                </label>
                <input
                  type="text"
                  placeholder="Ingrese su usuario (ej. admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Contraseña de Seguridad
                </label>
                <input
                  type="password"
                  placeholder="Ingrese su contraseña (ej. admin)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono font-medium text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-98"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Validar Credenciales</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
                <p>Credenciales de Demostración:</p>
                <p className="font-mono mt-1 font-semibold text-slate-600 bg-slate-50 py-1.5 rounded-md inline-block px-3 border border-slate-100">
                  Usuario: admin &nbsp;|&nbsp; Clave: admin
                </p>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="2fa-form"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              onSubmit={handle2FASubmit}
              className="space-y-4"
            >
              <div className="text-center bg-slate-50 p-4 rounded-xl border border-slate-200 mb-2">
                <div className="inline-flex p-2 bg-blue-50 text-blue-600 rounded-lg mb-2">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Verificación Doble Factor (2FA)</h4>
                <p className="text-[11px] text-slate-400 mt-1 px-2">
                  Código temporal de seguridad TOTP para el usuario <strong className="text-slate-600">{currentAdmin?.username}</strong>.
                </p>
              </div>

              {/* Authenticaton Code Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  Código de Seguridad de 6 Dígitos
                </label>
                
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    pattern="\d{6}"
                    required
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    className="w-40 tracking-[0.75em] text-center font-mono font-bold text-xl px-2 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-lg focus:outline-none transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Progress and Timer Simulation */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="flex items-center gap-1 font-medium">
                  <RefreshCw className="h-3 w-3 animate-spin text-slate-400" /> Nuevo código en:
                </span>
                <span className="font-mono font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                  {timeLeft} s
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition-all text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md shadow-blue-100 text-center flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Verificar</span>
                  )}
                </button>
              </div>

              {/* Interactive TOTP Visual Simulation Box */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col items-center gap-2 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                    SIMULADOR GOOGLE AUTHENTICATOR
                  </div>
                  
                  {/* Mock QR Code Pattern */}
                  <div className="w-16 h-16 bg-white p-1 rounded-md flex flex-wrap gap-0.5 justify-center items-center">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-xs ${
                          (i * 17 + timeLeft) % 3 === 0 ? 'bg-slate-900' : 'bg-slate-100'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="font-mono text-base font-bold tracking-widest text-emerald-400">
                    {currentOtpCode}
                  </div>
                  <p className="text-[10px] text-slate-400 px-1 leading-normal font-medium">
                    Use el código de demostración superior <strong className="text-white">{currentOtpCode}</strong> o <strong className="text-white">123456</strong> para validar el acceso.
                  </p>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
