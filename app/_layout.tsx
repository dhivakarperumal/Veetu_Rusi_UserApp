import { colors } from "@/config/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
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
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        {isSignedIn ? (
          <Stack.Screen
            name="(tabs)"
            options={{
              animationTypeForReplace: true,
            }}
          />
        ) : (
          <Stack.Screen
            name="auth"
            options={{
              animationTypeForReplace: true,
            }}
          />
        )}
      </Stack>
    </SafeAreaProvider>
  );
}
