import { Redirect } from 'expo-router';

export default function Route() {
  // This ensures the app always starts at the login page
  return <Redirect href="/login" />;
}