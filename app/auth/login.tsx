import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api, { setAuthToken } from "../api";

export default function LoginScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (!form.identifier || !form.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);

      // Store user data and token
      await setAuthToken(res.data.token);
      await AsyncStorage.setItem(
        "userProfile",
        JSON.stringify(res.data.user)
      );

      Alert.alert("Success", "Login successful!");

      // Navigate based on role
      const userRole = res.data.user.role;
      setTimeout(() => {
        if (userRole === "superadmin") {
          router.replace("/superadmin" as any);
        } else if (userRole === "admin") {
          router.replace("/admin" as any);
        } else if (userRole === "delivery_partner") {
          router.replace("/delivery" as any);
        } else if (userRole === "homechef" || userRole === "chef") {
          router.replace("/chef" as any);
        } else {
          router.replace("/(tabs)");
        }
      }, 500);
    } catch (error: any) {
      console.error("Login Error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      Alert.alert("Login Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="grow"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="bg-white px-5 pb-7 pt-10">
            <Text className="mb-2 text-3xl font-bold text-secondary">
              Welcome Back
            </Text>
            <Text className="text-base font-medium text-textSecondary">
              Log in to your account to continue
            </Text>
          </View>

          {/* Logo/Brand Section */}
          <View className="items-center px-5 py-5">
            <View className="mb-2.5 h-20 w-20 items-center justify-center rounded-full bg-primary">
              <Text className="text-4xl font-bold text-white">
                VR
              </Text>
            </View>
            <Text className="text-2xl font-bold text-secondary">
              Veetu Rusi
            </Text>
          </View>

          {/* Form Section */}
          <View className="px-5 pb-7">
            {/* Email Field */}
            <View className="mb-4">
              <Text className="mb-2 ml-1 text-sm font-semibold text-secondary">
                Email Address
              </Text>
              <View className="flex-row items-center rounded-2xl border border-border bg-gray px-4">
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={colors.textSecondary}
                  className="mr-2"
                />
                <TextInput
                  placeholder="e.g. awesome@user.com"
                  placeholderTextColor={colors.textSecondary}
                  value={form.identifier}
                  onChangeText={(value) => handleChange("identifier", value)}
                  className="flex-1 py-3.5 text-base text-text"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-5">
              <View className="mb-2 ml-1 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-secondary">
                  Password
                </Text>
                <Link href="/auth/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text className="text-xs font-semibold text-primary">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <View className="flex-row items-center rounded-2xl border border-border bg-gray px-4">
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={colors.textSecondary}
                  className="mr-2"
                />
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  value={form.password}
                  onChangeText={(value) => handleChange("password", value)}
                  secureTextEntry={!showPassword}
                  className="flex-1 py-3.5 text-base text-text"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`mb-6 items-center rounded-2xl bg-primary py-3.5 ${loading ? "opacity-60" : "opacity-100"}`}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text className="text-base font-bold text-white">
                  Log In
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="my-6 flex-row items-center">
              <View className="h-[1px] flex-1 bg-border" />
              <Text className="px-3 text-xs font-semibold text-textSecondary">
                OR CONTINUE WITH
              </Text>
              <View className="h-[1px] flex-1 bg-border" />
            </View>

            {/* Social Login */}
            <View className="mb-6 flex-row justify-around">
              <TouchableOpacity className="h-[50px] w-[50px] items-center justify-center rounded-xl border border-border bg-gray">
                <MaterialCommunityIcons
                  name="facebook"
                  size={24}
                  color="#1877F2"
                />
              </TouchableOpacity>
              <TouchableOpacity className="h-[50px] w-[50px] items-center justify-center rounded-xl border border-border bg-gray">
                <MaterialCommunityIcons
                  name="google"
                  size={24}
                  color="#EA4335"
                />
              </TouchableOpacity>
              <TouchableOpacity className="h-[50px] w-[50px] items-center justify-center rounded-xl border border-border bg-gray">
                <MaterialCommunityIcons
                  name="apple"
                  size={24}
                  color={colors.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center">
              <Text className="text-[15px] font-medium text-textSecondary">
                {"Don't have an account? "}
              </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity>
                  <Text className="text-[15px] font-bold text-primary">
                    Sign up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
