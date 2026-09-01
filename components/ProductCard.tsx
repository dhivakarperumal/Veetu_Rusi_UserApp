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
  const imageUrl =
    product.image ||
    (Array.isArray(product.images) && product.images.length > 0
      ? typeof product.images[0] === "string"
        ? product.images[0]
        : product.images[0]?.url || product.images[0]?.image
      : undefined) ||
    product.image_url ||
    product.product_image ||
    product.food_image ||
    product.photo;

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
      className="mb-3 flex-row items-center rounded-[18px] border border-[#F0F0F0] bg-white p-2.5 shadow-sm"
      style={cardStyles.card}
    >
      <View className="relative h-[90px] w-[90px] overflow-hidden rounded-[16px] bg-[#F5F5F5]" style={cardStyles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="h-full w-full" style={cardStyles.image} resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center bg-[#E8E8E8]" style={cardStyles.noImageBox}>
            <Text className="text-[10px] text-[#757575]" style={cardStyles.noImageText}>No Image</Text>
          </View>
        )}

        {discount > 0 && (
          <View className="absolute right-1.5 top-1.5 rounded-md bg-[#FF8C42] px-1.5 py-0.5" style={cardStyles.discountBadge}>
            <Text className="text-[9px] font-bold text-white" style={cardStyles.discountText}>{discount}% OFF</Text>
          </View>
        )}
      </View>

      <View className="flex-1 justify-center px-3" style={cardStyles.infoContainer}>
        <Text className="mb-1 text-[15px] font-bold text-[#2D3E50]" style={cardStyles.productName} numberOfLines={2}>
          {product.name || "Product"}
        </Text>

        <View className="mb-1 flex-row items-center" style={cardStyles.priceRow}>
          <Text className="text-[15px] font-bold text-[#2D3E50]" style={cardStyles.priceText}>₹{price.toFixed(0)}</Text>
          {originalPrice > price && (
            <Text className="ml-2 text-[12px] text-[#757575] line-through" style={cardStyles.originalPriceText}>
              ₹{originalPrice.toFixed(0)}
            </Text>
          )}
        </View>

        <View className="mb-1 flex-row items-center" style={cardStyles.ratingRow}>
          <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
          <Text className="ml-1 text-[12px] font-semibold text-[#757575]" style={cardStyles.ratingText}>
            {rating.toFixed(1)}
          </Text>
        </View>

        {Boolean(chefName) && (
          <Text className="text-[12px] font-semibold text-[#FF8C42]" style={cardStyles.chefNameText} numberOfLines={1}>
            {chefName}
          </Text>
        )}
      </View>

      <TouchableOpacity
        className="h-[36px] w-[36px] items-center justify-center rounded-full border-2 border-[#FF8C42] bg-white"
        style={cardStyles.addButton}
        onPress={(event) => {
          event.stopPropagation();
        }}
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const cardStyles = {
  card: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 10,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: "hidden" as const,
    backgroundColor: "#F5F5F5",
    position: "relative" as const,
  },
  image: {
    width: "100%" as const,
    height: "100%" as const,
  },
  noImageBox: {
    width: "100%" as const,
    height: "100%" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.grayLight,
  },
  noImageText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  discountBadge: {
    position: "absolute" as const,
    top: 6,
    right: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "700" as const,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center" as const,
    paddingHorizontal: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: colors.text,
  },
  originalPriceText: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: "line-through" as const,
    marginLeft: 8,
  },
  ratingRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  chefNameText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};
