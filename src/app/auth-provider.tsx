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
  companyId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  employee: null,
  companyId: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // First, get the employee record which contains the companyId
        const employeeRef = ref(db, 'employees/' + currentUser.uid);
        const employeeUnsubscribe = onValue(employeeRef, (snapshot) => {
          const employeeData: Employee | null = snapshot.val();
          if (employeeData) {
            setEmployee(employeeData);
            setCompanyId(employeeData.companyId);
          } else {
            // This case handles a user that exists in Auth but not in the employees table.
            // This might be a partially completed signup or an admin without a profile.
            // For now, we clear the state. A robust app might handle this differently.
            setEmployee(null);
            setCompanyId(null);
          }
          setLoading(false);
        }, (error) => {
            console.error("Failed to fetch employee data:", error);
            setEmployee(null); 
            setCompanyId(null);
            setLoading(false);
        });
        return () => employeeUnsubscribe();
      } else {
        setEmployee(null);
        setCompanyId(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, employee, companyId, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
