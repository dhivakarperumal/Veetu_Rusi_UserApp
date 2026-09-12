import AppHeader from "@/components/AppHeader";
import { customAlert as Alert } from "@/components/CustomAlertHost";
import { colors } from "@/config/colors";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    userFoodCart,
    updateFoodCartQuantity,
    removeFromFoodCart,
    clearUserFoodCart,
  } = useStore();

  const itemsTotal = userFoodCart.reduce((acc, item) => {
    const p = parseFloat(String(item.price || 0));
    const q = item.quantity || 1;
    return acc + p * q;
  }, 0);

  const deliveryFee = itemsTotal > 299 || itemsTotal === 0 ? 0 : 35;
  const packagingFee = userFoodCart.length > 0 ? 15 : 0;
  const grandTotal = itemsTotal + deliveryFee + packagingFee;

  const handleClearCart = () => {
    Alert.alert("Clear Cart", "Are you sure you want to remove all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: clearUserFoodCart,
      },
    ]);
  };

  const handleCheckout = () => {
    if (!user) {
      Alert.alert(
        "Login Required",
        "Please login to your account to proceed to checkout.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/auth/login") },
        ],
      );
      return;
    }
    router.push("/checkout");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <AppHeader title="Cart" />

      {userFoodCart.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-28 w-28 items-center justify-center rounded-full bg-primary/10">
            <MaterialCommunityIcons
              name="cart-outline"
              size={56}
              color={colors.primary}
            />
          </View>
          <Text className="text-2xl font-black text-text">
            Your Cart is Empty
          </Text>
          <Text className="mt-2 text-center text-[13px] text-textSecondary px-6">
            Looks like you haven&apos;t added any fresh, homemade food to your
            cart yet.
          </Text>
          <TouchableOpacity
            className="mt-6 flex-row items-center gap-2 rounded-full bg-primary px-8 py-3.5 shadow-md shadow-primary/30 active:opacity-90"
            onPress={() => router.push("/(tabs)/food")}
          >
            <MaterialCommunityIcons
              name="food"
              size={20}
              color={colors.white}
            />
            <Text className="text-sm font-bold text-white">
              Explore Home Chefs →
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-3"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[16px] font-black text-text">
              Items in Cart ({userFoodCart.length})
            </Text>
            <TouchableOpacity onPress={handleClearCart} hitSlop={8}>
              <Text className="text-[12px] font-bold text-error">
                Clear All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cart Items List */}
          {userFoodCart.map((item, index) => {
            const itemPrice = parseFloat(String(item.price || 0));
            const itemQty = item.quantity || 1;
            const itemTotal = itemPrice * itemQty;

            return (
              <View
                key={item.id || item.product_id || index}
                className="mb-3 flex-row items-center rounded-2xl border border-borderLight bg-white p-3 shadow-sm shadow-black/5"
              >
                {/* Food Image */}
                <View className="h-20 w-20 overflow-hidden rounded-xl bg-gray">
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center bg-grayLight">
                      <MaterialCommunityIcons
                        name="food"
                        size={28}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                </View>

                {/* Details */}
                <View className="ml-3 flex-1 justify-center">
                  <Text
                    className="text-[14px] font-black text-text"
                    numberOfLines={1}
                  >
                    {item.name || "Chef Dish"}
                  </Text>

                  {Boolean(item.chef_name) && (
                    <Text
                      className="text-[11px] font-semibold text-primary"
                      numberOfLines={1}
                    >
                      By {item.chef_name}
                    </Text>
                  )}

                  {Boolean(item.variant_size) && (
                    <Text className="text-[11px] text-textSecondary">
                      Portion: {item.variant_size}
                    </Text>
                  )}

                  <Text className="mt-1 text-[14px] font-black text-text">
                    ₹{itemTotal.toFixed(0)}
                  </Text>
                </View>

                {/* Stepper + Delete */}
                <View className="items-end justify-between">
                  <TouchableOpacity
                    onPress={() => removeFromFoodCart(item.id)}
                    className="p-1 mb-2"
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color={colors.error}
                    />
                  </TouchableOpacity>

                  <View className="flex-row items-center rounded-lg border border-borderLight bg-[#fafafa] px-1.5 py-0.5">
                    <TouchableOpacity
                      onPress={() => {
                        if (itemQty > 1) {
                          updateFoodCartQuantity(item.id, itemQty - 1);
                        } else {
                          removeFromFoodCart(item.id);
                        }
                      }}
                      className="h-6 w-6 items-center justify-center"
                      hitSlop={6}
                    >
                      <MaterialCommunityIcons
                        name="minus"
                        size={14}
                        color={colors.text}
                      />
                    </TouchableOpacity>

                    <Text className="min-w-[20px] text-center text-xs font-black text-text">
                      {itemQty}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        updateFoodCartQuantity(item.id, itemQty + 1)
                      }
                      className="h-6 w-6 items-center justify-center"
                      hitSlop={6}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={14}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Bill Details Summary Card */}
          <View className="mt-2 rounded-2xl border border-borderLight bg-white p-4 shadow-sm shadow-black/5">
            <Text className="mb-3 text-[15px] font-black text-text">
              Bill Details
            </Text>

            <View className="mb-2 flex-row justify-between">
              <Text className="text-xs text-textSecondary">Item Total</Text>
              <Text className="text-xs font-bold text-text">
                ₹{itemsTotal.toFixed(0)}
              </Text>
            </View>

            <View className="mb-2 flex-row justify-between">
              <Text className="text-xs text-textSecondary">Delivery Fee</Text>
              <Text
                className={`text-xs font-bold ${
                  deliveryFee === 0 ? "text-primary" : "text-text"
                }`}
              >
                {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
              </Text>
            </View>

            <View className="mb-2 flex-row justify-between">
              <Text className="text-xs text-textSecondary">
                Packaging & Handling
              </Text>
              <Text className="text-xs font-bold text-text">
                ₹{packagingFee}
              </Text>
            </View>

            <View className="my-2 border-t border-borderLight" />

            <View className="flex-row items-baseline justify-between">
              <Text className="text-sm font-black text-text">To Pay</Text>
              <Text className="text-lg font-black text-primary">
                ₹{grandTotal.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Checkout Button */}
          <TouchableOpacity
            className="my-5 flex-row items-center justify-between rounded-2xl bg-primary px-6 py-4 shadow-lg shadow-primary/30 active:opacity-90"
            onPress={handleCheckout}
          >
            <View>
              <Text className="text-[11px] font-semibold text-white/80">
                Total Amount
              </Text>
              <Text className="text-lg font-black text-white">
                ₹{grandTotal.toFixed(0)}
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Text className="text-base font-black text-white">
                Proceed to Checkout
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color={colors.white}
              />
            </View>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
