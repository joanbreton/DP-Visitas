/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Visitor, Department, CMSConfig, AdminUser, DBClusterStatus, RealtimeNotification } from '../types';
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_CMS_CONFIG,
  DEFAULT_ADMINS,
  DEFAULT_VISITORS,
  DEFAULT_DB_CLUSTERS
} from '../initialData';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs
} from 'firebase/firestore';

interface AppContextProps {
  visitors: Visitor[];
  departments: Department[];
  cmsConfig: CMSConfig;
  admins: AdminUser[];
  currentAdmin: AdminUser | null;
  is2FAVerified: boolean;
  dbClusters: DBClusterStatus[];
  notifications: RealtimeNotification[];
  isFirestoreConnected: boolean;
  isSyncing: boolean;
  addVisitor: (
    firstName: string,
    lastName: string,
    cedula: string,
    department: string,
    hostName: string,
    notes?: string,
    companyName?: string
  ) => { success: boolean; error?: string; visitor?: Visitor };
  checkoutVisitor: (id: string) => { success: boolean };
  deleteVisitorRecord: (id: string) => void;
  addDepartment: (name: string) => { success: boolean; error?: string };
  removeDepartment: (id: string) => { success: boolean };
  updateCMSConfig: (newConfig: CMSConfig) => void;
  addAdmin: (admin: Omit<AdminUser, 'id' | 'createdAt' | 'twoFactorSecret'>) => { success: boolean; error?: string };
  updateAdmin: (id: string, updatedFields: Partial<AdminUser>) => void;
  deleteAdmin: (id: string) => { success: boolean; error?: string };
  loginAdmin: (username: string) => { success: boolean; requires2FA: boolean; admin?: AdminUser; error?: string };
  verify2FA: (code: string) => { success: boolean; error?: string };
  logoutAdmin: () => void;
  simulateDbSync: () => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local caching states initialized from localStorage or defaults
  const [visitors, setVisitors] = useState<Visitor[]>(() => {
    const stored = localStorage.getItem('dp_visitas_visitors');
    return stored ? JSON.parse(stored) : DEFAULT_VISITORS;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const stored = localStorage.getItem('dp_visitas_departments');
    return stored ? JSON.parse(stored) : DEFAULT_DEPARTMENTS;
  });

  const [cmsConfig, setCmsConfig] = useState<CMSConfig>(() => {
    const stored = localStorage.getItem('dp_visitas_cms_config');
    return stored ? JSON.parse(stored) : DEFAULT_CMS_CONFIG;
  });

  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    const stored = localStorage.getItem('dp_visitas_admins');
    return stored ? JSON.parse(stored) : DEFAULT_ADMINS;
  });

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem('dp_visitas_current_admin');
    return stored ? JSON.parse(stored) : null;
  });

  const [is2FAVerified, setIs2FAVerified] = useState<boolean>(() => {
    const stored = localStorage.getItem('dp_visitas_2fa_verified');
    return stored === 'true';
  });

  const [dbClusters, setDbClusters] = useState<DBClusterStatus[]>(() => {
    const stored = localStorage.getItem('dp_visitas_db_clusters');
    return stored ? JSON.parse(stored) : DEFAULT_DB_CLUSTERS;
  });

  const [notifications, setNotifications] = useState<RealtimeNotification[]>(() => {
    const stored = localStorage.getItem('dp_visitas_notifications');
    return stored ? JSON.parse(stored) : [];
  });

  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Seeding refs to prevent duplicate bootstrap loops
  const hasSeededVisitorsRef = useRef(false);
  const hasSeededDeptRef = useRef(false);
  const hasSeededConfigRef = useRef(false);
  const hasSeededAdminsRef = useRef(false);

  // Sync to localStorage as offline fallback
  useEffect(() => {
    localStorage.setItem('dp_visitas_visitors', JSON.stringify(visitors));
  }, [visitors]);

  useEffect(() => {
    localStorage.setItem('dp_visitas_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('dp_visitas_cms_config', JSON.stringify(cmsConfig));
  }, [cmsConfig]);

  useEffect(() => {
    localStorage.setItem('dp_visitas_admins', JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem('dp_visitas_current_admin', currentAdmin ? JSON.stringify(currentAdmin) : '');
    localStorage.setItem('dp_visitas_2fa_verified', String(is2FAVerified));
  }, [currentAdmin, is2FAVerified]);

  useEffect(() => {
    localStorage.setItem('dp_visitas_db_clusters', JSON.stringify(dbClusters));
  }, [dbClusters]);

  useEffect(() => {
    localStorage.setItem('dp_visitas_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // =========================================================================
  // CLOUD FIRESTORE REAL-TIME SYNCHRONIZATION
  // =========================================================================
  useEffect(() => {
    // 1. Visitors Collection Listener
    const visitorsUnsub = onSnapshot(
      collection(db, 'visitors'),
      (snapshot) => {
        setIsFirestoreConnected(true);
        if (snapshot.empty && !hasSeededVisitorsRef.current) {
          hasSeededVisitorsRef.current = true;
          // Seed initial visitors into Firestore so the database is populated and persistent
          const itemsToSeed = visitors.length > 0 ? visitors : DEFAULT_VISITORS;
          itemsToSeed.forEach((item) => {
            setDoc(doc(db, 'visitors', item.id), item).catch((err) => {
              console.error('Error seeding visitor to Firestore:', err);
            });
          });
        } else if (!snapshot.empty) {
          hasSeededVisitorsRef.current = true;
          const remoteVisitors: Visitor[] = [];
          snapshot.forEach((docSnap) => {
            remoteVisitors.push(docSnap.data() as Visitor);
          });
          // Sort descending by checkInTime
          remoteVisitors.sort(
            (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
          );
          setVisitors(remoteVisitors);
        }
      },
      (error) => {
        console.warn('Firestore visitors listener error:', error);
        if (error.code === 'permission-denied') {
          console.error('Verifique las reglas de seguridad de Firestore para /visitors');
        }
        setIsFirestoreConnected(false);
      }
    );

    // 2. Departments Collection Listener
    const departmentsUnsub = onSnapshot(
      collection(db, 'departments'),
      (snapshot) => {
        if (snapshot.empty && !hasSeededDeptRef.current) {
          hasSeededDeptRef.current = true;
          const itemsToSeed = departments.length > 0 ? departments : DEFAULT_DEPARTMENTS;
          itemsToSeed.forEach((item) => {
            setDoc(doc(db, 'departments', item.id), item).catch((err) => {
              console.error('Error seeding department to Firestore:', err);
            });
          });
        } else if (!snapshot.empty) {
          hasSeededDeptRef.current = true;
          const remoteDeps: Department[] = [];
          snapshot.forEach((docSnap) => {
            remoteDeps.push(docSnap.data() as Department);
          });
          setDepartments(remoteDeps);
        }
      },
      (error) => {
        console.warn('Firestore departments listener error:', error);
      }
    );

    // 3. CMS Config Document Listener
    const configUnsub = onSnapshot(
      doc(db, 'config', 'cms'),
      (docSnap) => {
        if (!docSnap.exists() && !hasSeededConfigRef.current) {
          hasSeededConfigRef.current = true;
          setDoc(doc(db, 'config', 'cms'), cmsConfig).catch((err) => {
            console.error('Error seeding CMS config to Firestore:', err);
          });
        } else if (docSnap.exists()) {
          hasSeededConfigRef.current = true;
          setCmsConfig(docSnap.data() as CMSConfig);
        }
      },
      (error) => {
        console.warn('Firestore config listener error:', error);
      }
    );

    // 4. Notifications Collection Listener
    const notifsUnsub = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteNotifs: RealtimeNotification[] = [];
          snapshot.forEach((docSnap) => {
            remoteNotifs.push(docSnap.data() as RealtimeNotification);
          });
          // Sort descending by timestamp
          remoteNotifs.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setNotifications(remoteNotifs);
        }
      },
      (error) => {
        console.warn('Firestore notifications listener error:', error);
      }
    );

    // 5. Admins Collection Listener
    const adminsUnsub = onSnapshot(
      collection(db, 'admins'),
      (snapshot) => {
        if (snapshot.empty && !hasSeededAdminsRef.current) {
          hasSeededAdminsRef.current = true;
          const itemsToSeed = admins.length > 0 ? admins : DEFAULT_ADMINS;
          itemsToSeed.forEach((item) => {
            setDoc(doc(db, 'admins', item.id), item).catch((err) => {
              console.error('Error seeding admin to Firestore:', err);
            });
          });
        } else if (!snapshot.empty) {
          hasSeededAdminsRef.current = true;
          const remoteAdmins: AdminUser[] = [];
          snapshot.forEach((docSnap) => {
            remoteAdmins.push(docSnap.data() as AdminUser);
          });
          setAdmins(remoteAdmins);
        }
      },
      (error) => {
        console.warn('Firestore admins listener error:', error);
      }
    );

    return () => {
      visitorsUnsub();
      departmentsUnsub();
      configUnsub();
      notifsUnsub();
      adminsUnsub();
    };
  }, []);

  // =========================================================================
  // ACTIONS & TRANSACTIONS
  // =========================================================================

  const addVisitor = (
    firstName: string,
    lastName: string,
    cedula: string,
    department: string,
    hostName: string,
    notes?: string,
    companyName?: string
  ) => {
    // Basic verification
    if (!firstName.trim() || !lastName.trim() || !cedula.trim() || !department || !hostName.trim()) {
      return { success: false, error: 'Por favor, complete todos los campos obligatorios.' };
    }

    // Check capacity limit
    const insideCount = visitors.filter((v) => v.status === 'inside').length;
    if (insideCount >= cmsConfig.allowedCapacity) {
      return {
        success: false,
        error: `Se ha alcanzado el límite de capacidad de visitas simultáneas (${cmsConfig.allowedCapacity}). Espere a que alguien se retire.`
      };
    }

    // Check if the same cedula is already registered as inside
    const alreadyInside = visitors.find((v) => v.cedula === cedula && v.status === 'inside');
    if (alreadyInside) {
      return {
        success: false,
        error: `Esta persona ya se encuentra registrada en las instalaciones (ingresó a las ${new Date(
          alreadyInside.checkInTime
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`
      };
    }

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const credentialCode = `DPV-${year}${month}${day}-${rand}`;

    const newVisitor: Visitor = {
      id: `vis-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      cedula: cedula.trim(),
      department,
      hostName: hostName.trim(),
      status: 'inside',
      checkInTime: new Date().toISOString(),
      notes: notes?.trim() || '',
      credentialCode,
      companyName: companyName?.trim() || ''
    };

    // Optimistically update local state for instantaneous responsiveness
    setVisitors((prev) => [newVisitor, ...prev]);

    // Persist to Cloud Firestore database securely
    setDoc(doc(db, 'visitors', newVisitor.id), newVisitor).catch((err) => {
      console.error('Error guardando visitante en Firestore:', err);
    });

    // Create real-time notification
    const newNotification: RealtimeNotification = {
      id: `notif-${Date.now()}`,
      visitorName: `${firstName.trim()} ${lastName.trim()}`,
      hostName: hostName.trim(),
      department,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [newNotification, ...prev]);
    setDoc(doc(db, 'notifications', newNotification.id), newNotification).catch((err) => {
      console.error('Error guardando notificación en Firestore:', err);
    });

    // Update department stats
    setDepartments((prevDeps) =>
      prevDeps.map((d) => (d.name === department ? { ...d, count: d.count + 1 } : d))
    );
    const targetDept = departments.find((d) => d.name === department);
    if (targetDept) {
      updateDoc(doc(db, 'departments', targetDept.id), { count: targetDept.count + 1 }).catch(
        (err) => {
          console.error('Error actualizando departamento en Firestore:', err);
        }
      );
    }

    // Reflect Cloud Database activity in cluster monitors
    setDbClusters((prev) =>
      prev.map((c) => ({
        ...c,
        status: 'replicating',
        activeConnections: c.activeConnections + 1,
        lastSync: 'Sincronizado'
      }))
    );
    setTimeout(() => {
      setDbClusters((prev) =>
        prev.map((c) => ({
          ...c,
          status: 'healthy',
          lastSync: 'En tiempo real'
        }))
      );
    }, 1200);

    return { success: true, visitor: newVisitor };
  };

  const checkoutVisitor = (id: string) => {
    const now = new Date().toISOString();
    setVisitors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'checked_out', checkOutTime: now } : v))
    );

    // Persist checkout timestamp and status in Firestore
    updateDoc(doc(db, 'visitors', id), {
      status: 'checked_out',
      checkOutTime: now
    }).catch((err) => {
      console.error('Error actualizando salida de visitante en Firestore:', err);
    });

    // Update Cluster Status indicator
    setDbClusters((prev) =>
      prev.map((c) => ({
        ...c,
        status: 'replicating',
        activeConnections: Math.max(10, c.activeConnections - 1)
      }))
    );
    setTimeout(() => {
      setDbClusters((prev) =>
        prev.map((c) => ({
          ...c,
          status: 'healthy',
          lastSync: 'En tiempo real'
        }))
      );
    }, 1000);

    return { success: true };
  };

  const deleteVisitorRecord = (id: string) => {
    const visitorToDelete = visitors.find((v) => v.id === id);
    if (visitorToDelete) {
      setDepartments((prevDeps) =>
        prevDeps.map((d) =>
          d.name === visitorToDelete.department && d.count > 0 ? { ...d, count: d.count - 1 } : d
        )
      );
      const targetDept = departments.find((d) => d.name === visitorToDelete.department);
      if (targetDept && targetDept.count > 0) {
        updateDoc(doc(db, 'departments', targetDept.id), { count: targetDept.count - 1 }).catch(
          console.error
        );
      }
    }
    setVisitors((prev) => prev.filter((v) => v.id !== id));

    // Delete in Firestore
    deleteDoc(doc(db, 'visitors', id)).catch((err) => {
      console.error('Error eliminando visitante de Firestore:', err);
    });
  };

  const addDepartment = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'El nombre del departamento no puede estar vacío.' };

    const exists = departments.some((d) => d.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return { success: false, error: 'Este departamento ya existe.' };

    const newDep: Department = {
      id: `dep-${Date.now()}`,
      name: trimmed,
      count: 0
    };

    setDepartments((prev) => [...prev, newDep]);
    setDoc(doc(db, 'departments', newDep.id), newDep).catch((err) => {
      console.error('Error guardando departamento en Firestore:', err);
    });

    return { success: true };
  };

  const removeDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    deleteDoc(doc(db, 'departments', id)).catch((err) => {
      console.error('Error eliminando departamento de Firestore:', err);
    });
    return { success: true };
  };

  const updateCMSConfig = (newConfig: CMSConfig) => {
    setCmsConfig(newConfig);
    setDoc(doc(db, 'config', 'cms'), newConfig).catch((err) => {
      console.error('Error actualizando configuración en Firestore:', err);
    });
  };

  const addAdmin = (newAdminData: Omit<AdminUser, 'id' | 'createdAt' | 'twoFactorSecret'>) => {
    const usernameTrimmed = newAdminData.username.toLowerCase().trim();
    if (admins.some((a) => a.username.toLowerCase() === usernameTrimmed)) {
      return { success: false, error: 'El nombre de usuario ya está registrado.' };
    }

    const newAdmin: AdminUser = {
      ...newAdminData,
      id: `adm-${Date.now()}`,
      twoFactorSecret: `DP-VISITAS-${usernameTrimmed.toUpperCase()}-2FA`,
      createdAt: new Date().toISOString()
    };

    setAdmins((prev) => [...prev, newAdmin]);
    setDoc(doc(db, 'admins', newAdmin.id), newAdmin).catch((err) => {
      console.error('Error guardando administrador en Firestore:', err);
    });

    return { success: true };
  };

  const updateAdmin = (id: string, updatedFields: Partial<AdminUser>) => {
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, ...updatedFields } : a)));
    if (currentAdmin && currentAdmin.id === id) {
      setCurrentAdmin((prev) => (prev ? { ...prev, ...updatedFields } : null));
    }
    updateDoc(doc(db, 'admins', id), updatedFields).catch((err) => {
      console.error('Error actualizando administrador en Firestore:', err);
    });
  };

  const deleteAdmin = (id: string) => {
    if (id === 'adm-1') {
      return { success: false, error: 'No se puede eliminar el administrador principal de la plataforma.' };
    }
    if (currentAdmin && currentAdmin.id === id) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta mientras estás logueado.' };
    }
    setAdmins((prev) => prev.filter((a) => a.id !== id));
    deleteDoc(doc(db, 'admins', id)).catch((err) => {
      console.error('Error eliminando administrador en Firestore:', err);
    });
    return { success: true };
  };

  const loginAdmin = (username: string) => {
    const user = username.toLowerCase().trim();
    const admin = admins.find((a) => a.username.toLowerCase() === user);

    if (!admin) {
      return { success: false, requires2FA: false, error: 'Usuario no encontrado. Use "admin" para demostración.' };
    }

    if (admin.twoFactorEnabled) {
      setCurrentAdmin(admin);
      setIs2FAVerified(false);
      return { success: true, requires2FA: true, admin };
    } else {
      setCurrentAdmin(admin);
      setIs2FAVerified(true);
      return { success: true, requires2FA: false, admin };
    }
  };

  const verify2FA = (code: string) => {
    if (code === '123456' || code === '654321' || code === '888888' || code.trim().length === 6) {
      setIs2FAVerified(true);
      return { success: true };
    }
    return {
      success: false,
      error: 'Código de autenticación inválido. Ingrese "123456" o cualquier código de 6 dígitos de prueba.'
    };
  };

  const logoutAdmin = () => {
    setCurrentAdmin(null);
    setIs2FAVerified(false);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    updateDoc(doc(db, 'notifications', id), { read: true }).catch((err) => {
      console.error('Error marcando notificación en Firestore:', err);
    });
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    } catch (err) {
      console.error('Error eliminando notificaciones en Firestore:', err);
    }
  };

  const simulateDbSync = () => {
    setIsSyncing(true);
    setDbClusters((prev) =>
      prev.map((c) => ({
        ...c,
        status: 'syncing',
        latency: Math.floor(Math.random() * 8) + 4
      }))
    );
    setTimeout(() => {
      setIsSyncing(false);
      setDbClusters((prev) =>
        prev.map((c) => ({
          ...c,
          status: 'healthy',
          lastSync: 'En tiempo real'
        }))
      );
    }, 1000);
  };

  return (
    <AppContext.Provider
      value={{
        visitors,
        departments,
        cmsConfig,
        admins,
        currentAdmin,
        is2FAVerified,
        dbClusters,
        notifications,
        isFirestoreConnected,
        isSyncing,
        addVisitor,
        checkoutVisitor,
        deleteVisitorRecord,
        addDepartment,
        removeDepartment,
        updateCMSConfig,
        addAdmin,
        updateAdmin,
        deleteAdmin,
        loginAdmin,
        verify2FA,
        logoutAdmin,
        simulateDbSync,
        markNotificationAsRead,
        clearAllNotifications
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
