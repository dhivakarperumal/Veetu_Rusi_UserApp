import "../global.css";
import { colors } from "@/config/colors";
import { AuthProvider } from "@/context/AuthContext";
import { StoreProvider } from "@/context/StoreContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

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

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.white,
        }}
      >
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
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StoreProvider>
        <RootLayoutContent />
      </StoreProvider>
    </AuthProvider>
  );
}
