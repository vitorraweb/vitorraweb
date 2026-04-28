import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  signOut as fbSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────
export type UserRole = 'b2c' | 'b2b' | 'admin' | 'Super Admin' | 'Ops Manager' | 'Viewer';

export interface Address {
  id: string;
  label: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  type: 'billing' | 'shipping' | 'both';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  photoURL: string;
  company: {
    name: string;
    registrationNo: string;
    taxId: string;
    website: string;
  };
  addresses: Address[];
  preferences: {
    language: string;
    currency: string;
    emailNotifications: {
      orderUpdates: boolean;
      promotions: boolean;
      newsletter: boolean;
    };
  };
  role: UserRole;
  accountType: 'individual' | 'business';
  status: 'active' | 'suspended';
  emailVerified: boolean;
  providers: string[];
  createdAt: string;
  lastLoginAt: string;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name: string, accountType: 'individual' | 'business', companyData?: { name: string; taxId: string; registrationNo: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (addressId: string, data: Partial<Address>) => Promise<void>;
  removeAddress: (addressId: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  // Legacy compat — some components access user.role, user.name etc.
  user: { id: string; name: string; email: string; role: UserRole } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PROFILE: Omit<UserProfile, 'uid' | 'displayName' | 'email' | 'createdAt' | 'lastLoginAt' | 'providers' | 'emailVerified'> = {
  phone: '',
  photoURL: '',
  company: { name: '', registrationNo: '', taxId: '', website: '' },
  addresses: [],
  preferences: {
    language: 'en',
    currency: 'UGX',
    emailNotifications: { orderUpdates: true, promotions: false, newsletter: false },
  },
  role: 'b2c',
  accountType: 'individual',
  status: 'active',
};

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!auth) { setLoading(false); return; }

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser && db) {
        // Listen to Firestore profile in real-time
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            // First-time user — create profile doc
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              displayName: fbUser.displayName || '',
              email: fbUser.email || '',
              emailVerified: fbUser.emailVerified,
              providers: fbUser.providerData.map(p => p.providerId),
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              ...DEFAULT_PROFILE,
              photoURL: fbUser.photoURL || '',
            };
            await setDoc(userRef, newProfile).catch(e => console.warn('setDoc failed', e));
            setProfile(newProfile);
          } else {
            const data = userSnap.data() as UserProfile;
            setProfile(data);
            // Update last login
            await updateDoc(userRef, { lastLoginAt: new Date().toISOString() }).catch(() => {});
          }

          // Real-time listener for profile changes
          const unsubProfile = onSnapshot(userRef, (snap) => {
            if (snap.exists()) setProfile(snap.data() as UserProfile);
          }, (err) => console.warn('onSnapshot failed', err));

          setLoading(false);
          return () => unsubProfile();
        } catch (error) {
          console.error("Failed to fetch user profile from Firestore:", error);
          // Fallback profile so it doesn't infinite load
          setProfile({
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'User',
            email: fbUser.email || '',
            emailVerified: fbUser.emailVerified,
            providers: fbUser.providerData.map(p => p.providerId),
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            ...DEFAULT_PROFILE,
            photoURL: fbUser.photoURL || '',
          });
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);



  const signUp = async (email: string, password: string, name: string, accountType: 'individual' | 'business', companyData?: { name: string; taxId: string; registrationNo: string }) => {
    if (!auth) throw new Error('Authentication not configured');
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await fbUpdateProfile(cred.user, { displayName: name });

      if (db) {
        const newProfile: UserProfile = {
          uid: cred.user.uid,
          displayName: name,
          email: email,
          emailVerified: false,
          providers: ['password'],
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          ...DEFAULT_PROFILE,
          accountType,
          role: accountType === 'business' ? 'b2b' : 'b2c',
          company: companyData ? { ...companyData, website: '' } : DEFAULT_PROFILE.company,
        };
        await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      }
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use' ? 'An account with this email already exists.'
                : err.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
                : err.code === 'auth/invalid-email' ? 'Please enter a valid email address.'
                : err.message || 'Registration failed.';
      setError(msg);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Authentication not configured');
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with this email.'
                : err.code === 'auth/wrong-password' ? 'Incorrect password.'
                : err.code === 'auth/invalid-credential' ? 'Invalid email or password.'
                : err.code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.'
                : err.message || 'Sign in failed.';
      setError(msg);
      throw err;
    }
  };

  const signInWithGoogleFn = async () => {
    if (!auth) throw new Error('Authentication not configured');
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        const msg = err.code === 'auth/account-exists-with-different-credential'
          ? 'An account already exists with this email using a different sign-in method.'
          : err.message || 'Google sign-in failed.';
        setError(msg);
        throw err;
      }
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Authentication not configured');
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with this email.'
                : err.message || 'Password reset failed.';
      setError(msg);
      throw err;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!db || !profile) return;
    await updateDoc(doc(db, 'users', profile.uid), data);
    if (auth?.currentUser) {
      const authUpdate: { displayName?: string; photoURL?: string } = {};
      if (data.displayName) authUpdate.displayName = data.displayName;
      if (data.photoURL !== undefined) authUpdate.photoURL = data.photoURL || null as any;
      if (Object.keys(authUpdate).length > 0) {
        await fbUpdateProfile(auth.currentUser, authUpdate);
      }
    }
  };

  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!db || !profile) return;
    const id = `addr_${Date.now()}`;
    const newAddress: Address = { ...address, id };
    const updated = [...(profile.addresses || [])];
    // If this is default, unset others
    if (newAddress.isDefault) {
      updated.forEach(a => a.isDefault = false);
    }
    updated.push(newAddress);
    await updateDoc(doc(db, 'users', profile.uid), { addresses: updated });
  };

  const updateAddress = async (addressId: string, data: Partial<Address>) => {
    if (!db || !profile) return;
    let updated = profile.addresses.map(a => a.id === addressId ? { ...a, ...data } : a);
    if (data.isDefault) {
      updated = updated.map(a => ({ ...a, isDefault: a.id === addressId }));
    }
    await updateDoc(doc(db, 'users', profile.uid), { addresses: updated });
  };

  const removeAddress = async (addressId: string) => {
    if (!db || !profile) return;
    const updated = profile.addresses.filter(a => a.id !== addressId);
    await updateDoc(doc(db, 'users', profile.uid), { addresses: updated });
  };

  const logout = async () => {
    if (!auth) return;
    await fbSignOut(auth);
    setProfile(null);
  };

  const clearError = () => setError(null);

  // Legacy compat
  const user = profile ? { id: profile.uid, name: profile.displayName, email: profile.email, role: profile.role } : null;

  return (
    <AuthContext.Provider value={{
      firebaseUser, profile, loading, error,
      signUp, signIn, signInWithGoogle: signInWithGoogleFn, resetPassword,
      updateUserProfile, addAddress, updateAddress, removeAddress,
      logout, clearError, user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
