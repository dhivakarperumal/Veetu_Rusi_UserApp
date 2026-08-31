import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Pressable } from "react-native";

import colors from "@/config/colors";

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function HapticTab({
  onPress,
  onLongPress,
  isFocused,
}: {
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        opacity: isFocused ? 1 : 0.5,
      }}
    >
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.grayDark,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="home"
              size={28}
              color={color}
              weight={focused ? "bold" : "regular"}
            />
          ),
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: "Food",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="fork-knife"
              size={28}
              color={color}
              weight={focused ? "bold" : "regular"}
            />
          ),
          tabBarLabel: "Food",
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="shopping-cart"
              size={28}
              color={color}
              weight={focused ? "bold" : "regular"}
            />
          ),
          tabBarLabel: "Cart",
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="list"
              size={28}
              color={color}
              weight={focused ? "bold" : "regular"}
            />
          ),
          tabBarLabel: "Orders",
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="menu"
              size={28}
              color={color}
              weight={focused ? "bold" : "regular"}
            />
          ),
          tabBarLabel: "More",
        }}
      />
    </Tabs>
  );
}
