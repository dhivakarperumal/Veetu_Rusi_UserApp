import AppHeader from "@/components/AppHeader";
import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearTokenCache } from "../api";

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

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

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
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
      ]
    );
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
      }}
    >
      <AppHeader title="More" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* User Profile Section */}
        {user && (
          <View className="mx-5 mb-5 rounded-xl border border-border bg-white p-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-[50px] w-[50px] items-center justify-center rounded-full bg-primary">
                <Text className="text-[20px] font-bold text-white">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-semibold text-text">
                  {user.username}
                </Text>
                <Text className="mt-0.5 text-[13px] text-textSecondary">
                  {user.email}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View className="mb-[30px] px-5">
          <TouchableOpacity className="flex-row items-center border-b border-border py-3">
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={24}
              color={colors.primary}
              className="mr-3"
            />
            <Text className="text-[16px] font-medium text-text">
              Profile Settings
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
              className="ml-auto"
            />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center border-b border-border py-3">
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={colors.primary}
              className="mr-3"
            />
            <Text className="text-[16px] font-medium text-text">
              Notifications
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
              className="ml-auto"
            />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center border-b border-border py-3">
            <MaterialCommunityIcons
              name="history"
              size={24}
              color={colors.primary}
              className="mr-3"
            />
            <Text className="text-[16px] font-medium text-text">
              Order History
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
              className="ml-auto"
            />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center border-b border-border py-3">
            <MaterialCommunityIcons
              name="cog-outline"
              size={24}
              color={colors.primary}
              className="mr-3"
            />
            <Text className="text-[16px] font-medium text-text">
              Settings
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
              className="ml-auto"
            />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center border-b border-border py-3">
            <MaterialCommunityIcons
              name="information-outline"
              size={24}
              color={colors.primary}
              className="mr-3"
            />
            <Text className="text-[16px] font-medium text-text">
              About
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
              className="ml-auto"
            />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            disabled={loading}
            className={`flex-row items-center py-3 ${loading ? "opacity-60" : "opacity-100"}`}
          >
            <MaterialCommunityIcons
              name="logout"
              size={24}
              color={colors.error}
              className="mr-3"
            />
            <Text className="text-[16px] font-semibold text-error">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
