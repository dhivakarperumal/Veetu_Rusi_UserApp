import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Product {
  id: string;
  name: string;
  mrp?: number | string;
  offer_price?: number | string;
  final_price?: number | string;
  offer?: number | string;
  image?: string;
  chef_name?: string;
  category?: string;
  [key: string]: any;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  const toNumber = (value: unknown, fallback = 0) => {
    if (value === null || value === undefined || value === "") return fallback;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
  };

  const price = toNumber(product.final_price ?? product.offer_price ?? product.mrp, 0);
  const originalPrice = toNumber(product.mrp, 0);
  const discount = toNumber(product.offer, 0);
  const rating = toNumber(product.rating ?? product.average_rating ?? product.star_rating, 4.5);
  const chefName = product.chef_name || product.homeChefName || product.vendor_name || "";
  const getImageUrl = () => {
    if (typeof product.image === "string" && product.image.trim()) {
      return product.image.trim().split(/\s+/)[0];
    }
    if (Array.isArray(product.images) && product.images.length > 0) {
      const first = product.images[0];
      if (typeof first === "string") return first.trim().split(/\s+/)[0];
      if (first && typeof first === "object") return (first.url || first.image || "").trim();
    }
    if (typeof product.images === "string" && product.images.trim()) {
      return product.images.trim().split(/\s+/)[0];
    }
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const vImg = product.variants[0]?.images;
      if (typeof vImg === "string" && vImg.trim()) {
        return vImg.trim().split(/\s+/)[0];
      }
      if (Array.isArray(vImg) && vImg.length > 0) {
        return typeof vImg[0] === "string" ? vImg[0].trim() : (vImg[0]?.url || "");
      }
    }
    return (
      product.image_url ||
      product.product_image ||
      product.food_image ||
      product.photo ||
      undefined
    );
  };

  const imageUrl = getImageUrl();

  const handlePress = () => {
    const productId = product.id || product._id;
    if (productId) {
      try {
        router.push({
          pathname: "/product/[id]" as any,
          params: { id: String(productId) },
        });
      } catch (e) {
        console.log("Nav error:", e);
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className="mb-3 flex-row items-center rounded-[18px] border border-borderLight bg-white p-2.5 shadow-sm shadow-black"
    >
      <View className="relative h-[90px] w-[90px] overflow-hidden rounded-[16px] bg-gray">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center bg-grayLight">
            <Text className="text-[10px] text-textSecondary">No Image</Text>
          </View>
        )}

        {discount > 0 && (
          <View className="absolute right-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5">
            <Text className="text-[9px] font-bold text-white">{discount}% OFF</Text>
          </View>
        )}
      </View>

      <View className="flex-1 justify-center px-3">
        <Text className="mb-1 text-[15px] font-bold text-text" numberOfLines={2}>
          {product.name || "Product"}
        </Text>

        <View className="mb-1 flex-row items-center">
          <Text className="text-[15px] font-bold text-text">₹{price.toFixed(0)}</Text>
          {originalPrice > price && (
            <Text className="ml-2 text-[12px] text-textSecondary line-through">
              ₹{originalPrice.toFixed(0)}
            </Text>
          )}
        </View>

        <View className="mb-1 flex-row items-center">
          <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
          <Text className="ml-1 text-[12px] font-semibold text-textSecondary">
            {rating.toFixed(1)}
          </Text>
        </View>

        {Boolean(chefName) && (
          <Text className="text-[12px] font-semibold text-primary" numberOfLines={1}>
            {chefName}
          </Text>
        )}
      </View>

      <TouchableOpacity
        className="h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-white"
        onPress={(event) => {
          event.stopPropagation();
        }}
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
