import AppHeader from "@/components/AppHeader";
import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearTokenCache } from "../api";

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadUserProfile = async () => {
    try {
      const userProfile = await AsyncStorage.getItem("userProfile");
      if (userProfile) {
        setUser(JSON.parse(userProfile));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUserProfile();
  }, []);

  const initials = useMemo(() => {
    return (user?.username || user?.email || "User")
      .toString()
      .trim()
      .charAt(0)
      .toUpperCase();
  }, [user]);

  const menuItems = [
    { label: "Profile Settings", icon: "account-circle-outline" },
    { label: "Notifications", icon: "bell-outline" },
    { label: "Order History", icon: "history" },
    { label: "Settings", icon: "cog-outline" },
    { label: "About", icon: "information-outline" },
  ];

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          setLoading(true);
          try {
            clearTokenCache();
            await AsyncStorage.removeItem("userToken");
            await AsyncStorage.removeItem("userProfile");
            router.replace("/auth/login");
          } catch {
            Alert.alert("Error", "Failed to logout. Please try again.");
          } finally {
            setLoading(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
      }}
    >
      <AppHeader title="More" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* User Profile Card */}
        {user && (
          <View className="mx-5 mt-4 rounded-[26px] border border-borderLight bg-white p-4 shadow-sm shadow-black/10">
            <View className="flex-row items-center">
              <View className="mr-4 h-[58px] w-[58px] items-center justify-center rounded-full bg-primary">
                <Text className="text-[22px] font-black text-white">
                  {initials}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-[18px] font-bold text-text">
                  {user.username || "Foodie User"}
                </Text>
                <Text className="mt-1 text-[13px] font-medium text-textSecondary">
                  {user.email || "No email available"}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={26}
                color={colors.textSecondary}
              />
            </View>
          </View>
        )}

        {/* Menu Card */}
        <View className="mx-5 mt-4 overflow-hidden rounded-[26px] border border-borderLight bg-white shadow-sm shadow-black/10">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              className={`flex-row items-center px-4 py-4 ${
                index !== menuItems.length - 1
                  ? "border-b border-borderLight"
                  : ""
              }`}
            >
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-gray">
                <MaterialCommunityIcons
                  name={
                    item.icon as keyof typeof MaterialCommunityIcons.glyphMap
                  }
                  size={23}
                  color={colors.primary}
                />
              </View>
              <Text className="flex-1 text-[16px] font-semibold text-text">
                {item.label}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={23}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={handleLogout}
            disabled={loading}
            className={`flex-row items-center px-4 py-4 ${
              loading ? "opacity-60" : "opacity-100"
            }`}
          >
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <MaterialCommunityIcons
                name="logout"
                size={23}
                color={colors.error}
              />
            </View>
            <Text className="flex-1 text-[16px] font-bold text-error">
              Logout
            </Text>
            {loading ? (
              <Text className="text-[13px] font-semibold text-textSecondary">
                Loading...
              </Text>
            ) : (
              <MaterialCommunityIcons
                name="chevron-right"
                size={23}
                color={colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
