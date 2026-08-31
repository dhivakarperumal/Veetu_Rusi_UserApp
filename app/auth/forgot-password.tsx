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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 30,
              paddingBottom: 20,
            }}
          >
            <Link href="/auth/login" asChild>
              <TouchableOpacity style={{ marginBottom: 20 }}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={28}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </Link>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: colors.secondary,
                marginBottom: 8,
              }}
            >
              Reset Password
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                fontWeight: "500",
              }}
            >
              Enter your email to receive reset instructions
            </Text>
          </View>

          {/* Logo */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 20,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name="lock-reset"
                size={40}
                color={colors.white}
              />
            </View>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 30 }}>
            {!submitted ? (
              <>
                <View style={{ marginBottom: 24 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.secondary,
                      marginBottom: 8,
                      marginLeft: 4,
                    }}
                  >
                    Email Address
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      backgroundColor: colors.gray,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={20}
                      color={colors.textSecondary}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      placeholder="e.g. awesome@user.com"
                      placeholderTextColor={colors.textSecondary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        fontSize: 16,
                        color: colors.text,
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                    marginBottom: 20,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.white,
                      }}
                    >
                      Send Reset Link
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={64}
                  color={colors.success}
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: colors.secondary,
                    textAlign: "center",
                  }}
                >
                  Check Your Email
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  We've sent password reset instructions to your email.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
