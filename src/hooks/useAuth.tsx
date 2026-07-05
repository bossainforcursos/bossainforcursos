import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { generateDeviceId } from '../lib/utils';

interface UserProfile {
  email: string;
  deviceId?: string;
  ativo: boolean;
  isAdmin?: boolean;
  currentSessionId?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Use a snapshot to listen for session changes (concurrent login detection)
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            
            // Auto-promote owner to admin
            if (firebaseUser.email === 'bossainfor@gmail.com' && !data.isAdmin) {
              updateDoc(userDocRef, { isAdmin: true });
            }

            setProfile(data);
            
            // Check for concurrent login - Skip for Admins
            const storedSessionId = sessionStorage.getItem('sessionId');
            if (!data.isAdmin && data.currentSessionId && storedSessionId && data.currentSessionId !== storedSessionId) {
              setError("Sua conta foi acessada em outro navegador ou aba. A sessão anterior foi encerrada.");
              firebaseSignOut(auth);
            }
          } else {
            // New user, profile will be created on Register or first Login
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Firestore snapshot error:", err);
          setLoading(false);
          // Don't show critical error to user if it's just permission (will be handled by login flow)
          if (err.code !== 'permission-denied') {
            setError("Erro ao carregar perfil do usuário.");
          }
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const logout = async () => {
    sessionStorage.removeItem('sessionId');
    await firebaseSignOut(auth);
  };

  const checkSession = async (): Promise<boolean> => {
    if (!user) return false;
    
    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      const deviceId = generateDeviceId();
      const storedSessionId = sessionStorage.getItem('sessionId');

      // 1. Device ID check
      if (!data.isAdmin && data.deviceId && data.deviceId !== deviceId) {
        setError("Este dispositivo não está autorizado. Sua conta está vinculada a outro aparelho.");
        await logout();
        return false;
      }

      // 2. Session ID check
      if (!data.isAdmin && data.currentSessionId && storedSessionId && data.currentSessionId !== storedSessionId) {
        setError("Sessão expirada ou encerrada por novo login.");
        await logout();
        return false;
      }
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
