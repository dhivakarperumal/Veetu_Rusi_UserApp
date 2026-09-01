import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Product {
  id: string;
  name: string;
  mrp?: number;
  offer_price?: number;
  final_price?: number;
  offer?: number;
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

  const toNumber = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const price = toNumber(product.final_price ?? product.offer_price ?? product.mrp ?? 0);
  const originalPrice = toNumber(product.mrp ?? 0);
  const discount = toNumber(product.offer ?? 0);
  const rating = toNumber(product.rating ?? product.average_rating ?? product.star_rating ?? 4.5);
  const chefName = product.chef_name || product.homeChefName || product.vendor_name || "Home Chef";

  const handlePress = () => {
    router.push({
      pathname: "/product/[id]",
      params: { id: product.id },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className="mb-3 flex-row items-center rounded-[18px] border border-[#F0F0F0] bg-white p-2 shadow-sm"
      style={{
        shadowColor: colors.black,
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View className="relative h-[90px] w-[90px] overflow-hidden rounded-[16px] bg-[#F5F5F5]">
        {product.image ? (
          <Image source={{ uri: product.image }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center bg-[#E8E8E8]">
            <Text className="text-[10px] text-[#757575]">No Image</Text>
          </View>
        )}

        {discount > 0 && (
          <View className="absolute right-2 top-2 rounded-lg bg-[#FF8C42] px-1.5 py-1">
            <Text className="text-[9px] font-bold text-white">{discount}% OFF</Text>
          </View>
        )}
      </View>

      <View className="flex-1 justify-center px-3">
        <Text className="mb-1.5 text-base font-bold text-[#2D3E50]" numberOfLines={2}>
          {product.name}
        </Text>

        <View className="mb-1 flex-row items-center">
          <Text className="text-[15px] font-bold text-[#2D3E50]">₹{price.toFixed(0)}</Text>
          {originalPrice > price && (
            <Text className="ml-2 text-[12px] text-[#757575] line-through">
              ₹{originalPrice.toFixed(0)}
            </Text>
          )}
        </View>

        <View className="mb-1 flex-row items-center">
          <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
          <Text className="ml-1 text-[12px] font-semibold text-[#757575]">
            {rating.toFixed(1)}
          </Text>
        </View>

        {chefName && (
          <Text className="text-[12px] font-semibold text-[#FF8C42]" numberOfLines={1}>
            {chefName}
          </Text>
        )}
      </View>

      <TouchableOpacity
        className="h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-[#FF8C42] bg-white"
        onPress={(event) => {
          event.stopPropagation();
        }}
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
