import { customAlert as Alert } from "@/components/CustomAlertHost";
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../api";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const activeOffsetRef = useRef<number>(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates.height;
      setKeyboardHeight(height);
      if (activeOffsetRef.current > 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: activeOffsetRef.current,
            animated: true,
          });
        }, 50);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      activeOffsetRef.current = 0;
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleFocus = (yOffset: number) => {
    activeOffsetRef.current = yOffset;
    setTimeout(
      () => {
        scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
      },
      Platform.OS === "android" ? 150 : 60
    );
  };

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                Platform.OS === "android" && keyboardHeight > 0
                  ? keyboardHeight + 100
                  : 120,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          bounces={true}
          overScrollMode="always"
        >
          <Pressable onPress={Keyboard.dismiss} style={styles.hero}>
            <ImageBackground
              source={require("../../assets/images/login banner.png")}
              resizeMode="stretch"
              style={StyleSheet.absoluteFill}
            />
          </Pressable>

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
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  onFocus={() => handleFocus(180)}
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.input}>
                <MaterialCommunityIcons name="lock" size={23} color="#858b91" />
                <TextInput
                  ref={passwordInputRef}
                  placeholder="Password"
                  placeholderTextColor="#a0a4aa"
                  value={form.password}
                  onChangeText={(value) => handleChange("password", value)}
                  secureTextEntry={!showPassword}
                  style={styles.inputText}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  onFocus={() => handleFocus(260)}
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
                  <Text style={styles.loginText}>Login Now</Text>
                </>
              )}
            </TouchableOpacity>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.createRow}>
              <Text style={styles.createPrompt}>
                Don&apos;t have an account?
              </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity style={styles.createLinkButton}>
                  <Text style={styles.createLink}>Create Account</Text>
                </TouchableOpacity>
              </Link>
            </View>
            <View style={styles.newUserMessage}>
              <Text style={styles.newUserText}>Welcome! New users</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff7e8" },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, backgroundColor: "#fff7e8" },
  hero: { height: 300, position: "relative" },

  card: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 28,
    borderColor: "rgba(190, 130, 55, 0.14)",
    borderWidth: 1,
    marginHorizontal: 10,
    marginTop: -60,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: "#b47729",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 7,
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
    marginBottom: 13,
    textAlign: "center",
  },
  fieldGroup: { marginBottom: 9 },
  fieldLabel: {
    color: "#27313b",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  input: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d5d8dc",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    height: 52,
    paddingHorizontal: 17,
  },
  inputText: {
    color: "#17202b",
    flex: 1,
    fontSize: 16,
    marginLeft: 13,
  },
  forgotButton: { alignSelf: "flex-end", marginBottom: 13, marginTop: -1 },
  forgotText: { color: "#fb5b0b", fontSize: 15, fontWeight: "500" },
  loginButton: {
    alignItems: "center",
    backgroundColor: "#ff650d",
    borderColor: "#ff7b2c",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 54,
    justifyContent: "center",
    shadowColor: "#d94b00",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 2,
  },
  disabled: { opacity: 0.65 },
  loginText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  divider: { alignItems: "center", flexDirection: "row", marginVertical: 12 },
  dividerLine: { backgroundColor: "#d9dadd", flex: 1, height: 1 },
  orText: { color: "#858b91", fontSize: 15, marginHorizontal: 16 },
  socialRow: { flexDirection: "row", gap: 14 },
  socialButton: {
    alignItems: "center",
    borderColor: "#d9dadd",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  socialText: {
    color: "#17202b",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 10,
  },
  createRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },
  createPrompt: { color: "#737a82", fontSize: 14 },
  createLinkButton: {
    alignItems: "center",
    flexDirection: "column",
  },
  createLink: {
    color: "#f15b23",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 9,
    textDecorationLine: "underline",
  },
  createHint: {
    color: "#9b9fa4",
    fontSize: 10,
    marginLeft: 9,
    marginTop: 1,
  },
  newUserMessage: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  newUserText: {
    color: "#737a82",
    fontSize: 13,
    textAlign: "center",
  },
});
