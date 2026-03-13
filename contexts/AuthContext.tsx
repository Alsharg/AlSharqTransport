import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSupabaseClient } from '@/template';
import { UserProfile } from '../services/types';
import * as api from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  authUser: any;
  isLoggedIn: boolean;
  isLoading: boolean;
  operationLoading: boolean;
  userRole: 'admin' | 'driver' | 'supervisor' | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTPAndRegister: (email: string, otp: string, password: string, metadata: Record<string, string>, role: string) => Promise<{ success: boolean; error?: string }>;
  registerDriver: (email: string, password: string, metadata: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  registerAdmin: (email: string, password: string, metadata: Record<string, string>, secretCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<any>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  const supabase = getSupabaseClient();

  const loadProfile = useCallback(async (userId: string) => {
    const profile = await api.fetchUserProfile(userId);
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setAuthUser(session.user);
          await loadProfile(session.user.id);
        }
      } catch (e) {
        console.error('Auth init error:', e);
      }
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        await loadProfile(session.user.id);
      } else {
        setAuthUser(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile, supabase]);

  const login = useCallback(async (email: string, password: string) => {
    setOperationLoading(true);
    try {
      const result = await api.signInWithPassword(email, password);
      if (result.error) {
        setOperationLoading(false);
        return { success: false, error: result.error };
      }
      if (result.user) {
        setAuthUser(result.user);
        const profile = await loadProfile(result.user.id);
        if (profile && profile.approval_status === 'pending' && profile.role === 'driver') {
          await api.signOutUser();
          setAuthUser(null);
          setUser(null);
          setOperationLoading(false);
          return { success: false, error: 'حسابك قيد المراجعة. ستتلقى إشعاراً عند القبول.' };
        }
        if (profile && !profile.is_active) {
          await api.signOutUser();
          setAuthUser(null);
          setUser(null);
          setOperationLoading(false);
          return { success: false, error: 'حسابك معطل. تواصل مع الإدارة.' };
        }
      }
      setOperationLoading(false);
      return { success: true };
    } catch (e: any) {
      setOperationLoading(false);
      return { success: false, error: e.message || 'حدث خطأ' };
    }
  }, [loadProfile]);

  const sendOTP = useCallback(async (email: string) => {
    setOperationLoading(true);
    try {
      const result = await api.sendOTPEmail(email);
      setOperationLoading(false);
      if (result.error) return { success: false, error: result.error };
      return { success: true };
    } catch (e: any) {
      setOperationLoading(false);
      return { success: false, error: e.message || 'حدث خطأ' };
    }
  }, []);

  const verifyOTPAndRegister = useCallback(async (email: string, otp: string, password: string, metadata: Record<string, string>, role: string) => {
    setOperationLoading(true);
    try {
      const result = await api.verifyOTPAndLogin(email, otp, password);
      if (result.error) {
        setOperationLoading(false);
        return { success: false, error: result.error };
      }
      if (result.user) {
        // Update profile with metadata
        const profileUpdates: any = {
          full_name: metadata.full_name || '',
          phone: metadata.phone || '',
          role: role,
        };
        if (metadata.vehicle_type) profileUpdates.vehicle_type = metadata.vehicle_type;
        if (metadata.vehicle_plate) profileUpdates.vehicle_plate = metadata.vehicle_plate;
        if (metadata.license_number) profileUpdates.license_number = metadata.license_number;
        if (metadata.nationality) profileUpdates.nationality = metadata.nationality;
        if (metadata.car_model) profileUpdates.car_model = metadata.car_model;
        if (role === 'admin' || role === 'supervisor') {
          profileUpdates.approval_status = 'approved';
          profileUpdates.is_active = true;
        }
        await api.updateUserProfile(result.user.id, profileUpdates);

        if (role === 'driver') {
          // Sign out driver so they wait for approval
          await api.signOutUser();
          setAuthUser(null);
          setUser(null);
        } else {
          // Admin/Supervisor - keep logged in
          setAuthUser(result.user);
          await loadProfile(result.user.id);
        }
      }
      setOperationLoading(false);
      return { success: true };
    } catch (e: any) {
      setOperationLoading(false);
      return { success: false, error: e.message || 'حدث خطأ' };
    }
  }, [loadProfile]);

  const registerDriver = useCallback(async (email: string, password: string, metadata: Record<string, string>) => {
    setOperationLoading(true);
    try {
      const result = await api.signUpUser(email, password, { ...metadata, role: 'driver' });
      if (result.error) {
        setOperationLoading(false);
        return { success: false, error: result.error };
      }
      if (result.user) {
        await api.updateUserProfile(result.user.id, {
          vehicle_type: metadata.vehicle_type,
          vehicle_plate: metadata.vehicle_plate,
          license_number: metadata.license_number,
          full_name: metadata.full_name,
          phone: metadata.phone,
        });
        await api.signOutUser();
        setAuthUser(null);
        setUser(null);
      }
      setOperationLoading(false);
      return { success: true };
    } catch (e: any) {
      setOperationLoading(false);
      return { success: false, error: e.message || 'حدث خطأ' };
    }
  }, []);

  const registerAdmin = useCallback(async (email: string, password: string, metadata: Record<string, string>, secretCode: string) => {
    setOperationLoading(true);
    try {
      if (secretCode !== 'SHARQ2026') {
        setOperationLoading(false);
        return { success: false, error: 'رمز الإدارة غير صحيح' };
      }
      const role = metadata.admin_role || 'admin';
      const result = await api.signUpUser(email, password, { ...metadata, role });
      if (result.error) {
        setOperationLoading(false);
        return { success: false, error: result.error };
      }
      if (result.user) {
        await api.updateUserProfile(result.user.id, {
          full_name: metadata.full_name,
          phone: metadata.phone,
          approval_status: 'approved',
          is_active: true,
        });
      }
      setOperationLoading(false);
      return { success: true };
    } catch (e: any) {
      setOperationLoading(false);
      return { success: false, error: e.message || 'حدث خطأ' };
    }
  }, []);

  const logout = useCallback(async () => {
    await api.signOutUser();
    setAuthUser(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (authUser?.id) {
      await loadProfile(authUser.id);
    }
  }, [authUser, loadProfile]);

  return (
    <AuthContext.Provider value={{
      user,
      authUser,
      isLoggedIn: !!user,
      isLoading,
      operationLoading,
      userRole: user?.role || null,
      login,
      sendOTP,
      verifyOTPAndRegister,
      registerDriver,
      registerAdmin,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
