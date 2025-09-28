// src/app/auth-provider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { auth, db } from '@/lib/firebase';
import type { Employee } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  employee: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const employeeRef = ref(db, 'employees/' + currentUser.uid);
        const employeeUnsubscribe = onValue(employeeRef, (snapshot) => {
          setEmployee(snapshot.val());
          setLoading(false);
        }, (error) => {
            console.error("Failed to fetch employee data:", error);
            setEmployee(null); // Ensure employee is null on error
            setLoading(false);
        });
        return () => employeeUnsubscribe();
      } else {
        setEmployee(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, employee, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
