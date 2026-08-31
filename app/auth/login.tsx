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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with background gradient effect */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 40,
              paddingBottom: 30,
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
              Welcome Back
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                fontWeight: "500",
              }}
            >
              Log in to your account to continue
            </Text>
          </View>

          {/* Logo/Brand Section */}
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
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 40, fontWeight: "bold", color: colors.white }}>
                VR
              </Text>
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.secondary,
              }}
            >
              Veetu Rusi
            </Text>
          </View>

          {/* Form Section */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 30 }}>
            {/* Email Field */}
            <View style={{ marginBottom: 18 }}>
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
                  value={form.identifier}
                  onChangeText={(value) => handleChange("identifier", value)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.text,
                  }}
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.secondary,
                  }}
                >
                  Password
                </Text>
                <Link href="/auth/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.primary,
                        fontWeight: "600",
                      }}
                    >
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
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
                  name="lock-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  value={form.password}
                  onChangeText={(value) => handleChange("password", value)}
                  secureTextEntry={!showPassword}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.text,
                  }}
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
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                marginBottom: 24,
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
                  Log In
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 24,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: colors.border,
                }}
              />
              <Text
                style={{
                  paddingHorizontal: 12,
                  fontSize: 12,
                  color: colors.textSecondary,
                  fontWeight: "600",
                }}
              >
                OR CONTINUE WITH
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            {/* Social Login */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginBottom: 24,
              }}
            >
              <TouchableOpacity
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: colors.gray,
                }}
              >
                <MaterialCommunityIcons
                  name="facebook"
                  size={24}
                  color="#1877F2"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: colors.gray,
                }}
              >
                <MaterialCommunityIcons
                  name="google"
                  size={24}
                  color="#EA4335"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: colors.gray,
                }}
              >
                <MaterialCommunityIcons
                  name="apple"
                  size={24}
                  color={colors.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                {"Don't have an account? "}
              </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 15,
                      color: colors.primary,
                      fontWeight: "700",
                    }}
                  >
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
