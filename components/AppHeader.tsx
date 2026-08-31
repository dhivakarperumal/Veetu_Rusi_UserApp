import { colors } from "@/config/colors";
import { AuthContext } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

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
    <View style={styles.headerWrap}>
      <View style={styles.leftSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>V</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightSection}>
        <Pressable style={styles.iconButton} hitSlop={10}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.profileContainer}>
          <Pressable
            style={styles.avatarButton}
            onPress={() => setMenuOpen((prev) => !prev)}
            hitSlop={8}
          >
            <Text style={styles.avatarText}>{initialLetter}</Text>
          </Pressable>

          {menuOpen && (
            <View style={styles.dropdown}>
              <View style={styles.userSummary}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.username || user?.name || "Guest User"}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user?.email || "No email available"}
                </Text>
              </View>

              <Pressable
                style={styles.dropdownItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/(tabs)/more");
                }}
              >
                <Text style={styles.dropdownItemText}>Profile</Text>
              </Pressable>

              <Pressable style={styles.dropdownItem} onPress={handleLogout}>
                <Text style={[styles.dropdownItemText, styles.logoutText]}>Logout</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray,
  },
  profileContainer: {
    position: "relative",
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatarText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: 46,
    width: 220,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  userSummary: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  userName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  logoutText: {
    color: colors.error,
  },
});
