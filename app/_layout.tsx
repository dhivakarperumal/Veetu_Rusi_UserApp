import CustomAlertHost from "@/components/CustomAlertHost";
import { colors } from "@/config/colors";
import { AuthProvider } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import { StoreProvider } from "@/context/StoreContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import "../global.css";

function RootLayoutContent() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Add a small delay to allow AsyncStorage to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        const token = await AsyncStorage.getItem("userToken");
        setIsSignedIn(!!token);
      } catch (error) {
        console.error("Auth check error:", error);
        // Don't fail silently - treat as not signed in
        setIsSignedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const configureNavigationBar = async () => {
      try {
        NavigationBar.setStyle("dark");
      } catch (error) {
        console.warn("Navigation bar styling unavailable:", error);
      }
    };

    configureNavigationBar();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={isSignedIn ? "(tabs)" : "auth"}
    >
      <Stack.Screen
        name="(tabs)"
      />
      <Stack.Screen
        name="auth"
      />
      <Stack.Screen
        name="checkout"
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StoreProvider>
        <LocationProvider>
          <RootLayoutContent />
          <CustomAlertHost />
        </LocationProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
