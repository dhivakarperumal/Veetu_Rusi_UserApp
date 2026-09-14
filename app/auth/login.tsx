import { customAlert as Alert } from "@/components/CustomAlertHost";
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
        scrollViewRef.current?.scrollTo({
          y: yOffset,
          animated: true,
        });
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

      await login(userData, authToken);

      Alert.alert("Success", "Login successful!");

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
                ? keyboardHeight + 60
                : 30,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === "ios" ? "interactive" : "on-drag"
        }
        bounces={false}
      >
        <Pressable
          onPress={Keyboard.dismiss}
          style={styles.container}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/logo.png")}
              resizeMode="contain"
              style={styles.logo}
            />
          </View>

          {/* Brand */}
          <Text style={styles.brandName}>Veetu Rusi</Text>

          <Text style={styles.tagline}>
            Homemade food. Freshly delivered.
          </Text>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email / Phone */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Email or Phone Number
              </Text>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={21}
                  color="#777"
                />

                <TextInput
                  placeholder="Email or Phone Number"
                  placeholderTextColor="#999"
                  value={form.identifier}
                  onChangeText={(value) =>
                    handleChange("identifier", value)
                  }
                  style={styles.inputText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() =>
                    passwordInputRef.current?.focus()
                  }
                  onFocus={() => handleFocus(120)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldContainer}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>

                <Link
                  href="/auth/forgot-password"
                  asChild
                >
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={21}
                  color="#777"
                />

                <TextInput
                  ref={passwordInputRef}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={form.password}
                  onChangeText={(value) =>
                    handleChange("password", value)
                  }
                  secureTextEntry={!showPassword}
                  style={styles.inputText}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  onFocus={() => handleFocus(200)}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowPassword(!showPassword)
                  }
                  hitSlop={10}
                >
                  <MaterialCommunityIcons
                    name={
                      showPassword
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={22}
                    color="#777"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
              style={[
                styles.loginButton,
                loading && styles.disabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginText}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Register */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Don't Have An Account?
              </Text>

              <Link href="/auth/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Bottom */}
          <Text style={styles.bottomText}>
            Homemade • Fresh • Local
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  </View>
);  
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8f5f0",
  },

  keyboardView: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  /*
   * SINGLE SIMPLE LAYOUT
   */
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 55,
    paddingBottom: 25,
    alignItems: "center",
  },

  /*
   * LOGO
   */
  logoContainer: {
    width: 105,
    height: 105,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  logo: {
    width: 100,
    height: 100,
  },

  /*
   * BRAND
   */
  brandName: {
    color: "#213447",
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
  },

  tagline: {
    color: "#8b8580",
    fontSize: 12.5,
    marginTop: 5,
    textAlign: "center",
  },

  /*
   * FORM
   */
  formContainer: {
    width: "100%",
    maxWidth: 430,
    marginTop: 42,
  },

  fieldContainer: {
    width: "100%",
    marginBottom: 20,
  },

  label: {
    color: "#354650",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },

  passwordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  forgotText: {
    color: "#e85d2a",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },

  /*
   * INPUT
   */
  inputWrapper: {
    width: "100%",
    height: 56,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 15,

    backgroundColor: "rgba(255,255,255,0.65)",

    borderBottomWidth: 1.5,
    borderBottomColor: "#d8cec3",
  },

  inputText: {
    flex: 1,
    color: "#213447",
    fontSize: 15,
    marginLeft: 11,
    paddingVertical: 0,
  },

  /*
   * SIGN IN
   */
  loginButton: {
    width: "100%",
    height: 56,

    borderRadius: 10,

    backgroundColor: "#e85d2a",

    alignItems: "center",
    justifyContent: "center",

    marginTop: 3,
  },

  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  disabled: {
    opacity: 0.6,
  },

  /*
   * SIGN UP
   */
  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 27,
  },

  registerText: {
    color: "#777",
    fontSize: 12.5,
  },

  registerLink: {
    color: "#e85d2a",
    fontSize: 12.5,
    fontWeight: "800",
    marginLeft: 5,
  },

  /*
   * FOOTER
   */
  bottomText: {
    color: "#aaa099",
    fontSize: 11,
    marginTop: 35,
    textAlign: "center",
  },
});