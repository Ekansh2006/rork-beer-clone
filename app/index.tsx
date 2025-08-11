import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import Colors from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function IndexScreen() {
  const { user, isLoading, isUserApproved, isUserPending, isUserRejected } = useUser();

  useEffect(() => {
    if (isLoading) return;

    // No user - go to login
    if (!user) {
      router.replace('/login');
      return;
    }

    // User exists - route based on status
    if (isUserPending) {
      router.replace('/verification-pending');
    } else if (isUserApproved) {
      router.replace('/(tabs)');
    } else if (isUserRejected) {
      // For rejected users, go back to login with option to create new account
      router.replace('/login');
    } else {
      // Fallback to login
      router.replace('/login');
    }
  }, [user, isLoading, isUserApproved, isUserPending, isUserRejected]);

  // Show loading screen while determining route
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.light.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});