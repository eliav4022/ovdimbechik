import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  firebaseUser: FirebaseUser | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  initialized: false,
  firebaseUser: null,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const signOut = async () => {
    await auth.signOut();
  };

  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      setInitialized(true);
      
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }

      if (!fUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', fUser.uid);
      
      // Start listening immediately
      unsubUser = onSnapshot(userRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as User;
          setUser(data);
          setLoading(false);
          
          // Background check for admin upgrade
          if (fUser.email?.toLowerCase() === 'eliav4022@gmail.com' && data.role !== UserRole.ADMIN) {
             setDoc(userRef, { role: UserRole.ADMIN }, { merge: true }).catch(console.error);
          }
        } else {
          // Document does not exist yet. It might be in the middle of being created by Register/Login.
          // We provide a fallback user object so the UI considers them logged in.
          const emailName = fUser.email ? fUser.email.split('@')[0] : 'משתמש';
          
          const fallbackUser: User = {
            id: fUser.uid,
            uid: fUser.uid,
            email: fUser.email || '',
            fullName: fUser.displayName || emailName,
            displayName: fUser.displayName || emailName,
            role: fUser.email?.toLowerCase() === 'eliav4022@gmail.com' ? UserRole.ADMIN : UserRole.SEEKER, // Default fallback
            status: 'Active',
            permissions: [],
            createdAt: new Date().toISOString(),
          };
          setUser(fallbackUser);
          setLoading(false);
          // Removed auto-heal setDoc here to prevent race conditions with Register.tsx/Login.tsx
        }
      }, (error) => {
        // Only log, do not throw. Sometimes new auth sign ups don't have docs yet.
        console.error("AuthContext onSnapshot error:", error);
        setUser(null);
        setLoading(false);
      });
    });

    return () => {
      if (unsubUser) unsubUser();
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, firebaseUser, initialized, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
