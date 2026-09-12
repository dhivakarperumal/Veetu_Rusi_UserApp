import { colors } from "@/config/colors";
import { useStore, WishlistItem } from "@/context/StoreContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WishlistScreen() {
  const router = useRouter();
  const {
    wishlist,
    loadingWishlist,
    fetchWishlist,
    toggleWishlist,
    addToFoodCart,
  } = useStore();

  const [refreshing, setRefreshing] = useState(false);
  const [addingCartId, setAddingCartId] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchWishlist();
    } catch (e) {
      console.warn("Refresh wishlist error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemove = (item: WishlistItem) => {
    Alert.alert(
      "Remove Item",
      `Remove "${item.name || "this item"}" from your wishlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await toggleWishlist(item.product || item);
          },
        },
      ],
    );
  };

  const handleAddToCart = async (item: WishlistItem) => {
    const itemKey = String(item.product_id || item.id || item._id);
    try {
      setAddingCartId(itemKey);
      const productObj = item.product || {
        ...item,
        id: item.product_id || item.id,
      };
      await addToFoodCart(productObj, null, item.variant_size || null, 1);
      Alert.alert(
        "Added to Cart! 🛒",
        `"${item.name || "Dish"}" added to your cart.`,
        [
          { text: "Continue Shopping", style: "cancel" },
          {
            text: "View Cart",
            onPress: () => router.push("/(tabs)/cart"),
          },
        ],
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not add item to cart.");
    } finally {
      setAddingCartId(null);
    }
  };

  const handleBuyNow = (item: WishlistItem) => {
    const productObj = item.product || {
      ...item,
      id: item.product_id || item.id,
    };
    const buyNowData = {
      product: productObj,
      variant: productObj.variants?.[0] || null,
      size: item.variant_size || null,
      quantity: 1,
    };
    router.push({
      pathname: "/checkout",
      params: {
        buyNowItem: JSON.stringify(buyNowData),
      },
    });
  };

  const handlePressItem = (item: WishlistItem) => {
    const pId = item.product_id || item.id || item._id;
    if (pId) {
      router.push({
        pathname: "/product/[id]" as any,
        params: { id: String(pId) },
      });
    }
  };

  const renderItem = ({ item }: { item: WishlistItem }) => {
    const rawPrice = item.price || item.final_price || item.total_price || 0;
    const price = parseFloat(String(rawPrice)) || 0;
    const mrp = parseFloat(String(item.mrp || rawPrice)) || price;
    const discount =
      mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const rating = item.rating || item.average_rating || 4.5;
    const chefName = item.chef_name || item.homeChefName || "";

    const itemKey = String(item.product_id || item.id || item._id);
    const isAdding = addingCartId === itemKey;

    let imageUrl = "";
    if (typeof item.image === "string" && item.image.trim()) {
      imageUrl = item.image.trim().split(/\s+/)[0];
    } else if (item.product?.image) {
      imageUrl = String(item.product.image).trim().split(/\s+/)[0];
    } else if (Array.isArray(item.product?.images) && item.product.images.length > 0) {
      const first = item.product.images[0];
      imageUrl = typeof first === "string" ? first.trim().split(/\s+/)[0] : first?.url || "";
    }

    return (
      <TouchableOpacity
        onPress={() => handlePressItem(item)}
        activeOpacity={0.9}
        className="mb-3.5 flex-row rounded-2xl border border-borderLight bg-white p-3 shadow-sm shadow-black/10"
      >
        {/* Product Thumbnail */}
        <View className="relative h-24 w-24 overflow-hidden rounded-xl bg-gray">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-grayLight">
              <MaterialCommunityIcons
                name="food"
                size={32}
                color={colors.textSecondary}
              />
            </View>
          )}

          {discount > 0 && (
            <View className="absolute right-1 top-1 rounded bg-primary px-1.5 py-0.5 shadow-sm">
              <Text className="text-[9px] font-black text-white">
                {discount}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View className="ml-3 flex-1 justify-between">
          <View>
            <View className="flex-row items-start justify-between">
              <Text
                className="flex-1 pr-2 text-[15px] font-bold text-text"
                numberOfLines={1}
              >
                {item.name || "Food Item"}
              </Text>

              {/* Remove Trash Button */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemove(item);
                }}
                hitSlop={8}
                className="h-7 w-7 items-center justify-center rounded-full bg-red-50 active:bg-red-100"
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={16}
                  color={colors.error}
                />
              </TouchableOpacity>
            </View>

            {Boolean(chefName) && (
              <View className="mt-0.5 flex-row items-center gap-1">
                <MaterialCommunityIcons
                  name="chef-hat"
                  size={12}
                  color={colors.primary}
                />
                <Text
                  className="text-[12px] font-semibold text-primary"
                  numberOfLines={1}
                >
                  {chefName}
                </Text>
              </View>
            )}

            {/* Price & Rating Row */}
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="text-[16px] font-black text-text">
                ₹{price.toFixed(0)}
              </Text>
              {mrp > price && (
                <Text className="text-[12px] text-textSecondary line-through">
                  ₹{mrp.toFixed(0)}
                </Text>
              )}
              <View className="ml-auto flex-row items-center rounded-md bg-[#FFF8E7] px-1.5 py-0.5">
                <MaterialCommunityIcons name="star" size={12} color="#FFB800" />
                <Text className="ml-0.5 text-[11px] font-bold text-[#B37A00]">
                  {Number(rating).toFixed(1)}
                </Text>
              </View>
            </View>
          </View>

          {/* Dual Action Buttons: Add to Cart & Buy Now */}
          <View className="mt-2.5 flex-row items-center gap-2">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart(item);
              }}
              disabled={isAdding}
              className="flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-primary bg-white py-2 active:bg-primary/10"
            >
              <MaterialCommunityIcons
                name="cart-plus"
                size={14}
                color={colors.primary}
              />
              <Text className="text-[12px] font-bold text-primary">
                {isAdding ? "Adding..." : "Add to Cart"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleBuyNow(item);
              }}
              className="flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-primary py-2 shadow-sm shadow-primary/30 active:opacity-90"
            >
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={14}
                color={colors.white}
              />
              <Text className="text-[12px] font-bold text-white">Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-borderLight bg-white px-4 py-3">
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-full bg-gray active:bg-grayDark/20"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-[18px] font-extrabold text-text">
            My Wishlist
          </Text>
          <Text className="text-[11px] font-semibold text-textSecondary">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
          </Text>
        </View>

        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-full bg-gray active:bg-grayDark/20"
          onPress={() => router.push("/(tabs)/cart")}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="cart-outline"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loadingWishlist && wishlist.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-sm text-textSecondary">
            Loading your favorites...
          </Text>
        </View>
      ) : wishlist.length === 0 ? (
        /* Empty State */
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <MaterialCommunityIcons
              name="heart-outline"
              size={52}
              color={colors.primary}
            />
          </View>
          <Text className="text-center text-[20px] font-extrabold text-text">
            Your Wishlist is Empty
          </Text>
          <Text className="mt-2 text-center text-[13px] leading-relaxed text-textSecondary">
            Explore delicious authentic home dishes and tap the heart icon to save
            your favorites here!
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/food")}
            className="mt-6 flex-row items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 shadow-md shadow-primary/30 active:opacity-90"
          >
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={18}
              color={colors.white}
            />
            <Text className="text-base font-bold text-white">
              Explore Dishes
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* List of Wishlisted Items */
        <FlatList
          data={wishlist}
          keyExtractor={(item, index) =>
            String(item.product_id || item.id || item._id || index)
          }
          renderItem={renderItem}
          contentContainerClassName="p-4 pb-12"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
