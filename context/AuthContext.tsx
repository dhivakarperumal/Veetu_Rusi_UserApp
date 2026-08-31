import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { clearTokenCache, setAuthToken } from "../app/api";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      // Add a small delay to allow AsyncStorage to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      const storedToken = await AsyncStorage.getItem("userToken");
      const storedUser = await AsyncStorage.getItem("userProfile");

      if (storedToken) {
        setToken(storedToken);
        setAuthToken(storedToken);
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Auth bootstrap error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, authToken: string) => {
    try {
      setToken(authToken);
      setUser(userData);
      await setAuthToken(authToken);
      await AsyncStorage.setItem("userProfile", JSON.stringify(userData));
    } catch (e) {
      console.error("Login error:", e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      clearTokenCache();
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userProfile");
    } catch (e) {
      console.error("Logout error:", e);
      throw e;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isSignedIn: !!token,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
