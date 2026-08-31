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

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referral_code: params.referral_code || "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.ref || params.referral_code) {
      const referral = (params.ref || params.referral_code) as string;
      setForm((prev) => ({ ...prev, referral_code: referral.trim() }));
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
              backgroundColor: colors.white,
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: colors.secondary,
                marginBottom: 8,
              }}
            >
              Create Account
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                fontWeight: "500",
              }}
            >
              Register to get started
            </Text>
          </View>

          {/* Logo/Brand Section */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 15,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.white }}>
                VR
              </Text>
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.secondary,
              }}
            >
              Veetu Rusi
            </Text>
          </View>

          {/* Form Section */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 30 }}>
            {/* Username Field */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.secondary,
                  marginBottom: 6,
                  marginLeft: 4,
                }}
              >
                Username
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  backgroundColor: colors.gray,
                }}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={18}
                  color={colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="e.g. johndoe"
                  placeholderTextColor={colors.textSecondary}
                  value={form.username}
                  onChangeText={(value) => handleChange("username", value)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.secondary,
                  marginBottom: 6,
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
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  backgroundColor: colors.gray,
                }}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={18}
                  color={colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="e.g. awesome@user.com"
                  placeholderTextColor={colors.textSecondary}
                  value={form.email}
                  onChangeText={(value) => handleChange("email", value)}
                  keyboardType="email-address"
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
              </View>
            </View>

            {/* Phone Field */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.secondary,
                  marginBottom: 6,
                  marginLeft: 4,
                }}
              >
                Phone Number
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  backgroundColor: colors.gray,
                }}
              >
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={18}
                  color={colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="e.g. +1 234 567 890"
                  placeholderTextColor={colors.textSecondary}
                  value={form.phone}
                  onChangeText={(value) => handleChange("phone", value)}
                  keyboardType="phone-pad"
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
              </View>
            </View>

            {/* Referral Code Field */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.secondary,
                  marginBottom: 6,
                  marginLeft: 4,
                }}
              >
                Referral Code{" "}
                <Text style={{ color: colors.textSecondary, fontWeight: "400" }}>
                  (optional)
                </Text>
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  backgroundColor: colors.gray,
                }}
              >
                <MaterialCommunityIcons
                  name="gift-outline"
                  size={18}
                  color={colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="Enter invite code"
                  placeholderTextColor={colors.textSecondary}
                  value={form.referral_code}
                  onChangeText={(value) => handleChange("referral_code", value)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
              </View>
            </View>

            {/* Password Fields Row */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              {/* Password Field */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.secondary,
                    marginBottom: 6,
                    marginLeft: 4,
                  }}
                >
                  Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    backgroundColor: colors.gray,
                  }}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={16}
                    color={colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    value={form.password}
                    onChangeText={(value) => handleChange("password", value)}
                    secureTextEntry={!showPassword}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      fontSize: 15,
                      color: colors.text,
                    }}
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
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.secondary,
                    marginBottom: 6,
                    marginLeft: 4,
                  }}
                >
                  Confirm
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    backgroundColor: colors.gray,
                  }}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={16}
                    color={colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    value={form.confirmPassword}
                    onChangeText={(value) =>
                      handleChange("confirmPassword", value)
                    }
                    secureTextEntry={!showConfirmPassword}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      fontSize: 15,
                      color: colors.text,
                    }}
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
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 12,
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
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                Already have an account?{" "}
              </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 15,
                      color: colors.primary,
                      fontWeight: "700",
                    }}
                  >
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
