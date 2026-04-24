import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signUpPhone: (phone: string, password: string) => Promise<void>;
  signInPhone: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to format phone to internal email
  const phoneToEmail = (phone: string) => {
    const clean = phone.trim().replace(/\s/g, '');
    if (clean.toUpperCase() === 'ADM') return 'adm@motoristafinancas.com';
    // Check if it's already an email
    if (clean.includes('@')) return clean;
    return `${clean.replace(/\D/g, '')}@motoristapro.com`;
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        setIsAdmin(user.email === 'adm@motoristafinancas.com');
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
  }, []);

  const signInGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signUpPhone = async (phone: string, password: string) => {
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    await createUserWithEmailAndPassword(auth, phoneToEmail(phone), password);
  };

  const signInPhone = async (phone: string, password: string) => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    await signInWithEmailAndPassword(auth, phoneToEmail(phone), password);
  };

  const logout = () => signOut(auth);

  const deleteUser = async (userId: string) => {
    if (!isAdmin) throw new Error("Acesso negado");
    const { deleteDoc, doc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'users', userId));
    await deleteDoc(doc(db, 'ranking', userId));
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      console.warn("Attempted to update profile without a logged in user");
      return;
    }
    console.log("Updating profile for UID:", user.uid, "Data:", data);
    try {
      const docRef = doc(db, 'users', user.uid);
      const updatedData = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, updatedData, { merge: true });
      
      // Refresh profile state
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profileData = { uid: user.uid, ...docSnap.data() } as UserProfile;
        setProfile(profileData);
        
        // Update ranking if opted in
        if (updatedData.rankingOptIn || profileData.rankingOptIn) {
          const rankingRef = doc(db, 'ranking', user.uid);
          await setDoc(rankingRef, {
            userId: user.uid,
            nickname: data.nickname || profileData.nickname,
            car: data.car || profileData.car,
            carType: data.carType || profileData.carType,
            weeklyTotal: data.weeklyTotal !== undefined ? data.weeklyTotal : profileData.weeklyTotal || 0,
            updatedAt: serverTimestamp(),
          }, { merge: true });
          console.log("Ranking updated");
        }
      }
      console.log("Profile update complete");
    } catch (error: any) {
      console.error("Critical error updateProfile:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signUpPhone, signInPhone, logout, updateProfile, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
