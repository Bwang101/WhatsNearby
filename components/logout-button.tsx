import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { useUser } from '@/context/user-context';

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useUser();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleLogout}>
      <ThemedText style={styles.text}>Logout</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  text: {
    fontSize: 16,
    color: '#007AFF',
  },
});