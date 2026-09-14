import { customAlert as Alert } from "@/components/CustomAlertHost";
import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
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

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const activeOffsetRef = useRef<number>(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const initialReferral = (
    Array.isArray(params.referral_code)
      ? params.referral_code[0]
      : params.referral_code ||
        (Array.isArray(params.ref) ? params.ref[0] : params.ref) ||
        ""
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

  useEffect(() => {
    const rawRef = params.ref || params.referral_code;
    if (rawRef) {
      const referral = Array.isArray(rawRef) ? rawRef[0] : rawRef;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({ ...prev, referral_code: (referral || "").trim() }));
    }
  }, [params.ref, params.referral_code]);

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
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
        "Registration successful! Please login to continue.",
      );
      router.push("/auth/login");
    } catch (error: any) {
      console.error("Register Error:", error);
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      Alert.alert("Registration Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ImageBackground
        source={require("../../assets/images/register_image.jpg")}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.overlay} />
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
                    ? keyboardHeight + 60
                    : 0,
              },
            ]}
            scrollEnabled
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
            bounces={false}
          >
            <Pressable onPress={Keyboard.dismiss} style={styles.container}>
              <View style={styles.logoContainer}>
                <ImageBackground
                  source={require("../../assets/images/logo.png")}
                  resizeMode="contain"
                  style={styles.logo}
                />
              </View>
              <Text style={styles.brandName}>Veetu Rusi</Text>
              <Text style={styles.tagline}>Homemade food. Freshly delivered.</Text>

              <View style={styles.card}>
                <Text style={styles.kicker}>JOIN THE TABLE</Text>
                <Text style={styles.title}>Create your account</Text>
                <Text style={styles.subtitle}>Bring homemade goodness closer to you.</Text>

            {/* Username Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Username</Text>
              <View style={styles.input}>
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
                  style={styles.inputText}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  onFocus={() => handleFocus(120)}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.input}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={18}
                  color={colors.textSecondary}
                  className="mr-2"
                />
                <TextInput
                  ref={emailRef}
                  placeholder="e.g. awesome@user.com"
                  placeholderTextColor={colors.textSecondary}
                  value={form.email}
                  onChangeText={(value) => handleChange("email", value)}
                  keyboardType="email-address"
                  style={styles.inputText}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  onFocus={() => handleFocus(190)}
                />
              </View>
            </View>

            {/* Phone Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.input}>
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={18}
                  color={colors.textSecondary}
                  className="mr-2"
                />
                <TextInput
                  ref={phoneRef}
                  placeholder="e.g. +1 234 567 890"
                  placeholderTextColor={colors.textSecondary}
                  value={form.phone}
                  onChangeText={(value) => handleChange("phone", value)}
                  keyboardType="phone-pad"
                  style={styles.inputText}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onFocus={() => handleFocus(260)}
                />
              </View>
            </View>

            {/* Password Fields Row */}
            <View style={styles.passwordRow}>
              {/* Password Field */}
              <View style={styles.passwordColumn}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.passwordInput}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={16}
                    color={colors.textSecondary}
                    className="mr-1.5"
                  />
                  <TextInput
                    ref={passwordRef}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    value={form.password}
                    onChangeText={(value) => handleChange("password", value)}
                    secureTextEntry={!showPassword}
                    style={styles.passwordText}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    onFocus={() => handleFocus(330)}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
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
              <View style={styles.passwordColumn}>
                <Text style={styles.fieldLabel}>Confirm</Text>
                <View style={styles.passwordInput}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={16}
                    color={colors.textSecondary}
                    className="mr-1.5"
                  />
                  <TextInput
                    ref={confirmPasswordRef}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    value={form.confirmPassword}
                    onChangeText={(value) =>
                      handleChange("confirmPassword", value)
                    }
                    secureTextEntry={!showConfirmPassword}
                    style={styles.passwordText}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    onFocus={() => handleFocus(400)}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <MaterialCommunityIcons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
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
              style={[styles.submitButton, loading && styles.disabled]}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.submitText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </Link>
            </View>
              </View>
              <Text style={styles.bottomText}>Homemade • Fresh • Local</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111" },
  background: { flex: 1, height: "100%", width: "100%" },
  overlay: {
    backgroundColor: "rgba(8, 15, 13, 0.52)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: "100%",
    paddingBottom: 20,
    paddingHorizontal: 0,
    paddingTop: 26,
  },
  logoContainer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    elevation: 6,
    height: 78,
    justifyContent: "center",
    marginBottom: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    width: 78,
  },
  logo: { height: 72, width: 72 },
  brandName: { color: "#FFFFFF", fontSize: 28, fontWeight: "800" },
  tagline: { color: "rgba(255,255,255,0.88)", fontSize: 13, marginTop: 5 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#F2C4A5",
    marginTop: 20,
    maxWidth: 430,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    width: "100%",
  },
  kicker: { color: "#E85D04", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  title: {
    color: "#3A2A22",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 5,
  },
  subtitle: {
    color: "#6B5B52",
    fontSize: 13,
    marginBottom: 14,
    marginTop: 5,
  },
  fieldGroup: { marginBottom: 9 },
  fieldLabel: {
    color: "#5A4030",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 5,
  },
  input: {
    alignItems: "center",
    backgroundColor: "#F4F5F8",
    borderColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: "row",
    height: 48,
    paddingHorizontal: 16,
  },
  inputText: { color: "#202020", flex: 1, fontSize: 15, marginLeft: 10 },
  passwordRow: { flexDirection: "column", marginBottom: 6 },
  passwordColumn: { marginBottom: 8, width: "100%" },
  passwordInput: {
    alignItems: "center",
    backgroundColor: "#F4F5F8",
    borderColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: "row",
    height: 48,
    paddingHorizontal: 16,
  },
  passwordText: {
    color: "#202020",
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
    minWidth: 0,
  },
  passwordToggle: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 30,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#E85D04",
    borderRadius: 30,
    height: 50,
    justifyContent: "center",
    shadowColor: "#E85D04",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 2,
  },
  disabled: { opacity: 0.65 },
  submitText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  loginRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },
  loginPrompt: { color: "#6B5B52", fontSize: 13 },
  loginLink: {
    color: "#E85D04",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    textDecorationLine: "underline",
  },
  bottomText: { color: "#D1D1D1", fontSize: 11.5, marginTop: 16 },
});
