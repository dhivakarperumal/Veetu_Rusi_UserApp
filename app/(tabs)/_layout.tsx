import { useStore } from "@/context/StoreContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/config/colors";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const { userFoodCart, activeOrdersCount } = useStore();

  // Total item count (sum of quantities) in cart
  const cartCount = userFoodCart.reduce(
    (total, item) => total + (Number(item.quantity) || 1),
    0,
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.grayDark,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIconStyle: {
          marginBottom: 1,
        },
        tabBarBadgeStyle: {
          backgroundColor: colors.primary,
          color: colors.white,
          fontSize: 10,
          fontWeight: "bold",
          minWidth: 16,
          height: 16,
          lineHeight: 16,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
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
            <Ionicons
              name={focused ? "restaurant" : "restaurant-outline"}
              size={24}
              color={color}
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
            <Ionicons
              name={focused ? "cart" : "cart-outline"}
              size={24}
              color={color}
            />
          ),
          tabBarLabel: "Cart",
          tabBarBadge: cartCount > 0 ? (cartCount > 99 ? "99+" : cartCount) : undefined,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={24}
              color={color}
            />
          ),
          tabBarLabel: "Orders",
          tabBarBadge:
            activeOrdersCount > 0
              ? activeOrdersCount > 99
                ? "99+"
                : activeOrdersCount
              : undefined,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={24}
              color={color}
            />
          ),
          tabBarLabel: "More",
        }}
      />
    </Tabs>
  );
}
