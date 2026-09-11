import api from "@/app/api";
import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`).catch(async () => {
          return await api.get(`/chef-foods/${id}`);
        });
        setProduct(res.data?.data || res.data);
      } catch (e) {
        console.log("Error loading product detail:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const price = Number(product?.final_price ?? product?.offer_price ?? product?.mrp ?? 0);
  const originalPrice = Number(product?.mrp ?? 0);
  const discount = Number(product?.offer ?? 0);
  const rating = Number(product?.rating ?? product?.average_rating ?? 4.5);
  const chefName = product?.chef_name || product?.homeChefName || product?.vendor_name;
  const getImageUrl = () => {
    if (typeof product?.image === "string" && product.image.trim()) {
      return product.image.trim().split(/\s+/)[0];
    }
    if (Array.isArray(product?.images) && product.images.length > 0) {
      const first = product.images[0];
      if (typeof first === "string") return first.trim().split(/\s+/)[0];
      if (first && typeof first === "object") return (first.url || first.image || "").trim();
    }
    if (typeof product?.images === "string" && product.images.trim()) {
      return product.images.trim().split(/\s+/)[0];
    }
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      const vImg = product.variants[0]?.images;
      if (typeof vImg === "string" && vImg.trim()) {
        return vImg.trim().split(/\s+/)[0];
      }
      if (Array.isArray(vImg) && vImg.length > 0) {
        return typeof vImg[0] === "string" ? vImg[0].trim() : (vImg[0]?.url || "");
      }
    }
    return (
      product?.image_url ||
      product?.product_image ||
      product?.food_image ||
      product?.photo ||
      undefined
    );
  };

  const imageUrl = getImageUrl();

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-borderLight px-4 py-3">
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-full bg-gray"
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="mx-2 flex-1 text-center text-[17px] font-bold text-text" numberOfLines={1}>
          {product?.name || "Product Details"}
        </Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-sm text-textSecondary">Loading details...</Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="pb-[100px]" showsVerticalScrollIndicator={false}>
          {/* Product Image */}
          <View className="relative w-full bg-gray" style={{ height: width * 0.75 }}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center bg-grayLight">
                <MaterialCommunityIcons name="food" size={64} color={colors.textSecondary} />
                <Text className="mt-2 text-[13px] text-textSecondary">No Image Available</Text>
              </View>
            )}
            {discount > 0 && (
              <View className="absolute right-4 top-4 rounded-lg bg-primary px-2.5 py-1">
                <Text className="text-xs font-bold text-white">{discount}% OFF</Text>
              </View>
            )}
          </View>

          {/* Details Section */}
          <View className="p-4">
            <Text className="mb-2 text-[22px] font-bold text-text">{product?.name || "Product"}</Text>

            {Boolean(chefName) && (
              <View className="mb-3 flex-row items-center gap-1.5">
                <MaterialCommunityIcons name="chef-hat" size={18} color={colors.primary} />
                <Text className="text-sm font-semibold text-primary">{chefName}</Text>
              </View>
            )}

            <View className="my-3 flex-row items-center justify-between">
              <View className="flex-row items-baseline gap-2">
                <Text className="text-2xl font-extrabold text-text">₹{price.toFixed(0)}</Text>
                {originalPrice > price && (
                  <Text className="text-base text-textSecondary line-through">₹{originalPrice.toFixed(0)}</Text>
                )}
              </View>

              <View className="flex-row items-center gap-1 rounded-xl bg-[#FFF8E7] px-2.5 py-1">
                <MaterialCommunityIcons name="star" size={16} color="#FFB800" />
                <Text className="text-sm font-bold text-[#B37A00]">{rating.toFixed(1)}</Text>
              </View>
            </View>

            {Boolean(product?.description) && (
              <View className="mt-4 border-t border-borderLight pt-4">
                <Text className="mb-2 text-base font-bold text-text">Description</Text>
                <Text className="text-sm leading-snug text-textSecondary">{product?.description}</Text>
              </View>
            )}

            {/* Quantity Selector */}
            <View className="mt-6 flex-row items-center justify-between border-t border-borderLight pt-4">
              <Text className="text-base font-semibold text-text">Quantity</Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  className="h-9 w-9 items-center justify-center rounded-full bg-gray"
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <MaterialCommunityIcons name="minus" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text className="min-w-[24px] text-center text-base font-bold text-text">{quantity}</Text>
                <TouchableOpacity
                  className="h-9 w-9 items-center justify-center rounded-full bg-gray"
                  onPress={() => setQuantity((q) => q + 1)}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom bar */}
      {!loading && (
        <View
          className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-borderLight bg-white px-5 pt-3 shadow-lg shadow-black"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View>
            <Text className="text-xs text-textSecondary">Total Price</Text>
            <Text className="text-xl font-extrabold text-text">₹{(price * quantity).toFixed(0)}</Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center gap-2 rounded-xl bg-primary px-6 py-3"
            onPress={() => {
              router.push("/(tabs)/cart");
            }}
          >
            <MaterialCommunityIcons name="cart-plus" size={20} color={colors.white} />
            <Text className="text-[15px] font-bold text-white">Add to Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
