import { customAlert as Alert } from "@/components/CustomAlertHost";
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
  <View
    style={[
      styles.root,
      {
        paddingTop: insets.top,
      },
    ]}
  >
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85",
      }}
      resizeMode="cover"
      style={styles.background}
    >
      {/* Dark overlay for text readability */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                Platform.OS === "android" &&
                keyboardHeight > 0
                  ? keyboardHeight + 60
                  : 35,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
          bounces={false}
        >
          <Pressable
            onPress={Keyboard.dismiss}
            style={styles.container}
          >
            {/* LOGO */}

            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/images/logo.png")}
                resizeMode="contain"
                style={styles.logo}
              />
            </View>

            {/* BRAND */}

            <Text style={styles.brandName}>
              Veetu Rusi
            </Text>

            <Text style={styles.tagline}>
              Homemade food. Freshly delivered.
            </Text>

            {/* FORM */}

            <View style={styles.formContainer}>
              {/* EMAIL */}

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Email or Phone Number
                </Text>

                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={21}
                    color="#D95A28"
                  />

                  <TextInput
                    placeholder="Email or Phone Number"
                    placeholderTextColor="#8B8178"
                    value={form.identifier}
                    onChangeText={(value) =>
                      handleChange(
                        "identifier",
                        value
                      )
                    }
                    style={styles.inputText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() =>
                      passwordInputRef.current?.focus()
                    }
                    onFocus={() =>
                      handleFocus(100)
                    }
                  />
                </View>
              </View>

              {/* PASSWORD */}

              <View style={styles.fieldContainer}>
                <View style={styles.passwordHeader}>
                  <Text style={styles.label}>
                    Password
                  </Text>

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
                    color="#D95A28"
                  />

                  <TextInput
                    ref={passwordInputRef}
                    placeholder="Password"
                    placeholderTextColor="#8B8178"
                    value={form.password}
                    onChangeText={(value) =>
                      handleChange(
                        "password",
                        value
                      )
                    }
                    secureTextEntry={!showPassword}
                    style={styles.inputText}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    onFocus={() =>
                      handleFocus(180)
                    }
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    hitSlop={10}
                    style={styles.eyeButton}
                  >
                    <MaterialCommunityIcons
                      name={
                        showPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={22}
                      color="#6E6258"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* SIGN IN */}

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
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginText}>
                      Sign In
                    </Text>

                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={20}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </TouchableOpacity>

              {/* REGISTER */}

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>
                  Don&apos;t Have An Account?
                </Text>

                <Link
                  href="/auth/register"
                  asChild
                >
                  <TouchableOpacity>
                    <Text style={styles.registerLink}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            {/* FOOTER */}

            <Text style={styles.bottomText}>
              Homemade • Fresh • Local
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  </View>
);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#111",
  },

  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  /*
   * IMPORTANT:
   * Strong overlay makes every word readable.
   */
  overlay: {
    backgroundColor: "rgba(8, 15, 13, 0.35)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
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
   * SINGLE PAGE
   */

  container: {
    flexGrow: 1,
    minHeight: "100%",

    alignItems: "center",

    paddingHorizontal: 28,
    paddingTop: 38,
    paddingBottom: 25,
  },

  /*
   * LOGO
   */

  logoContainer: {
    width: 96,
    height: 96,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.12)",

    borderRadius: 28,

    marginBottom: 10,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,

    elevation: 6,
  },

  logo: {
    width: 88,
    height: 88,
  },

  /*
   * BRAND
   */

  brandName: {
    color: "#FFFFFF",

    fontSize: 29,
    fontWeight: "800",

    textAlign: "center",

    letterSpacing: 0.3,
  },

  tagline: {
    color: "rgba(255,255,255,0.88)",

    fontSize: 13,

    marginTop: 5,

    textAlign: "center",
  },

  /*
   * FORM
   */

  formContainer: {
    width: "100%",
    maxWidth: 430,

    marginTop: 34,
  },

  fieldContainer: {
    width: "100%",

    marginBottom: 19,
  },

  /*
   * LABEL
   */

 label: {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "700",
  marginBottom: 8,
},

inputText: {
  flex: 1,
  color: "#FFFFFF",
  fontSize: 15,
  marginLeft: 12,
  paddingVertical: 0,
},

  passwordHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  forgotText: {
    color: "#FFB08A",

    fontSize: 12.5,
    fontWeight: "700",

    marginBottom: 8,
  },

  /*
   * INPUT
   */

  inputWrapper: {
    width: "100%",
    height: 58,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 16,

    backgroundColor: "rgba(255,255,255,0.12)",
    opacity: 1,

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.55)",

    borderRadius: 12,
  },



  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 8,
  },

  /*
   * SIGN IN
   */

  loginButton: {
    width: "100%",
    height: 58,

    borderRadius: 12,

    backgroundColor: "#E85D2A",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    marginTop: 2,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.25,

    shadowRadius: 7,

    elevation: 5,
  },

  loginText: {
    color: "#FFFFFF",

    fontSize: 17,

    fontWeight: "800",
  },

  disabled: {
    opacity: 0.6,
  },

  /*
   * REGISTER
   */

  registerContainer: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 26,
  },

  registerText: {
    color: "rgba(255,255,255,0.88)",

    fontSize: 13,
  },

  registerLink: {
    color: "#FFB08A",

    fontSize: 13,

    fontWeight: "800",

    marginLeft: 5,
  },

  /*
   * FOOTER
   */

  bottomText: {
    color: "rgba(255,255,255,0.70)",

    fontSize: 11.5,

    marginTop: 32,

    textAlign: "center",
  },
});