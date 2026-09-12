import { customAlert as Alert } from "@/components/CustomAlertHost";
import { colors } from "@/config/colors";
import { AuthContext } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";

interface AppHeaderProps {
  title: string;
}

export default function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const { wishlist } = useStore();
  const [localUser, setLocalUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarTranslateX = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(sidebarTranslateX, {
      toValue: sidebarOpen ? 0 : -300,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen, sidebarTranslateX]);

  useEffect(() => {
    const syncUser = async () => {
      if (!user) {
        try {
          const stored = await AsyncStorage.getItem("userProfile");
          if (stored) {
            const parsed = JSON.parse(stored);
            const actual = parsed.user || parsed;
            setLocalUser(actual);
            if (authContext?.updateUser) {
              await authContext.updateUser(actual);
            }
          }
        } catch (e) {
          console.warn("Error syncing user in AppHeader:", e);
        }
      }
    };
    syncUser();
  }, [user, authContext]);

  const activeUser = user || localUser;

  const initialLetter = useMemo(() => {
    const source =
      activeUser?.username || activeUser?.name || activeUser?.email || "User";
    return String(source).trim().charAt(0).toUpperCase() || "U";
  }, [activeUser?.username, activeUser?.name, activeUser?.email]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            setLocalUser(null);
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
      {/* Left section: Menu, Logo and Title */}
      <View className="flex-1 flex-row items-center">
        <Pressable
          accessibilityLabel="Open menu"
          className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-gray active:bg-grayDark/20"
          onPress={() => setSidebarOpen(true)}
          hitSlop={8}
        >
          <View className="items-center gap-1.5">
            <View className="h-1.5 w-7 rounded-full bg-text" />
            <View className="h-1.5 w-5 rounded-full bg-text" />
            <View className="h-1.5 w-7 rounded-full bg-text" />
          </View>
        </Pressable>
        <View className="mr-2.5 h-[34px] w-[34px] items-center justify-center rounded-full bg-primary">
          <Text className="text-[18px] font-bold text-white">V</Text>
        </View>
        <Text className="text-[22px] font-bold text-text">{title}</Text>
      </View>

      {/* Right section: Wishlist, Notification & Profile */}
      <View className="flex-row items-center gap-2.5">
        <Pressable
          className="relative h-9 w-9 items-center justify-center rounded-full bg-gray active:bg-grayDark/20"
          onPress={() => router.push("/wishlist")}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="heart-outline"
            size={22}
            color={colors.text}
          />
          {wishlist && wishlist.length > 0 && (
            <View className="absolute -right-1 -top-1 min-w-[17px] h-[17px] items-center justify-center rounded-full bg-primary px-1">
              <Text className="text-[10px] font-black text-white">
                {wishlist.length > 99 ? "99+" : wishlist.length}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full bg-gray"
          hitSlop={10}
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={22}
            color={colors.text}
          />
        </Pressable>

        <View className="relative">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-primary shadow-sm shadow-black"
            onPress={() => setMenuOpen((prev) => !prev)}
            hitSlop={8}
          >
            <Text className="text-[16px] font-bold text-white">
              {initialLetter}
            </Text>
          </Pressable>

          {menuOpen && (
            <View className="absolute right-0 top-[46px] z-50 w-[220px] rounded-xl border border-border bg-white py-2 shadow-lg shadow-black">
              <View className="border-b border-borderLight px-3.5 py-2.5">
                <Text
                  className="text-[15px] font-bold text-text"
                  numberOfLines={1}
                >
                  {activeUser?.username || activeUser?.name || "Guest User"}
                </Text>
                <Text
                  className="mt-0.5 text-[12px] text-textSecondary"
                  numberOfLines={1}
                >
                  {activeUser?.email || "No email available"}
                </Text>
              </View>

              <Pressable
                className="px-3.5 py-3"
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/(tabs)/more");
                }}
              >
                <Text className="text-[15px] font-semibold text-text">
                  Profile
                </Text>
              </Pressable>

              <Pressable
                className="px-3.5 py-3"
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/wishlist");
                }}
              >
                <Text className="text-[15px] font-semibold text-text">
                  My Wishlist
                </Text>
              </Pressable>

              {activeUser ? (
                <Pressable className="px-3.5 py-3" onPress={handleLogout}>
                  <Text className="text-[15px] font-semibold text-error">
                    Logout
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  className="px-3.5 py-3"
                  onPress={() => {
                    setMenuOpen(false);
                    router.push("/auth/login");
                  }}
                >
                  <Text className="text-[15px] font-semibold text-primary">
                    Login
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
      <Modal
        visible={sidebarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSidebarOpen(false)}
      >
        <View className="flex-1 bg-black/40">
          <Pressable
            className="absolute inset-0"
            onPress={() => setSidebarOpen(false)}
          />
          <Animated.View
            className="w-full flex-1 bg-white px-5 pb-8 pt-12"
            style={{ transform: [{ translateX: sidebarTranslateX }] }}
          >
            <View className="mb-7 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-primary">
                  <Text className="text-xl font-black text-white">V</Text>
                </View>
                <View>
                  <Text className="text-lg font-black text-text">
                    Veetu Rusi
                  </Text>
                  <Text className="text-xs text-textSecondary">
                    Home food, made with love
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityLabel="Close menu"
                onPress={() => setSidebarOpen(false)}
                hitSlop={10}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.text}
                />
              </Pressable>
            </View>

            <View className="mb-5 rounded-2xl bg-[#fff7e8] px-4 py-3">
              <Text className="text-xs font-semibold text-textSecondary">
                Welcome back
              </Text>
              <Text
                className="mt-1 text-base font-black text-text"
                numberOfLines={1}
              >
                {activeUser?.username || activeUser?.name || "Guest User"}
              </Text>
            </View>

            {[
              { label: "Home", icon: "home-outline", route: "/(tabs)" },
              {
                label: "Food Menu",
                icon: "silverware-fork-knife",
                route: "/(tabs)/food",
              },
              {
                label: "My Orders",
                icon: "clipboard-text-outline",
                route: "/orders",
              },
              { label: "My Wallet", icon: "wallet-outline", route: "/wallet" },
              {
                label: "Addresses",
                icon: "map-marker-outline",
                route: "/addresses",
              },
              {
                label: "Help & Support",
                icon: "help-circle-outline",
                route: "/help-support",
              },
            ].map((item) => (
              <Pressable
                key={item.label}
                className="mb-1 flex-row items-center rounded-xl px-3 py-3 active:bg-gray"
                onPress={() => {
                  setSidebarOpen(false);
                  router.push(item.route as any);
                }}
              >
                <MaterialCommunityIcons
                  name={
                    item.icon as keyof typeof MaterialCommunityIcons.glyphMap
                  }
                  size={22}
                  color={colors.primary}
                />
                <Text className="ml-3 text-[15px] font-semibold text-text">
                  {item.label}
                </Text>
              </Pressable>
            ))}

            <Pressable
              className="mt-auto flex-row items-center rounded-xl bg-primary/10 px-3 py-3 active:bg-primary/20"
              onPress={() => {
                setSidebarOpen(false);
                router.push("/about");
              }}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={22}
                color={colors.primary}
              />
              <Text className="ml-3 text-[15px] font-semibold text-primary">
                About Veetu Rusi
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
