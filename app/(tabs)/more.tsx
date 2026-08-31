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
      className="flex-1"
      style={{
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
          <Text
            className="text-3xl font-bold"
            style={{ color: colors.text }}
          >
            More
          </Text>
        </View>

        {/* User Profile Section */}
        {user && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              padding: 16,
              borderRadius: 12,
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.white,
                  }}
                >
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {user.username}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {user.email}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={24}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <Text style={{ fontSize: 16, color: colors.text, fontWeight: "500" }}>
              Profile Settings
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <Text style={{ fontSize: 16, color: colors.text, fontWeight: "500" }}>
              Notifications
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <MaterialCommunityIcons
              name="history"
              size={24}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <Text style={{ fontSize: 16, color: colors.text, fontWeight: "500" }}>
              Order History
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={24}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <Text style={{ fontSize: 16, color: colors.text, fontWeight: "500" }}>
              Settings
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={24}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <Text style={{ fontSize: 16, color: colors.text, fontWeight: "500" }}>
              About
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            disabled={loading}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <MaterialCommunityIcons
              name="logout"
              size={24}
              color={colors.error}
              style={{ marginRight: 12 }}
            />
            <Text
              style={{
                fontSize: 16,
                color: colors.error,
                fontWeight: "600",
              }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
