import AppHeader from "@/components/AppHeader";
import { useStore } from "@/context/StoreContext";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { cartItems } = useStore();
  const total = cartItems.reduce(
    (sum, item) =>
      sum +
      Number(item.final_price ?? item.offer_price ?? item.mrp ?? 0) *
        item.quantity,
    0,
  );

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
      }}
    >
      <AppHeader title="Cart" />
      {cartItems.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-3xl font-bold text-text">Cart</Text>
          <Text className="mt-3 text-base text-textSecondary">
            Your shopping cart is empty
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          {cartItems.map((item) => (
            <View
              key={item.id}
              className="mb-3 rounded-[18px] border border-borderLight bg-white p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-[16px] font-bold text-text">
                  {item.name}
                </Text>
                <Text className="ml-3 text-[15px] font-bold text-text">
                  × {item.quantity}
                </Text>
              </View>
              <Text className="mt-2 text-[14px] text-textSecondary">
                ₹
                {Number(
                  item.final_price ?? item.offer_price ?? item.mrp ?? 0,
                ).toFixed(2)}{" "}
                each
              </Text>
            </View>
          ))}
          <View className="mt-2 flex-row items-center justify-between border-t border-borderLight pt-4">
            <Text className="text-[18px] font-bold text-text">Total</Text>
            <Text className="text-[20px] font-extrabold text-text">
              ₹{total.toFixed(2)}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
