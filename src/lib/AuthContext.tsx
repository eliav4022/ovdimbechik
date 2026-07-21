import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
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
    let lastActivity = Date.now();
    const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
    let intervalId: any;

    const resetActivity = () => {
      lastActivity = Date.now();
    };

    if (user) {
      window.addEventListener('mousemove', resetActivity);
      window.addEventListener('keydown', resetActivity);
      window.addEventListener('mousedown', resetActivity);
      window.addEventListener('touchstart', resetActivity);
      window.addEventListener('scroll', resetActivity);

      intervalId = setInterval(() => {
        if (Date.now() - lastActivity > TIMEOUT_MS) {
          console.log('User inactive for 15 minutes. Logging out...');
          auth.signOut();
        }
      }, 60000); // Check every minute
    }

    return () => {
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('mousedown', resetActivity);
      window.removeEventListener('touchstart', resetActivity);
      window.removeEventListener('scroll', resetActivity);
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    // Handle Redirect Result for Google Auth
    getRedirectResult(auth).then(async (credential) => {
      if (credential?.user) {
        const { user } = credential;
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          const roleFromStorage = sessionStorage.getItem('google_auth_role') as UserRole;
          const intentFromStorage = sessionStorage.getItem('google_auth_intent');
          const isSelfAdmin = user.email?.toLowerCase() === 'eliav4022@gmail.com';
          
          if (intentFromStorage === 'login' && !isSelfAdmin) {
            await auth.signOut();
            alert('לא קיימת במערכת כתובת המייל זו. אנא היכנס לעמוד ההרשמה.');
            sessionStorage.removeItem('google_auth_intent');
            return;
          }

          const role = roleFromStorage || UserRole.SEEKER;
          
          const newUser: User = {
            id: user.uid,
            uid: user.uid,
            email: user.email || '',
            fullName: user.displayName || '',
            displayName: user.displayName || '',
            role: isSelfAdmin ? UserRole.ADMIN : role,
            status: 'Active',
            permissions: isSelfAdmin ? ['ALL'] : [],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };

          if (role === UserRole.EMPLOYER) {
            newUser.companyName = '';
          }

          await setDoc(userRef, newUser);
          
          if (role === UserRole.SEEKER) {
            await setDoc(doc(db, `users/${user.uid}/profiles/seeker`), {
              userId: user.uid,
              bio: '',
              cvUrl: '',
              skills: [],
              savedJobIds: [],
            });
          } else if (role === UserRole.EMPLOYER) {
            await setDoc(doc(db, `users/${user.uid}/profiles/employer`), {
              userId: user.uid,
              position: '',
              companyId: null,
              isPrimaryContact: true,
            });
          }

          sessionStorage.removeItem('google_auth_role');
        } else {
           await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
        }
      }
    }).catch(console.error);

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
          // Document does not exist in Firestore. The user is either logging in with a new Google account
          // (which should be blocked or handled by Register.tsx) or has no collection mapping.
          setUser(null);
          setLoading(false);
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
