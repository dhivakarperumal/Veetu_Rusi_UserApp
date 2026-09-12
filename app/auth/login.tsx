import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
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

      const userData = res.data.user || res.data;
      const authToken = res.data.token;

      // Update AuthContext, storage, and API token
      await login(userData, authToken);

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
    <SafeAreaView className="flex-1 bg-[#fff7e8]" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <ImageBackground
              source={require("../../assets/images/login banner.png")}
              resizeMode="stretch"
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Login to continue to Veetu Rusi</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email or Phone Number</Text>
              <View style={styles.input}>
                <MaterialCommunityIcons
                  name="account"
                  size={24}
                  color="#858b91"
                />
                <TextInput
                  placeholder="Email or Phone Number"
                  placeholderTextColor="#a0a4aa"
                  value={form.identifier}
                  onChangeText={(value) => handleChange("identifier", value)}
                  style={styles.inputText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.input}>
                <MaterialCommunityIcons name="lock" size={23} color="#858b91" />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#a0a4aa"
                  value={form.password}
                  onChangeText={(value) => handleChange("password", value)}
                  secureTextEntry={!showPassword}
                  style={styles.inputText}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={10}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-off"}
                    size={24}
                    color="#858b91"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Link href="/auth/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.loginButton, loading && styles.disabled]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginText}>Login</Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={30}
                    color="#fff"
                  />
                </>
              )}
            </TouchableOpacity>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton}>
                <MaterialCommunityIcons
                  name="google"
                  size={22}
                  color="#4285F4"
                />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <MaterialCommunityIcons
                  name="apple"
                  size={23}
                  color="#111820"
                />
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.createRow}>
              <Text style={styles.createPrompt}>
                Don&apos;t have an account?
              </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.createLink}>Create Account</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 22, backgroundColor: "#fff7e8" },
  hero: { height: 300, position: "relative" },

  card: {
    backgroundColor: "#fffdfa",
    borderColor: "rgba(220, 170, 100, 0.18)",
    borderWidth: 1,
    borderRadius: 28,
    marginHorizontal: 20,
    marginTop: -80,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#b47729",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  title: {
    color: "#17202b",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#737a82",
    fontSize: 16,
    marginTop: 5,
    marginBottom: 20,
    textAlign: "center",
  },
  fieldGroup: { marginBottom: 13 },
  fieldLabel: {
    color: "#27313b",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 7,
  },
  input: {
    alignItems: "center",
    borderColor: "#d9dadd",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    height: 50,
    paddingHorizontal: 20,
  },
  inputText: { color: "#17202b", flex: 1, fontSize: 16, marginLeft: 16 },
  forgotButton: { alignSelf: "flex-end", marginBottom: 18, marginTop: -1 },
  forgotText: { color: "#fb5b0b", fontSize: 15, fontWeight: "500" },
  loginButton: {
    alignItems: "center",
    backgroundColor: "#ff640b",
    borderRadius: 17,
    flexDirection: "row",
    height: 60,
    justifyContent: "center",
  },
  disabled: { opacity: 0.65 },
  loginText: { color: "#fff", fontSize: 19, fontWeight: "700" },
  divider: { alignItems: "center", flexDirection: "row", marginVertical: 18 },
  dividerLine: { backgroundColor: "#d9dadd", flex: 1, height: 1 },
  orText: { color: "#858b91", fontSize: 15, marginHorizontal: 16 },
  socialRow: { flexDirection: "row", gap: 14 },
  socialButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d9dadd",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    height: 50,
    justifyContent: "center",
  },
  socialText: {
    color: "#17202b",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  createRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  createPrompt: { color: "#737a82", fontSize: 14 },
  createLink: {
    color: "#f15b23",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 9,
    textDecorationLine: "underline",
  },
});
