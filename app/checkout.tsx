import { API_BASE_URL } from "@/app/api";
import { colors } from "@/config/colors";
import { useAuth } from "@/context/AuthContext";
import { CartItem, useStore } from "@/context/StoreContext";
import {
  readUserAddresses,
  upsertUserAddress,
  UserAddress,
} from "@/utils/addressStorage";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const TIME_SLOTS = [
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const getTomorrowDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const getAvailableDates = () => {
  const dates: { dateStr: string; label: string; subLabel: string }[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    const dayNum = d.getDate();
    const label = i === 1 ? "Tomorrow" : i === 2 ? "Day After" : `${dayName}`;
    const subLabel = `${dayNum} ${monthName}`;
    dates.push({ dateStr, label, subLabel });
  }
  return dates;
};

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { userFoodCart, placeFoodOrder } = useStore();
  const params = useLocalSearchParams<{
    buyNowItem?: string;
    appliedCoupon?: string;
  }>();

  // Buy now item and coupon parsing
  const buyNowItem = useMemo(() => {
    if (!params.buyNowItem) return null;
    try {
      return JSON.parse(params.buyNowItem);
    } catch {
      return null;
    }
  }, [params.buyNowItem]);

  const appliedCoupon = useMemo(() => {
    if (!params.appliedCoupon) return null;
    try {
      return JSON.parse(params.appliedCoupon);
    } catch {
      return null;
    }
  }, [params.appliedCoupon]);

  // Form states
  const [name, setName] = useState(user?.name || user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || user?.mobile || "");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [stateValue, setStateValue] = useState("Tamil Nadu");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("India");

  // Delivery slot states
  const availableDates = useMemo(() => getAvailableDates(), []);
  const [deliveryDate, setDeliveryDate] = useState(getTomorrowDate());
  const [deliveryTime, setDeliveryTime] = useState("12:00");
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash on Delivery" | "Online Payment"
  >("Cash on Delivery");

  // Loading & async states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Search Address states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [showSavedAddressesModal, setShowSavedAddressesModal] = useState(false);
  const [showStatePickerModal, setShowStatePickerModal] = useState(false);
  const [stateSearchText, setStateSearchText] = useState("");

  const userId = user?.id || user?.user_id;

  // Checkout items list
  const checkoutItems = useMemo(() => {
    if (buyNowItem?.product) {
      const prod = buyNowItem.product;
      const variant = buyNowItem.variant;
      const price =
        variant?.final_price ||
        variant?.offerPrice ||
        variant?.price ||
        prod.final_price ||
        prod.offer_price ||
        prod.price ||
        prod.mrp ||
        0;
      const image =
        variant?.images?.[0] ||
        prod.images?.[0] ||
        prod.image ||
        "";

      return [
        {
          id: String(prod.id || prod.product_id),
          product_id: String(prod.product_id || prod.id),
          name: prod.name || prod.c_name || "Food Item",
          image: typeof image === "string" ? image : "",
          price: parseFloat(String(price)),
          total_price: parseFloat(String(price)) * (buyNowItem.quantity || 1),
          quantity: buyNowItem.quantity || 1,
          variant_size: buyNowItem.size || variant?.selectedSizes?.[0] || "",
          variant_color: variant?.colorName || "",
          chef_user_id:
            prod.chef_user_id ||
            prod.created_by ||
            prod.created_by_user_id ||
            "",
          chef_id: prod.chef_id || "",
          chef_name:
            prod.chef_name ||
            prod.created_by_name ||
            prod.homeChefName ||
            "",
          chef_email:
            prod.chef_email ||
            prod.created_by_email ||
            "",
          chef_phone:
            prod.chef_phone ||
            prod.created_by_phone ||
            "",
          franchise_id: prod.franchise_id || "",
          franchise_user_id: prod.franchise_user_id || "",
          franchise_name: prod.franchise_name || "",
          franchise_email: prod.franchise_email || "",
          franchise_phone: prod.franchise_phone || "",
        } as CartItem,
      ];
    }
    return userFoodCart;
  }, [buyNowItem, userFoodCart]);

  const subtotal = useMemo(() => {
    return checkoutItems.reduce((total, item) => {
      return total + (parseFloat(String(item.price)) || 0) * (item.quantity || 1);
    }, 0);
  }, [checkoutItems]);

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Initialize user profile and saved addresses
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name || user.username || "");
      setEmail(user.email || "");
      setPhone(user.phone || user.mobile || "");
    }
  }, [user]);

  useEffect(() => {
    if (userId) {
      readUserAddresses(userId).then((list) => {
        setSavedAddresses(list);
        if (list.length > 0) {
          // Pre-fill with the first saved address if fields are empty
          const first = list[0];
          setStreetAddress((prev) => prev || first.street_address);
          setCity((prev) => prev || first.city);
          setDistrict((prev) => prev || first.district);
          setStateValue((prev) => prev || first.state || "Tamil Nadu");
          setZipCode((prev) => prev || first.zip_code);
          setCountry((prev) => prev || first.country || "India");
        }
      });
    }
  }, [userId]);

  const resolveImageUrl = (url: any) => {
    if (!url || typeof url !== "string") return null;
    if (url.startsWith("http") || url.startsWith("data:")) {
      return url;
    }
    const cleanPath = url.replace(/\\/g, "/");
    const finalPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    const base = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${base}${finalPath}`;
  };

  // Get current device GPS location and reverse geocode
  const handleGetLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please enable location permission in your settings to auto-detect your delivery address."
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = current.coords;

      // Reverse geocode with OpenStreetMap Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            "User-Agent": "VeetuRusiMobileApp/1.0",
          },
        }
      );
      const data = await res.json();

      if (data && data.address) {
        const a = data.address;
        setStreetAddress(a.road || a.suburb || a.neighbourhood || data.display_name?.split(",")[0] || "");
        setCity(a.city || a.town || a.village || a.suburb || "");
        setDistrict(a.state_district || a.county || a.city || "");
        setStateValue(a.state || "Tamil Nadu");
        setZipCode(a.postcode || "");
        setCountry(a.country || "India");
        Alert.alert("Location Detected", "Address fields have been populated!");
      } else {
        // Fallback to Expo reverse geocode
        const expoGeo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (expoGeo && expoGeo[0]) {
          const g = expoGeo[0];
          setStreetAddress([g.street, g.name].filter(Boolean).join(", "));
          setCity(g.city || g.subregion || "");
          setDistrict(g.district || g.region || "");
          setStateValue(g.region || "Tamil Nadu");
          setZipCode(g.postalCode || "");
          setCountry(g.country || "India");
          Alert.alert("Location Detected", "Address fields have been populated!");
        } else {
          Alert.alert("Notice", "Could not determine detailed address from GPS.");
        }
      }
    } catch (err) {
      console.error("Location fetch error:", err);
      Alert.alert("Location Error", "Unable to retrieve current location. Please enter manually.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Search Address via OpenStreetMap Nominatim
  const handleSearchAddress = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=5&countrycodes=in`,
        {
          headers: {
            "User-Agent": "VeetuRusiMobileApp/1.0",
          },
        }
      );
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Address search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: any) => {
    const addr = item.address || {};
    setStreetAddress(item.name || item.display_name?.split(",")[0] || item.display_name || "");
    setCity(addr.city || addr.town || addr.village || addr.suburb || "");
    setDistrict(addr.state_district || addr.county || "");
    setStateValue(addr.state || "Tamil Nadu");
    setZipCode(addr.postcode || "");
    setCountry(addr.country || "India");
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const fillAddress = (addr: UserAddress) => {
    setName(addr.customer_name || name);
    setEmail(addr.customer_email || email);
    setPhone(addr.customer_phone || phone);
    setStreetAddress(addr.street_address || "");
    setCity(addr.city || "");
    setDistrict(addr.district || "");
    setStateValue(addr.state || "Tamil Nadu");
    setZipCode(addr.zip_code || "");
    setCountry(addr.country || "India");
    setShowSavedAddressesModal(false);
  };

  const validateDelivery = () => {
    if (!user) return "Please login to continue.";
    if (!checkoutItems.length) return "Your food cart is empty.";

    if (!name.trim()) return "Please enter your name.";
    if (!phone.trim()) return "Please enter your phone number.";
    if (!streetAddress.trim()) return "Please enter your street address.";
    if (!city.trim()) return "Please enter your city.";
    if (!district.trim()) return "Please enter your district.";
    if (!stateValue.trim()) return "Please select your state.";
    if (!zipCode.trim()) return "Please enter your ZIP / Postal code.";

    if (!deliveryDate || !deliveryTime)
      return "Please choose a delivery date and time.";

    const selectedDateTime = new Date(`${deliveryDate}T${deliveryTime}`);
    const minDateTime = new Date();
    minDateTime.setHours(minDateTime.getHours() + 24);

    if (selectedDateTime < minDateTime) {
      return "Delivery must be scheduled at least 24 hours from now.";
    }

    return null;
  };

  const finalizeOrder = async (paymentId: string | null = null) => {
    try {
      setIsSubmitting(true);
      const res = await placeFoodOrder({
        name,
        email,
        phone,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        street_address: streetAddress,
        city,
        district,
        state: stateValue,
        country,
        zip_code: zipCode,
        delivery_date: deliveryDate,
        delivery_time: deliveryTime,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "Online Payment" ? "Paid" : "Pending",
        payment_id: paymentId,
        coupon_id: appliedCoupon?.id || null,
        coupon_code: appliedCoupon?.code || null,
        discount_amount: discountAmount,
        subtotal,
        total_amount: subtotal,
        final_total: grandTotal,
        isBuyNow: Boolean(buyNowItem?.product),
        items: checkoutItems,
      });

      // Save address for future use
      if (userId) {
        const nextAddresses = await upsertUserAddress(userId, {
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          street_address: streetAddress,
          city,
          district,
          state: stateValue,
          country,
          zip_code: zipCode,
        });
        setSavedAddresses(nextAddresses);
      }

      const newOrderId = res?.id || res?.insertId || res?.data?.id || null;

      Alert.alert(
        "Order Placed Successfully! 🎉",
        "Your home chef has received your order and will prepare it fresh!",
        [
          {
            text: "View Orders",
            onPress: () => {
              router.replace({
                pathname: "/(tabs)/orders",
                params: newOrderId ? { newOrderId: String(newOrderId) } : {},
              });
            },
          },
        ]
      );
    } catch (err: any) {
      console.error("Order submission error:", err);
      Alert.alert(
        "Order Failed",
        err?.message || "Unable to place your order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const error = validateDelivery();
    if (error) {
      Alert.alert("Incomplete Details", error);
      return;
    }

    if (paymentMethod === "Online Payment") {
      // Prompt online payment confirmation
      Alert.alert(
        "Online Payment",
        `Proceed to pay ₹${grandTotal.toFixed(0)} online?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Pay Now",
            onPress: () => {
              const dummyPaymentId = `pay_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 8)}`;
              finalizeOrder(dummyPaymentId);
            },
          },
        ]
      );
      return;
    }

    // Cash on Delivery
    Alert.alert(
      "Confirm Order",
      `Place Cash on Delivery order for ₹${grandTotal.toFixed(0)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => finalizeOrder(null),
        },
      ]
    );
  };

  const filteredStates = useMemo(() => {
    if (!stateSearchText.trim()) return INDIAN_STATES;
    return INDIAN_STATES.filter((s) =>
      s.toLowerCase().includes(stateSearchText.toLowerCase())
    );
  }, [stateSearchText]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F8F9FA]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-borderLight bg-white px-4 py-3.5 shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray"
          hitSlop={8}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-black text-text">Food Checkout</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}
        className="px-4 pt-3"
      >
        {/* Saved Addresses & Quick Fill */}
        <View className="mb-4 rounded-3xl border border-borderLight bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={22}
                color={colors.primary}
              />
              <Text className="text-base font-black text-text">Delivery Address</Text>
            </View>

            {savedAddresses.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowSavedAddressesModal(true)}
                className="rounded-full bg-primary/10 px-3 py-1.5"
              >
                <Text className="text-xs font-bold text-primary">Saved ({savedAddresses.length})</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Address */}
          <View className="mt-3">
            <View className="flex-row items-center rounded-2xl border border-border bg-[#F9FAFB] px-3 py-2.5">
              <Feather name="search" size={18} color={colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearchAddress}
                placeholder="Search area, landmark or street..."
                placeholderTextColor={colors.grayDark}
                className="ml-2 flex-1 text-sm text-text"
              />
              {isSearching && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="p-1"
                >
                  <Ionicons name="close-circle" size={18} color={colors.grayDark} />
                </TouchableOpacity>
              )}
            </View>

            {/* Address Search Dropdown Results */}
            {showSearchResults && searchResults.length > 0 && (
              <View className="mt-2 overflow-hidden rounded-2xl border border-borderLight bg-white shadow-md">
                {searchResults.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => selectSearchResult(item)}
                    className="border-b border-borderLight p-3 active:bg-primary/5"
                  >
                    <Text className="text-xs font-bold text-text" numberOfLines={1}>
                      {item.display_name?.split(",")[0] || item.name}
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-textSecondary" numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Use Current GPS Location Button */}
          <TouchableOpacity
            onPress={handleGetLocation}
            disabled={isLoadingLocation}
            className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl bg-[#FFF3E8] py-3 active:bg-primary/20"
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={18}
                color={colors.primary}
              />
            )}
            <Text className="text-xs font-black text-primary">
              {isLoadingLocation ? "Detecting GPS Location..." : "Use Current GPS Location"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact & Address Fields */}
        <View className="mb-4 rounded-3xl border border-borderLight bg-white p-4 shadow-sm">
          <Text className="mb-3 text-sm font-black text-text">Customer Information</Text>

          {/* Name & Phone */}
          <View className="mb-3">
            <Text className="mb-1 text-xs font-semibold text-textSecondary">Full Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Dhivakar Perumal"
              placeholderTextColor={colors.grayDark}
              className="rounded-2xl border border-border bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-text"
            />
          </View>

          <View className="mb-3 flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1 text-xs font-semibold text-textSecondary">Phone Number *</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="10-digit mobile"
                placeholderTextColor={colors.grayDark}
                className="rounded-2xl border border-border bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-text"
              />
            </View>

            <View className="flex-1">
              <Text className="mb-1 text-xs font-semibold text-textSecondary">Email (optional)</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="name@mail.com"
                placeholderTextColor={colors.grayDark}
                className="rounded-2xl border border-border bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-text"
              />
            </View>
          </View>

          {/* Street Address */}
          <View className="mb-3">
            <Text className="mb-1 text-xs font-semibold text-textSecondary">Street Address / Door No. *</Text>
            <TextInput
              value={streetAddress}
              onChangeText={setStreetAddress}
              placeholder="Door No, Building, Street, Area"
              placeholderTextColor={colors.grayDark}
              className="rounded-2xl border border-border bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-text"
            />
          </View>

          {/* City & District */}
          <View className="mb-3 flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1 text-xs font-semibold text-textSecondary">City / Town *</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Chennai"
                placeholderTextColor={colors.grayDark}
                className="rounded-2xl border border-border bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-text"
              />
            </View>

            <View className="flex-1">
              <Text className="mb-1 text-xs font-semibold text-textSecondary">District *</Text>
              <TextInput
                value={district}
                onChangeText={setDistrict}
                placeholder="e.g. Kanchipuram"
                placeholderTextColor={colors.grayDark}
                className="rounded-2xl border border-border bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-text"
              />
            </View>
          </View>

          {/* State & ZIP Code */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1 text-xs font-semibold text-textSecondary">State *</Text>
              <TouchableOpacity
                onPress={() => setShowStatePickerModal(true)}
                className="flex-row items-center justify-between rounded-2xl border border-border bg-[#F9FAFB] px-3.5 py-2.5"
              >
                <Text className="text-sm font-medium text-text" numberOfLines={1}>
                  {stateValue || "Select State"}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <Text className="mb-1 text-xs font-semibold text-textSecondary">ZIP / PIN Code *</Text>
              <TextInput
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="numeric"
                placeholder="6-digit PIN"
                placeholderTextColor={colors.grayDark}
                className="rounded-2xl border border-border bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-text"
              />
            </View>
          </View>
        </View>

        {/* Delivery Slot Selection */}
        <View className="mb-4 rounded-3xl border border-borderLight bg-white p-4 shadow-sm">
          <View className="mb-3 flex-row items-center gap-2">
            <MaterialCommunityIcons name="calendar-clock" size={22} color={colors.primary} />
            <Text className="text-base font-black text-text">Delivery Schedule</Text>
          </View>

          <Text className="mb-2 text-xs font-bold text-textSecondary">
            Select Delivery Date (Fresh homemade food requires advance booking):
          </Text>

          {/* Date Chips */}
          <View className="flex-row gap-2">
            {availableDates.map((item) => {
              const isSelected = deliveryDate === item.dateStr;
              return (
                <TouchableOpacity
                  key={item.dateStr}
                  onPress={() => setDeliveryDate(item.dateStr)}
                  className={`flex-1 items-center rounded-2xl border py-2.5 ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-borderLight bg-[#F9FAFB]"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? "text-white" : "text-text"
                    }`}
                  >
                    {item.label}
                  </Text>
                  <Text
                    className={`mt-0.5 text-[11px] ${
                      isSelected ? "text-white/80" : "text-textSecondary"
                    }`}
                  >
                    {item.subLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Slot Selector */}
          <Text className="mb-2 mt-4 text-xs font-bold text-textSecondary">
            Select Delivery Time Slot:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2"
          >
            {TIME_SLOTS.map((slot) => {
              const isSelected = deliveryTime === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => setDeliveryTime(slot)}
                  className={`mr-2 rounded-xl border px-3 py-2 ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-borderLight bg-[#F9FAFB]"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? "text-white" : "text-text"
                    }`}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View className="mt-3 flex-row items-center gap-1.5 rounded-xl bg-amber-50 p-2.5">
            <Ionicons name="information-circle" size={16} color="#D97706" />
            <Text className="flex-1 text-[11px] font-semibold text-amber-800">
              Orders must be scheduled at least 24 hours in advance to allow chefs to source fresh ingredients.
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View className="mb-4 rounded-3xl border border-borderLight bg-white p-4 shadow-sm">
          <View className="mb-3 flex-row items-center gap-2">
            <MaterialCommunityIcons name="credit-card-outline" size={22} color={colors.primary} />
            <Text className="text-base font-black text-text">Payment Method</Text>
          </View>

          <View className="gap-2.5">
            <TouchableOpacity
              onPress={() => setPaymentMethod("Cash on Delivery")}
              className={`flex-row items-center justify-between rounded-2xl border p-3.5 ${
                paymentMethod === "Cash on Delivery"
                  ? "border-primary bg-primary/5"
                  : "border-borderLight bg-white"
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <MaterialCommunityIcons name="cash-multiple" size={22} color="#059669" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-text">Cash on Delivery (COD)</Text>
                  <Text className="text-[11px] text-textSecondary">Pay with cash or UPI at delivery</Text>
                </View>
              </View>
              <Ionicons
                name={
                  paymentMethod === "Cash on Delivery"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={22}
                color={
                  paymentMethod === "Cash on Delivery"
                    ? colors.primary
                    : colors.grayDark
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod("Online Payment")}
              className={`flex-row items-center justify-between rounded-2xl border p-3.5 ${
                paymentMethod === "Online Payment"
                  ? "border-primary bg-primary/5"
                  : "border-borderLight bg-white"
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <MaterialCommunityIcons name="credit-card-fast" size={22} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-text">Online Payment</Text>
                  <Text className="text-[11px] text-textSecondary">Pay securely via UPI, Cards, Netbanking</Text>
                </View>
              </View>
              <Ionicons
                name={
                  paymentMethod === "Online Payment"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={22}
                color={
                  paymentMethod === "Online Payment"
                    ? colors.primary
                    : colors.grayDark
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary Card */}
        <View className="mb-4 rounded-3xl border border-borderLight bg-white p-4 shadow-sm">
          <Text className="mb-3 text-base font-black text-text">
            Order Summary ({checkoutItems.length} {checkoutItems.length === 1 ? "item" : "items"})
          </Text>

          {/* Items Preview */}
          <View className="mb-3 gap-2.5">
            {checkoutItems.map((item, idx) => {
              const image = resolveImageUrl(item.image);
              const itemTotal = (parseFloat(String(item.price)) || 0) * (item.quantity || 1);
              return (
                <View
                  key={item.id || idx}
                  className="flex-row items-center gap-3 rounded-2xl border border-borderLight bg-[#F9FAFB] p-2.5"
                >
                  <View className="h-14 w-14 overflow-hidden rounded-xl bg-gray">
                    {image ? (
                      <Image source={{ uri: image }} className="h-full w-full" resizeMode="cover" />
                    ) : (
                      <View className="h-full w-full items-center justify-center bg-grayLight">
                        <MaterialCommunityIcons name="food" size={24} color={colors.textSecondary} />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-text" numberOfLines={1}>
                      {item.name}
                    </Text>
                    {Boolean(item.chef_name) && (
                      <Text className="text-[11px] text-primary" numberOfLines={1}>
                        Chef: {item.chef_name}
                      </Text>
                    )}
                    <Text className="text-[11px] text-textSecondary">
                      Qty: {item.quantity} × ₹{parseFloat(String(item.price)).toFixed(0)}
                    </Text>
                  </View>
                  <Text className="text-xs font-black text-text">
                    ₹{itemTotal.toFixed(0)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Bill Breakdown */}
          <View className="border-t border-borderLight pt-3">
            <View className="mb-2 flex-row justify-between">
              <Text className="text-xs text-textSecondary">Subtotal</Text>
              <Text className="text-xs font-bold text-text">₹{subtotal.toFixed(0)}</Text>
            </View>

            <View className="mb-2 flex-row justify-between">
              <Text className="text-xs text-textSecondary">Shipping & Delivery</Text>
              <Text className="text-xs font-bold text-emerald-600">FREE</Text>
            </View>

            {discountAmount > 0 && (
              <View className="mb-2 flex-row justify-between">
                <Text className="text-xs font-semibold text-emerald-600">
                  Coupon Discount ({appliedCoupon?.code})
                </Text>
                <Text className="text-xs font-bold text-emerald-600">
                  -₹{discountAmount.toFixed(0)}
                </Text>
              </View>
            )}

            <View className="my-2 border-t border-borderLight" />

            <View className="flex-row items-baseline justify-between">
              <Text className="text-sm font-black text-text">Total Payable</Text>
              <Text className="text-xl font-black text-primary">₹{grandTotal.toFixed(0)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Place Order Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-borderLight bg-white px-5 pt-3 shadow-2xl"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[11px] font-semibold text-textSecondary">Total Amount</Text>
            <Text className="text-xl font-black text-primary">₹{grandTotal.toFixed(0)}</Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className="flex-row items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 shadow-md shadow-primary/30 active:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.white} />
            )}
            <Text className="text-base font-black text-white">
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Saved Addresses Modal */}
      <Modal
        visible={showSavedAddressesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSavedAddressesModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[80%] rounded-t-[32px] bg-white p-5 shadow-2xl">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-black text-text">Saved Addresses</Text>
              <TouchableOpacity
                onPress={() => setShowSavedAddressesModal(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-gray"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[400px]">
              {savedAddresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  onPress={() => fillAddress(addr)}
                  className="mb-3 rounded-2xl border border-borderLight bg-[#F9FAFB] p-3.5 active:bg-primary/5"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-black text-text">{addr.customer_name}</Text>
                    <Text className="text-xs font-semibold text-textSecondary">{addr.customer_phone}</Text>
                  </View>
                  <Text className="mt-1 text-xs text-textSecondary">
                    {addr.street_address}, {addr.city}, {addr.district}, {addr.state} - {addr.zip_code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* State Picker Modal */}
      <Modal
        visible={showStatePickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatePickerModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[80%] rounded-t-[32px] bg-white p-5 shadow-2xl">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-black text-text">Select State / UT</Text>
              <TouchableOpacity
                onPress={() => setShowStatePickerModal(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-gray"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View className="mb-3 flex-row items-center rounded-2xl border border-border bg-[#F9FAFB] px-3 py-2">
              <Feather name="search" size={18} color={colors.textSecondary} />
              <TextInput
                value={stateSearchText}
                onChangeText={setStateSearchText}
                placeholder="Search state..."
                placeholderTextColor={colors.grayDark}
                className="ml-2 flex-1 text-sm text-text"
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[350px]">
              {filteredStates.map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => {
                    setStateValue(st);
                    setShowStatePickerModal(false);
                  }}
                  className={`border-b border-borderLight py-3 ${
                    stateValue === st ? "bg-primary/5" : ""
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      stateValue === st ? "font-black text-primary" : "text-text"
                    }`}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
