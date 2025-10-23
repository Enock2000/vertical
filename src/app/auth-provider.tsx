
// src/app/auth-provider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { ref, onValue, get } from 'firebase/database';
import { auth, db } from '@/lib/firebase';
import type { Employee, Company } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  companyId: string | null;
  company: Company | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  employee: null,
  companyId: null,
  company: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleSignOut = useCallback(() => {
    signOut(auth).then(() => {
        toast({
            title: "Session Expired",
            description: "You have been logged out due to inactivity.",
        });
    });
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // First, get the employee record which contains the companyId
        const employeeRef = ref(db, 'employees/' + currentUser.uid);
        const employeeUnsubscribe = onValue(employeeRef, async (snapshot) => {
          const employeeData: Employee | null = snapshot.val();
          if (employeeData) {
            setEmployee(employeeData);
            if (employeeData.companyId) {
              setCompanyId(employeeData.companyId);
              // Now fetch company data
              const companyRef = ref(db, `companies/${employeeData.companyId}`);
              const companySnap = await get(companyRef);
              setCompany(companySnap.val() as Company | null);
            } else {
               setCompany(null);
            }
          } else {
            // This case handles a user that exists in Auth but not in the employees table.
            setEmployee(null);
            setCompanyId(null);
            setCompany(null);
          }
          setLoading(false);
        }, (error) => {
            console.error("Failed to fetch employee data:", error);
            setEmployee(null); 
            setCompanyId(null);
            setCompany(null);
            setLoading(false);
        });
        return () => employeeUnsubscribe();
      } else {
        setEmployee(null);
        setCompanyId(null);
        setCompany(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let activityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(handleSignOut, 10 * 60 * 1000); // 10 minutes
    };

    if (user) {
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        resetTimer(); // Start the timer on initial load
    }

    return () => {
        clearTimeout(activityTimer);
        window.removeEventListener('mousemove', resetTimer);
        window.removeEventListener('keydown', resetTimer);
    };
  }, [user, handleSignOut]);


  return (
    <AuthContext.Provider value={{ user, employee, companyId, company, loading }}>
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
