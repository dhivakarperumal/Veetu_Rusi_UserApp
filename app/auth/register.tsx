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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Veetu Rusi today</Text>
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
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderColor: "rgba(190, 130, 55, 0.14)",
    borderRadius: 28,
    borderWidth: 1,
    marginHorizontal: 10,
    marginTop: -90,
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    marginBottom: 12,
    marginTop: 5,
    textAlign: "center",
  },
  fieldGroup: { marginBottom: 7 },
  fieldLabel: {
    color: "#27313b",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 3,
  },
  input: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d5d8dc",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    height: 48,
    paddingHorizontal: 10,
  },
  inputText: { color: "#17202b", flex: 1, fontSize: 15, marginLeft: 7 },
  passwordRow: { flexDirection: "column", marginBottom: 6 },
  passwordColumn: { marginBottom: 7, width: "100%" },
  passwordInput: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d5d8dc",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    height: 48,
    paddingHorizontal: 10,
  },
  passwordText: {
    color: "#17202b",
    flex: 1,
    fontSize: 14,
    marginLeft: 3,
    minWidth: 0,
  },
  passwordToggle: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 28,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#ff650d",
    borderColor: "#ff7b2c",
    borderRadius: 14,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    shadowColor: "#d94b00",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 2,
  },
  disabled: { opacity: 0.65 },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  loginRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  loginPrompt: { color: "#737a82", fontSize: 14 },
  loginLink: {
    color: "#f15b23",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    textDecorationLine: "underline",
  },
});
