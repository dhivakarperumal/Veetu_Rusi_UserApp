import api from "@/app/api";
import { customAlert as Alert } from "@/components/CustomAlertHost";
import { colors } from "@/config/colors";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { addToFoodCart, toggleWishlist, isInWishlist } = useStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedWeight, setSelectedWeight] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [apiReviews, setApiReviews] = useState<any[] | null>(null);

  const productId = String(
    product?.id || product?._id || product?.product_id || id || "",
  );
  const isWishlisted = isInWishlist(productId);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`).catch(async () => {
          return await api.get(`/chef-foods/${id}`);
        });
        const loadedProduct = res.data?.data || res.data;
        setProduct(loadedProduct);
        setSelectedImageIndex(0);

        try {
          const reviewsRes = await api.get("/reviews");
          const allReviews = Array.isArray(reviewsRes?.data?.reviews)
            ? reviewsRes.data.reviews
            : Array.isArray(reviewsRes?.data)
              ? reviewsRes.data
              : [];
          const loadedProductId = String(
            loadedProduct?.id ||
              loadedProduct?._id ||
              loadedProduct?.product_id ||
              id,
          );
          setApiReviews(
            allReviews.filter((review: any) => {
              const reviewProductId =
                review?.product_id || review?.productId || review?.food_id;
              return String(reviewProductId || "") === loadedProductId;
            }),
          );
        } catch (reviewError) {
          console.warn("Could not load product reviews from API:", reviewError);
          setApiReviews(null);
        }
      } catch (e) {
        console.log("Error loading product detail:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const weightOptions = Array.from(
    new Set(
      [
        ...(Array.isArray(product?.weights) ? product.weights : []),
        ...(Array.isArray(product?.variants)
          ? product.variants.map((variant: any) => variant?.weight)
          : []),
        product?.weight,
      ]
        .map((weight) => String(weight || "").trim())
        .filter(Boolean),
    ),
  );
  const activeWeight = selectedWeight || weightOptions[0] || "";
  const selectedVariant =
    (Array.isArray(product?.variants)
      ? product.variants.find(
          (variant: any) => String(variant?.weight || "") === activeWeight,
        )
      : null) ||
    product?.variants?.[0] ||
    null;
  const price = Number(
    selectedVariant?.offerPrice ??
      selectedVariant?.offer_price ??
      selectedVariant?.price ??
      product?.final_price ??
      product?.offer_price ??
      product?.mrp ??
      0,
  );
  const originalPrice = Number(
    selectedVariant?.mrp ?? selectedVariant?.price ?? product?.mrp ?? 0,
  );
  const discount = Number(product?.offer ?? 0);
  const rating = Number(product?.rating ?? product?.average_rating ?? 4.5);
  const embeddedReviews = Array.isArray(product?.reviews)
    ? product.reviews
    : Array.isArray(product?.reviews_data)
      ? product.reviews_data
      : [];
  const productReviews = apiReviews ?? embeddedReviews;
  const currentUserId = String(user?.id || user?.user_id || "");
  const hasReviewed = Boolean(
    currentUserId &&
    productReviews.some((review: any) => {
      const reviewUserId =
        review?.user_id ||
        review?.userId ||
        review?.customer_id ||
        review?.created_by;
      return String(reviewUserId || "") === currentUserId;
    }),
  );
  const reviewCount = productReviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map((value) => ({
    value,
    count: productReviews.filter(
      (review: any) => Number(review?.rating) === value,
    ).length,
  }));
  const chefName =
    product?.chef_name || product?.homeChefName || product?.vendor_name;
  const getImageUrl = () => {
    if (typeof product?.image === "string" && product.image.trim()) {
      return product.image.trim().split(/\s+/)[0];
    }
    if (Array.isArray(product?.images) && product.images.length > 0) {
      const first = product.images[0];
      if (typeof first === "string") return first.trim().split(/\s+/)[0];
      if (first && typeof first === "object")
        return (first.url || first.image || "").trim();
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
        return typeof vImg[0] === "string"
          ? vImg[0].trim()
          : vImg[0]?.url || "";
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
  const galleryImages = Array.from(
    new Set(
      [
        product?.image,
        ...(Array.isArray(product?.images) ? product.images : []),
        ...(typeof product?.images === "string"
          ? product.images.split(/\s+/)
          : []),
        ...(Array.isArray(product?.variants)
          ? product.variants.flatMap((variant: any) =>
              Array.isArray(variant?.images)
                ? variant.images
                : [variant?.images],
            )
          : []),
        imageUrl,
      ]
        .map((image: any) =>
          typeof image === "string"
            ? image.trim()
            : image?.url || image?.image || "",
        )
        .filter(Boolean),
    ),
  );
  const selectedImageUrl =
    galleryImages[selectedImageIndex] || galleryImages[0] || imageUrl;

  const pickReviewImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow photo access to upload an image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setReviewImage(result.assets[0].uri);
    }
  };

  const submitReview = async () => {
    if (hasReviewed) {
      Alert.alert("Already Reviewed", "You can review this product only once.");
      return;
    }
    if (!reviewRating) {
      Alert.alert("Rating Required", "Please select a star rating.");
      return;
    }

    setReviewSubmitting(true);
    try {
      const userId = user?.id || user?.user_id;
      const newReview = {
        product_id: productId,
        user_id: userId,
        user_name: user?.name || user?.username || user?.email || "Customer",
        rating: reviewRating,
        comment: reviewComment.trim(),
        image: reviewImage,
      };
      await api.post("/reviews", newReview);
      setApiReviews((currentReviews) => [
        newReview,
        ...(currentReviews ?? embeddedReviews),
      ]);
      setProduct((current: any) => ({
        ...current,
        reviews: [
          newReview,
          ...(Array.isArray(current?.reviews) ? current.reviews : []),
        ],
      }));
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewComment("");
      setReviewImage(null);
      Alert.alert("Review Submitted", "Thank you for sharing your experience.");
    } catch (error) {
      console.error("Review submission failed:", error);
      Alert.alert("Error", "Could not submit your review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-borderLight px-4 py-3">
        <View className="flex-1 flex-row items-center">
          <TouchableOpacity
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray"
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text
            className="flex-1 text-[17px] font-bold text-text"
            numberOfLines={1}
          >
            {product?.name || "Product Details"}
          </Text>
        </View>
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-full bg-gray active:bg-grayDark/20"
          onPress={async () => {
            if (!product) return;
            const uid = user?.id || user?.user_id;
            if (!uid) {
              Alert.alert(
                "Login Required",
                "Please login to add this dish to your wishlist.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Login", onPress: () => router.push("/auth/login") },
                ],
              );
              return;
            }
            await toggleWishlist(product);
          }}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={22}
            color={isWishlisted ? colors.error : colors.text}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-sm text-textSecondary">
            Loading details...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="pb-[100px]"
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image */}
          <View
            className="relative w-full overflow-hidden rounded-t-2xl bg-gray"
            style={{ height: width * 0.75 }}
          >
            {selectedImageUrl ? (
              <Image
                source={{ uri: selectedImageUrl }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-grayLight">
                <MaterialCommunityIcons
                  name="food"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text className="mt-2 text-[13px] text-textSecondary">
                  No Image Available
                </Text>
              </View>
            )}
            {discount > 0 && (
              <View className="absolute right-4 top-4 rounded-lg bg-primary px-2.5 py-1">
                <Text className="text-xs font-bold text-white">
                  {discount}% OFF
                </Text>
              </View>
            )}
          </View>

          {galleryImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 px-4 py-3"
            >
              {galleryImages.map((galleryImage, index) => (
                <TouchableOpacity
                  key={`${galleryImage}-${index}`}
                  onPress={() => setSelectedImageIndex(index)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    selectedImageIndex === index
                      ? "border-primary"
                      : "border-borderLight"
                  }`}
                >
                  <Image
                    source={{ uri: galleryImage }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Details Section */}
          <View className="p-4">
            <Text className="mb-2 text-[22px] font-bold text-text">
              {product?.name || "Product"}
            </Text>

            {Boolean(chefName) && (
              <View className="mb-3 flex-row items-center gap-1.5">
                <MaterialCommunityIcons
                  name="chef-hat"
                  size={18}
                  color={colors.primary}
                />
                <Text className="text-sm font-semibold text-primary">
                  {chefName}
                </Text>
              </View>
            )}

            {weightOptions.length > 0 && (
              <View className="mb-3">
                <Text className="mb-2 text-sm font-bold text-text">
                  Weight Options
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2"
                >
                  {weightOptions.map((weight) => (
                    <TouchableOpacity
                      key={weight}
                      onPress={() => setSelectedWeight(weight)}
                      className={`rounded-lg border px-3 py-2 ${
                        activeWeight === weight
                          ? "border-primary bg-primary"
                          : "border-borderLight bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          activeWeight === weight ? "text-white" : "text-text"
                        }`}
                      >
                        {weight}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View className="my-3 flex-row items-center justify-between">
              <View className="flex-row items-baseline gap-2">
                <Text className="text-2xl font-extrabold text-text">
                  ₹{price.toFixed(0)}
                </Text>
                {originalPrice > price && (
                  <Text className="text-base text-textSecondary line-through">
                    ₹{originalPrice.toFixed(0)}
                  </Text>
                )}
              </View>

              <View className="flex-row items-center gap-1 rounded-xl bg-[#FFF8E7] px-2.5 py-1">
                <MaterialCommunityIcons name="star" size={16} color="#FFB800" />
                <Text className="text-sm font-bold text-[#B37A00]">
                  {rating.toFixed(1)}
                </Text>
              </View>
            </View>

            {Boolean(product?.description) && (
              <View className="mt-4 border-t border-borderLight pt-4">
                <Text className="mb-2 text-base font-bold text-text">
                  Description
                </Text>
                <Text className="text-sm leading-snug text-textSecondary">
                  {product?.description}
                </Text>
              </View>
            )}

            {/* Reviews Section */}
            <View className="mt-6 border-t border-borderLight pt-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-extrabold text-primary">
                  Add Reviews
                </Text>
                <TouchableOpacity
                  disabled={hasReviewed}
                  onPress={() => {
                    if (!user) {
                      Alert.alert(
                        "Login Required",
                        "Please login to write a review after your order.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Login",
                            onPress: () => router.push("/auth/login"),
                          },
                        ],
                      );
                      return;
                    }
                    setShowReviewModal(true);
                  }}
                  className={`rounded-xl px-4 py-2.5 ${
                    hasReviewed ? "bg-gray" : "bg-primary active:opacity-80"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      hasReviewed ? "text-textSecondary" : "text-white"
                    }`}
                  >
                    {hasReviewed ? "Reviewed" : "Write Review"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text className="mb-3 mt-5 text-lg font-bold text-text">
                Customer Reviews
              </Text>

              <View className="rounded-2xl border border-borderLight bg-white p-4">
                <View className="flex-row items-center">
                  <View className="mr-5 items-center">
                    <Text className="text-4xl font-black text-text">
                      {reviewCount > 0 ? rating.toFixed(1) : "0"}
                    </Text>
                    <View className="mt-1 flex-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialCommunityIcons
                          key={star}
                          name="star"
                          size={15}
                          color={
                            reviewCount > 0 && star <= Math.round(rating)
                              ? "#FFB800"
                              : colors.grayLight
                          }
                        />
                      ))}
                    </View>
                    <Text className="mt-1 text-[11px] text-textSecondary">
                      Based on {reviewCount} reviews
                    </Text>
                  </View>

                  <View className="flex-1 gap-2">
                    {ratingDistribution.map(({ value, count }) => (
                      <View key={value} className="flex-row items-center gap-2">
                        <Text className="w-3 text-xs text-text">{value}</Text>
                        <MaterialCommunityIcons
                          name="star"
                          size={13}
                          color="#FFB800"
                        />
                        <View className="h-2 flex-1 overflow-hidden rounded-full bg-grayLight">
                          <View
                            className="h-full rounded-full bg-primary"
                            style={{
                              width:
                                reviewCount > 0
                                  ? `${(count / reviewCount) * 100}%`
                                  : "0%",
                            }}
                          />
                        </View>
                        <Text className="w-5 text-right text-xs text-textSecondary">
                          {count}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {reviewCount === 0 && (
                  <View className="mt-4 rounded-xl bg-gray px-3 py-4">
                    <Text className="text-center text-sm text-textSecondary">
                      No reviews yet. Be the first to share your experience!
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Quantity Selector */}
            <View className="mt-6 flex-row items-center justify-between border-t border-borderLight pt-4">
              <Text className="text-base font-semibold text-text">
                Quantity
              </Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  className="h-9 w-9 items-center justify-center rounded-full bg-gray"
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <MaterialCommunityIcons
                    name="minus"
                    size={18}
                    color={colors.text}
                  />
                </TouchableOpacity>
                <Text className="min-w-[24px] text-center text-base font-bold text-text">
                  {quantity}
                </Text>
                <TouchableOpacity
                  className="h-9 w-9 items-center justify-center rounded-full bg-gray"
                  onPress={() => setQuantity((q) => q + 1)}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom bar */}
      {!loading && (
        <View
          className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-borderLight bg-white px-4 pt-3 shadow-lg shadow-black"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="mr-3">
            <Text className="text-xs text-textSecondary">Total Price</Text>
            <Text className="text-xl font-extrabold text-text">
              ₹{(price * quantity).toFixed(0)}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="flex-row items-center gap-1.5 rounded-xl border border-primary bg-white px-3.5 py-2.5 active:bg-primary/10"
              onPress={async () => {
                if (!product) return;
                await addToFoodCart(
                  product,
                  selectedVariant,
                  activeWeight || null,
                  quantity,
                );
                Alert.alert(
                  "Added to Cart! 🛒",
                  `${quantity}x ${product.name || "item"} added to your food cart.`,
                  [
                    { text: "Continue Shopping", style: "cancel" },
                    {
                      text: "View Cart",
                      onPress: () => router.push("/(tabs)/cart"),
                    },
                  ],
                );
              }}
            >
              <MaterialCommunityIcons
                name="cart-plus"
                size={18}
                color={colors.primary}
              />
              <Text className="text-[13px] font-bold text-primary">
                Add To Cart
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 shadow-md shadow-primary/30 active:opacity-90"
              onPress={() => {
                if (!product) return;
                const buyNowData = {
                  product,
                  variant: selectedVariant,
                  size: activeWeight || null,
                  quantity,
                };
                router.push({
                  pathname: "/checkout",
                  params: {
                    buyNowItem: JSON.stringify(buyNowData),
                  },
                });
              }}
            >
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={18}
                color={colors.white}
              />
              <Text className="text-[13px] font-bold text-white">Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[88%] rounded-t-[26px] bg-white px-5 pb-8 pt-5">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-text">
                Share your experience
              </Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <Text className="mb-2 text-base text-text">Rating</Text>
            <View className="mb-6 flex-row gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                  hitSlop={6}
                >
                  <MaterialCommunityIcons
                    name="star"
                    size={32}
                    color={star <= reviewRating ? "#FFB800" : colors.grayLight}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text className="mb-2 text-base text-text">Review</Text>
            <TextInput
              className="mb-6 h-32 rounded-xl border border-borderLight px-4 py-3 text-base text-text"
              placeholder="Write your review here..."
              placeholderTextColor={colors.textSecondary}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              textAlignVertical="top"
            />

            <Text className="mb-2 text-base text-text">
              Upload Image (optional)
            </Text>
            <TouchableOpacity
              onPress={pickReviewImage}
              className="mb-6 flex-row items-center rounded-xl border border-borderLight px-3 py-3"
            >
              <MaterialCommunityIcons
                name="image-plus"
                size={22}
                color={colors.textSecondary}
              />
              <Text
                className="ml-2 flex-1 text-sm text-textSecondary"
                numberOfLines={1}
              >
                {reviewImage ? "Image selected" : "Choose an image"}
              </Text>
              {reviewImage && (
                <Image
                  source={{ uri: reviewImage }}
                  className="h-9 w-9 rounded-md"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={submitReview}
              disabled={reviewSubmitting}
              className="items-center rounded-xl bg-primary py-3.5 active:opacity-80"
            >
              {reviewSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text className="text-base font-bold text-white">
                  Submit Review
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
