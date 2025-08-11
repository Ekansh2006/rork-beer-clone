import { useState, useCallback, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { User as AppUser, RegistrationData, LoginData, UserStatus } from '@/types/profile';
import { authService, userService, generateUsername, FirebaseUserDoc } from '@/lib/firebaseService';

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [authUnsubscribe, setAuthUnsubscribe] = useState<(() => void) | null>(null);
  const [statusUnsubscribe, setStatusUnsubscribe] = useState<(() => void) | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((firebaseUser: FirebaseUserDoc | null) => {
      if (firebaseUser) {
        const userData: AppUser = {
          id: firebaseUser.id,
          name: firebaseUser.name,
          email: firebaseUser.email,
          phone: firebaseUser.phone,
          location: firebaseUser.location,
          selfieUrl: firebaseUser.selfieUrl || '',
          status: firebaseUser.status,
          username: firebaseUser.username,
          createdAt: firebaseUser.createdAt.toDate(),
          approvedAt: firebaseUser.approvedAt?.toDate(),
        };
        setUser(userData);
        
        // Listen to user status changes
        const statusUnsub = userService.onUserStatusChanged(firebaseUser.id, (updatedUser) => {
          if (updatedUser) {
            setUser(updatedUser);
          }
        });
        setStatusUnsubscribe(() => statusUnsub);
      } else {
        setUser(null);
        if (statusUnsubscribe) {
          statusUnsubscribe();
          setStatusUnsubscribe(null);
        }
      }
      setIsLoading(false);
    });
    
    setAuthUnsubscribe(() => unsubscribe);
    
    return () => {
      unsubscribe();
      if (statusUnsubscribe) {
        statusUnsubscribe();
      }
    };
  }, []);



  const register = useCallback(async (registrationData: RegistrationData): Promise<AppUser> => {
    setIsRegistering(true);
    try {
      console.log('Starting registration with Firebase...');
      
      const { user: newUser } = await authService.register(registrationData);
      
      console.log('Registration successful:', newUser.id);
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      
      throw new Error('Failed to create account. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      if (statusUnsubscribe) {
        statusUnsubscribe();
        setStatusUnsubscribe(null);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [statusUnsubscribe]);

  const login = useCallback(async (loginData: LoginData): Promise<AppUser> => {
    setIsLoading(true);
    try {
      const user = await authService.login(loginData.email, loginData.password);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);



  const updateUserStatus = useCallback(async (status: UserStatus, username?: string) => {
    if (!user) return;

    let finalUsername = username;
    if (status === 'approved_username_assigned' && !username) {
      finalUsername = generateUsername();
    }

    await userService.updateUserStatus(user.id, status, finalUsername);
  }, [user]);

  const isUserApproved = user?.status === 'approved_username_assigned';
  const isUserPending = user?.status === 'pending_verification';
  const isUserRejected = user?.status === 'rejected';
  const hasUsername = !!user?.username;

  return {
    user,
    isLoading,
    isRegistering,
    isUserApproved,
    isUserPending,
    isUserRejected,
    register,
    login,
    logout,
    updateUserStatus,
    hasUsername,
  };
});