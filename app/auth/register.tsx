import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api";

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialReferral = (
    Array.isArray(params.referral_code)
      ? params.referral_code[0]
      : params.referral_code || (Array.isArray(params.ref) ? params.ref[0] : params.ref) || ""
  ) as string;

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referral_code: initialReferral,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const rawRef = params.ref || params.referral_code;
    if (rawRef) {
      const referral = Array.isArray(rawRef) ? rawRef[0] : rawRef;
      setForm((prev) => ({ ...prev, referral_code: (referral || "").trim() }));
    }
  }, [params.ref, params.referral_code]);

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (
      !form.username ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        referral_code: form.referral_code.trim(),
      });

      Alert.alert(
        "Success",
        "Registration successful! Please login to continue."
      );
      router.push("/auth/login");
    } catch (error: any) {
      console.error("Register Error:", error);
      const errorMessage = error.response?.data?.message || "Registration failed";
      Alert.alert("Registration Error", errorMessage);
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
          <View className="bg-white px-5 pb-5 pt-8">
            <Text className="mb-2 text-3xl font-bold text-secondary">
              Create Account
            </Text>
            <Text className="text-base font-medium text-textSecondary">
              Register to get started
            </Text>
          </View>

          {/* Logo/Brand Section */}
          <View className="items-center px-5 py-4">
            <View className="mb-2 h-[70px] w-[70px] items-center justify-center rounded-full bg-primary">
              <Text className="text-3xl font-bold text-white">
                VR
              </Text>
            </View>
            <Text className="text-xl font-bold text-secondary">
              Veetu Rusi
            </Text>
          </View>

          {/* Form Section */}
          <View className="px-5 pb-8">
            {/* Username Field */}
            <View className="mb-3.5">
              <Text className="mb-1.5 ml-1 text-xs font-semibold text-secondary">
                Username
              </Text>
              <View className="flex-row items-center rounded-xl border border-border bg-gray px-3.5">
                <MaterialCommunityIcons
                  name="account-outline"
                  size={18}
                  color={colors.textSecondary}
                  className="mr-2"
                />
                <TextInput
                  placeholder="e.g. johndoe"
                  placeholderTextColor={colors.textSecondary}
                  value={form.username}
                  onChangeText={(value) => handleChange("username", value)}
                  className="flex-1 py-3 text-[15px] text-text"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Email Field */}
            <View className="mb-3.5">
              <Text className="mb-1.5 ml-1 text-xs font-semibold text-secondary">
                Email Address
              </Text>
              <View className="flex-row items-center rounded-xl border border-border bg-gray px-3.5">
                <MaterialCommunityIcons
                  name="email-outline"
                  size={18}
                  color={colors.textSecondary}
                  className="mr-2"
                />
                <TextInput
                  placeholder="e.g. awesome@user.com"
                  placeholderTextColor={colors.textSecondary}
                  value={form.email}
                  onChangeText={(value) => handleChange("email", value)}
                  keyboardType="email-address"
                  className="flex-1 py-3 text-[15px] text-text"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone Field */}
            <View className="mb-3.5">
              <Text className="mb-1.5 ml-1 text-xs font-semibold text-secondary">
                Phone Number
              </Text>
              <View className="flex-row items-center rounded-xl border border-border bg-gray px-3.5">
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={18}
                  color={colors.textSecondary}
                  className="mr-2"
                />
                <TextInput
                  placeholder="e.g. +1 234 567 890"
                  placeholderTextColor={colors.textSecondary}
                  value={form.phone}
                  onChangeText={(value) => handleChange("phone", value)}
                  keyboardType="phone-pad"
                  className="flex-1 py-3 text-[15px] text-text"
                />
              </View>
            </View>

            {/* Referral Code Field */}
            <View className="mb-3.5">
              <Text className="mb-1.5 ml-1 text-xs font-semibold text-secondary">
                Referral Code{" "}
                <Text className="font-normal text-textSecondary">
                  (optional)
                </Text>
              </Text>
              <View className="flex-row items-center rounded-xl border border-border bg-gray px-3.5">
                <MaterialCommunityIcons
                  name="gift-outline"
                  size={18}
                  color={colors.textSecondary}
                  className="mr-2"
                />
                <TextInput
                  placeholder="Enter invite code"
                  placeholderTextColor={colors.textSecondary}
                  value={form.referral_code}
                  onChangeText={(value) => handleChange("referral_code", value)}
                  className="flex-1 py-3 text-[15px] text-text"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Password Fields Row */}
            <View className="mb-5 flex-row gap-3">
              {/* Password Field */}
              <View className="flex-1">
                <Text className="mb-1.5 ml-1 text-xs font-semibold text-secondary">
                  Password
                </Text>
                <View className="flex-row items-center rounded-xl border border-border bg-gray px-3">
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={16}
                    color={colors.textSecondary}
                    className="mr-1.5"
                  />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    value={form.password}
                    onChangeText={(value) => handleChange("password", value)}
                    secureTextEntry={!showPassword}
                    className="flex-1 py-3 text-[15px] text-text"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Field */}
              <View className="flex-1">
                <Text className="mb-1.5 ml-1 text-xs font-semibold text-secondary">
                  Confirm
                </Text>
                <View className="flex-row items-center rounded-xl border border-border bg-gray px-3">
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={16}
                    color={colors.textSecondary}
                    className="mr-1.5"
                  />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    value={form.confirmPassword}
                    onChangeText={(value) =>
                      handleChange("confirmPassword", value)
                    }
                    secureTextEntry={!showConfirmPassword}
                    className="flex-1 py-3 text-[15px] text-text"
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    <MaterialCommunityIcons
                      name={
                        showConfirmPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`mb-5 items-center rounded-xl bg-primary py-3.5 ${loading ? "opacity-60" : "opacity-100"}`}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text className="text-base font-bold text-white">
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row justify-center">
              <Text className="text-[15px] font-medium text-textSecondary">
                Already have an account?{" "}
              </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text className="text-[15px] font-bold text-primary">
                    Log In
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
