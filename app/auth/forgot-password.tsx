import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
      Alert.alert(
        "Success",
        "If an account exists with this email, you will receive password reset instructions."
      );
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to process request";
      Alert.alert("Error", errorMessage);
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
          <View className="px-5 pb-5 pt-8">
            <Link href="/auth/login" asChild>
              <TouchableOpacity className="mb-5">
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={28}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </Link>
            <Text className="mb-2 text-3xl font-bold text-secondary">
              Reset Password
            </Text>
            <Text className="text-base font-medium text-textSecondary">
              Enter your email to receive reset instructions
            </Text>
          </View>

          {/* Logo */}
          <View className="items-center px-5 py-5">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
              <MaterialCommunityIcons
                name="lock-reset"
                size={40}
                color={colors.white}
              />
            </View>
          </View>

          {/* Form */}
          <View className="px-5 pb-7">
            {!submitted ? (
              <>
                <View className="mb-6">
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
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="flex-1 py-3.5 text-base text-text"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  className={`mb-5 items-center rounded-2xl bg-primary py-3.5 ${loading ? "opacity-60" : "opacity-100"}`}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text className="text-base font-bold text-white">
                      Send Reset Link
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View className="items-center py-5">
                <MaterialCommunityIcons
                  name="check-circle"
                  size={64}
                  color={colors.success}
                  className="mb-4"
                />
                <Text className="text-center text-lg font-semibold text-secondary">
                  Check Your Email
                </Text>
                <Text className="mt-2 text-center text-sm text-textSecondary">
                  {"We've sent password reset instructions to your email."}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
