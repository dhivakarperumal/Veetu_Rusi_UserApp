import { colors } from "@/config/colors";
import { AuthContext } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

interface AppHeaderProps {
  title: string;
}

export default function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [menuOpen, setMenuOpen] = useState(false);

  const initialLetter = useMemo(() => {
    const source = user?.username || user?.name || user?.email || "User";
    return String(source).trim().charAt(0).toUpperCase() || "U";
  }, [user?.username, user?.name, user?.email]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await authContext?.logout();
            setMenuOpen(false);
            router.replace("/auth/login");
          } catch (error) {
            console.error("Logout failed:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-row items-center justify-between border-b border-borderLight bg-white px-[18px] py-3">
      {/* Left section: Logo and Title */}
      <View className="flex-1 flex-row items-center">
        <View className="mr-2.5 h-[34px] w-[34px] items-center justify-center rounded-full bg-primary">
          <Text className="text-[18px] font-bold text-white">V</Text>
        </View>
        <Text className="text-[22px] font-bold text-text">{title}</Text>
      </View>

      {/* Right section: Notification & Profile */}
      <View className="flex-row items-center gap-2.5">
        <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-gray" hitSlop={10}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
        </Pressable>

        <View className="relative">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-primary shadow-sm shadow-black"
            onPress={() => setMenuOpen((prev) => !prev)}
            hitSlop={8}
          >
            <Text className="text-[16px] font-bold text-white">{initialLetter}</Text>
          </Pressable>

          {menuOpen && (
            <View className="absolute right-0 top-[46px] z-50 w-[220px] rounded-xl border border-border bg-white py-2 shadow-lg shadow-black">
              <View className="border-b border-borderLight px-3.5 py-2.5">
                <Text className="text-[15px] font-bold text-text" numberOfLines={1}>
                  {user?.username || user?.name || "Guest User"}
                </Text>
                <Text className="mt-0.5 text-[12px] text-textSecondary" numberOfLines={1}>
                  {user?.email || "No email available"}
                </Text>
              </View>

              <Pressable
                className="px-3.5 py-3"
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/(tabs)/more");
                }}
              >
                <Text className="text-[15px] font-semibold text-text">Profile</Text>
              </Pressable>

              <Pressable className="px-3.5 py-3" onPress={handleLogout}>
                <Text className="text-[15px] font-semibold text-error">Logout</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
