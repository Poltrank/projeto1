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
  resetProfile: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  clearUserHistory: (userId: string) => Promise<void>;
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
        setIsAdmin(
          user.email === 'adm@motoristafinancas.com' || 
          user.email === 'cassiomatsuoka@gmail.com' || 
          user.email === '47974008115@motoristapro.com' ||
          user.email === 'adm@motoristapro.com'
        );
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

  const resetProfile = async () => {
    if (!user) return;
    try {
      const { doc, collection, getDocs, writeBatch, query, where } = await import('firebase/firestore');
      
      const batch = writeBatch(db);
      const uid = user.uid;
      
      console.log("Starting full reset for UID:", uid);

      // 1. Clear ranking doc
      batch.delete(doc(db, 'ranking', uid));
      
      // 2. Clear subcollection transactions (standard)
      const subTransSnap = await getDocs(collection(db, `users/${uid}/transactions`));
      console.log(`Found ${subTransSnap.size} sub-transactions to delete`);
      subTransSnap.forEach((tDoc) => {
        batch.delete(tDoc.ref);
      });

      // 3. Clear potential top-level transactions (legacy or accidental)
      const topTransQ = query(collection(db, 'transactions'), where('userId', '==', uid));
      const topTransSnap = await getDocs(topTransQ);
      console.log(`Found ${topTransSnap.size} top-level transactions to delete`);
      topTransSnap.forEach((tDoc) => {
        batch.delete(tDoc.ref);
      });
      
      // 4. Clear user profile doc
      batch.delete(doc(db, 'users', uid));
      
      console.log("Committing reset batch...");
      await batch.commit();

      console.log("Reset complete. Signing out and reloading.");
      setProfile(null);
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("Error resetting profile:", error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin) throw new Error("Acesso negado");
    try {
      const { doc, collection, getDocs, writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      // 1. Clear ranking
      batch.delete(doc(db, 'ranking', userId));
      
      // 2. Clear transactions subcollection
      const transactionsSnap = await getDocs(collection(db, `users/${userId}/transactions`));
      transactionsSnap.forEach((tDoc) => {
        batch.delete(tDoc.ref);
      });
      
      // 3. Clear user profile doc
      batch.delete(doc(db, 'users', userId));
      
      await batch.commit();
    } catch (error) {
      console.error("Error deleting user data:", error);
      throw error;
    }
  };

  const clearUserHistory = async (userId: string) => {
    if (!isAdmin) throw new Error("Acesso negado");
    try {
      const { doc, collection, getDocs, writeBatch, serverTimestamp } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      // 1. Clear transactions subcollection
      const transactionsSnap = await getDocs(collection(db, `users/${userId}/transactions`));
      transactionsSnap.forEach((tDoc) => {
        batch.delete(tDoc.ref);
      });
      
      // 2. Reset totals in user doc
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        weeklyTotal: 0,
        monthlyTotal: 0,
        weeklyGross: 0,
        monthlyGross: 0,
        updatedAt: serverTimestamp()
      });
      
      // 3. Reset totals in ranking doc
      const rankingRef = doc(db, 'ranking', userId);
      // We use set with merge:true in case the doc doesn't exist
      batch.set(rankingRef, {
        weeklyTotal: 0,
        monthlyTotal: 0,
        weeklyGross: 0,
        monthlyGross: 0,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      await batch.commit();
      console.log(`History cleared successfully for ${userId}`);
    } catch (error) {
      console.error("Error clearing user history:", error);
      throw error;
    }
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
        
        // Handle ranking based on opt-in state
        if (profileData.rankingOptIn) {
          const rankingRef = doc(db, 'ranking', user.uid);
          await setDoc(rankingRef, {
            userId: user.uid,
            nickname: data.nickname || profileData.nickname,
            car: data.car || profileData.car,
            carType: data.carType || profileData.carType,
            weeklyTotal: data.weeklyTotal !== undefined ? data.weeklyTotal : profileData.weeklyTotal || 0,
            monthlyTotal: data.monthlyTotal !== undefined ? data.monthlyTotal : profileData.monthlyTotal || 0,
            weeklyGross: data.weeklyGross !== undefined ? data.weeklyGross : profileData.weeklyGross || 0,
            monthlyGross: data.monthlyGross !== undefined ? data.monthlyGross : profileData.monthlyGross || 0,
            monthlyInsurance: data.monthlyInsurance !== undefined ? data.monthlyInsurance : profileData.monthlyInsurance || 0,
            monthlyVehicleCost: data.monthlyVehicleCost !== undefined ? data.monthlyVehicleCost : profileData.monthlyVehicleCost || 0,
            monthlyInternet: data.monthlyInternet !== undefined ? data.monthlyInternet : profileData.monthlyInternet || 0,
            monthlyTires: data.monthlyTires !== undefined ? data.monthlyTires : profileData.monthlyTires || 0,
            monthlyMaintenance: data.monthlyMaintenance !== undefined ? data.monthlyMaintenance : profileData.monthlyMaintenance || 0,
            targetMonthlyNet: data.targetMonthlyNet !== undefined ? data.targetMonthlyNet : profileData.targetMonthlyNet || 0,
            targetDaysPerMonth: data.targetDaysPerMonth !== undefined ? data.targetDaysPerMonth : profileData.targetDaysPerMonth || 25,
            lastElectricityBill: data.lastElectricityBill !== undefined ? data.lastElectricityBill : profileData.lastElectricityBill || 0,
            updatedAt: serverTimestamp(),
          }, { merge: true });
          console.log("Ranking updated");
        } else {
          // If rankingOptIn is false, ensure ranking doc is deleted
          const { deleteDoc } = await import('firebase/firestore');
          const rankingRef = doc(db, 'ranking', user.uid);
          await deleteDoc(rankingRef);
          console.log("Ranking document removed (opted out)");
        }
      }
      console.log("Profile update complete");
    } catch (error: any) {
      console.error("Critical error updateProfile:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signUpPhone, signInPhone, logout, updateProfile, resetProfile, deleteUser, clearUserHistory }}>
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
