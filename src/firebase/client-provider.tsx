'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    let firebaseApp: FirebaseApp;
    if (getApps().length === 0) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = getApp();
    }
    
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    setServices({ firebaseApp, auth, firestore });
  }, []);

  if (!services) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Initializing Firebase...</p>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
