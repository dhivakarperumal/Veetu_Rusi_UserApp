import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { clearTokenCache, setAuthToken } from "../app/api";

export interface User {
  id?: string;
  user_id?: string;
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: User | null) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  isSignedIn: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        const parsed = JSON.parse(storedUser);
        setUser(parsed.user || parsed);
      }
    } catch (e) {
      console.error("Auth bootstrap error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const storedToken = await AsyncStorage.getItem("userToken");
      const storedUser = await AsyncStorage.getItem("userProfile");

      if (storedToken) {
        setToken(storedToken);
        setAuthToken(storedToken);
      }

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const actual = parsed.user || parsed;
        setUser(actual);
        return actual;
      }
    } catch (e) {
      console.error("refreshUser error:", e);
    }
    return null;
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

  const updateUser = async (userData: User | null) => {
    try {
      setUser(userData);
      if (userData) {
        await AsyncStorage.setItem("userProfile", JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem("userProfile");
      }
    } catch (e) {
      console.error("Update user error:", e);
      throw e;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUser,
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
