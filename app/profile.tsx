import { customAlert as Alert } from "@/components/CustomAlertHost";
import { colors } from "@/config/colors";
import { AuthContext } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PROFILE_FIELDS = [
  { key: "name", label: "Name", placeholder: "Full name" },
  { key: "username", label: "Username", placeholder: "Username" },
  { key: "email", label: "Email", placeholder: "Email" },
  { key: "phone", label: "Phone Number", placeholder: "Phone number" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;

  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const storedProfile = await AsyncStorage.getItem("userProfile");
        const profile = storedProfile ? JSON.parse(storedProfile) : user;
        const merged = { ...(user || {}), ...(profile || {}) };
        setForm(merged);
      } catch (error) {
        console.error("Error loading profile:", error);
        setForm(user || {});
      } finally {
        setLoading(false);
        setReady(true);
      }
    };

    loadProfile();
  }, [user]);

  const initials = useMemo(() => {
    const base = form?.username || form?.name || form?.email || "User";
    return String(base).trim().charAt(0).toUpperCase();
  }, [form]);

  const updateField = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const nextUser = { ...(user || {}), ...form };
      await AsyncStorage.setItem("userProfile", JSON.stringify(nextUser));
      if (authContext?.updateUser) {
        await authContext.updateUser(nextUser);
      }
      Alert.alert("Profile updated", "Your profile details have been saved.");
      router.back();
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Profile error", "Unable to save your profile details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-borderLight bg-white px-[18px] py-3">
        <Pressable
          accessibilityLabel="Go back"
          className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-gray"
          hitSlop={8}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#1F2937" />
        </Pressable>
        <Text className="text-[22px] font-bold text-text">Profile</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          <View className="mx-5 mt-4 rounded-[26px] border border-borderLight bg-white p-5 shadow-sm shadow-black/10">
            <View className="items-center">
              <View className="h-[82px] w-[82px] items-center justify-center rounded-full bg-primary">
                <Text className="text-[30px] font-black text-white">
                  {initials}
                </Text>
              </View>
              <Text className="mt-3 text-[22px] font-black text-text">
                {form?.username || form?.name || "Foodie User"}
              </Text>
            </View>
          </View>

          <View className="mx-5 mt-4 rounded-[26px] border border-borderLight bg-white p-4 shadow-sm shadow-black/10">
            {loading && !ready ? (
              <View className="items-center justify-center py-6">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <View>
                {PROFILE_FIELDS.map((field) => {
                  const key = field.key as string;
                  const value = String(form?.[key] ?? "");

                  return (
                    <View key={key} className="mb-4">
                      <Text className="mb-2 text-[12px] font-black uppercase text-textSecondary">
                        {field.label}
                      </Text>
                      <TextInput
                        className="rounded-[14px] border border-borderLight bg-background px-4 py-3 text-[14px] font-semibold text-text"
                        value={value}
                        placeholder={field.placeholder}
                        placeholderTextColor={colors.textSecondary}
                        autoCapitalize="none"
                        onChangeText={(text) => updateField(key, text)}
                      />
                    </View>
                  );
                })}

                <View className="mt-4 flex-row">
                  <TouchableOpacity
                    onPress={() => router.back()}
                    className="mr-3 flex-1 items-center justify-center rounded-[14px] border border-border bg-white px-4 py-3"
                  >
                    <Text className="text-[14px] font-black text-text">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    className="flex-1 items-center justify-center rounded-[14px] bg-primary px-4 py-3"
                  >
                    <Text className="text-[14px] font-black text-white">
                      {loading ? "Saving..." : "Save Profile"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
