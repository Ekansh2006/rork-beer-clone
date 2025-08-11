import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { Check, X, RefreshCw, User, Phone, Mail, MapPin } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { User as UserType } from '@/types/profile';
import { userService, generateUsername } from '@/lib/firebaseService';

export default function AdminPanel() {
  const [pendingUsers, setPendingUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const users = await userService.getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
      Alert.alert('Error', 'Failed to load pending users');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPendingUsers();
  };

  const handleApproveUser = async (user: UserType) => {
    Alert.alert(
      'Approve User',
      `Approve ${user.name} and assign username?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessingUsers(prev => new Set(prev).add(user.id));
            try {
              const username = generateUsername();
              await userService.updateUserStatus(user.id, 'approved_username_assigned', username);
              
              setPendingUsers(prev => prev.filter(u => u.id !== user.id));
              
              Alert.alert('Success', `User approved with username: ${username}`);
            } catch (error) {
              console.error('Error approving user:', error);
              Alert.alert('Error', 'Failed to approve user');
            } finally {
              setProcessingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(user.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const handleRejectUser = async (user: UserType) => {
    Alert.alert(
      'Reject User',
      `Reject ${user.name}'s application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingUsers(prev => new Set(prev).add(user.id));
            try {
              await userService.updateUserStatus(user.id, 'rejected');
              
              setPendingUsers(prev => prev.filter(u => u.id !== user.id));
              
              Alert.alert('Success', 'User rejected');
            } catch (error) {
              console.error('Error rejecting user:', error);
              Alert.alert('Error', 'Failed to reject user');
            } finally {
              setProcessingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(user.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const BeerLogo = () => (
    <View style={styles.logoContainer}>
      <Image 
        source={{ uri: 'https://r2-pub.rork.com/attachments/bcjlgxvpsdw5ajmunl9az' }}
        style={styles.logoImage}
        contentFit="contain"
      />
    </View>
  );

  const UserCard = ({ user }: { user: UserType }) => {
    const isProcessing = processingUsers.has(user.id);
    
    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userDate}>
              Applied: {user.createdAt.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.userActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.approveButton,
                isProcessing && styles.actionButtonDisabled
              ]}
              onPress={() => handleApproveUser(user)}
              disabled={isProcessing}
            >
              <Check size={20} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.rejectButton,
                isProcessing && styles.actionButtonDisabled
              ]}
              onPress={() => handleRejectUser(user)}
              disabled={isProcessing}
            >
              <X size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.selfieSection}>
          <Text style={styles.sectionTitle}>Verification Selfie</Text>
          <View style={styles.selfieContainer}>
            {user.selfieUri ? (
              <Image
                source={{ uri: user.selfieUri }}
                style={styles.selfieImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.selfiePlaceholder}>
                <User size={48} color={Colors.light.tabIconDefault} />
                <Text style={styles.placeholderText}>No selfie uploaded</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Mail size={16} color={Colors.light.text} />
            <Text style={styles.detailText}>{user.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Phone size={16} color={Colors.light.text} />
            <Text style={styles.detailText}>{user.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={16} color={Colors.light.text} />
            <Text style={styles.detailText}>{user.location || 'No location provided'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <BeerLogo />
          <Text style={styles.appTitle}>beer admin</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <RefreshCw size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Pending Verifications</Text>
          <Text style={styles.subtitle}>
            {pendingUsers.length} users awaiting approval
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading pending users...</Text>
          </View>
        ) : pendingUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending verifications</Text>
            <Text style={styles.emptySubtext}>All users have been processed</Text>
          </View>
        ) : (
          <View style={styles.usersContainer}>
            {pendingUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.light.text,
    textTransform: 'lowercase' as const,
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: Colors.light.text,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: Colors.light.text,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: Colors.light.tabIconDefault,
  },
  usersContainer: {
    gap: 16,
  },
  userCard: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: Colors.light.tabIconDefault,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#90EE90',
  },
  rejectButton: {
    backgroundColor: '#FFB6C1',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  selfieSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  selfieContainer: {
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  selfieImage: {
    width: '100%',
    height: '100%',
  },
  selfiePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: Colors.light.tabIconDefault,
  },
  detailsSection: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: Colors.light.text,
    flex: 1,
  },
});