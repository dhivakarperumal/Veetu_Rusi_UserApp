import api from "@/app/api";
import { colors } from "@/config/colors";
import { useAuth } from "@/context/AuthContext";
import {
  readUserAddresses,
  removeUserAddress,
  saveUserAddresses,
  upsertUserAddress,
  UserAddress,
} from "@/utils/addressStorage";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
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

export default function Address() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [localUser, setLocalUser] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // State Picker Modal
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [stateSearchText, setStateSearchText] = useState("");

  const effectiveUser = user || localUser;
  const userId = effectiveUser?.user_id || effectiveUser?.id;

  // Form State
  const [form, setForm] = useState<Partial<UserAddress>>({
    customer_name: effectiveUser?.name || effectiveUser?.username || "",
    customer_email: effectiveUser?.email || "",
    customer_phone: effectiveUser?.phone || effectiveUser?.mobile || "",
    street_address: "",
    city: "",
    district: "",
    state: "Tamil Nadu",
    country: "India",
    zip_code: "",
  });

  // Sync user profile from AsyncStorage if context is still loading
  useEffect(() => {
    const checkLocalUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("userProfile");
        if (stored) {
          const parsed = JSON.parse(stored);
          const actual = parsed.user || parsed;
          setLocalUser(actual);
          setForm((prev) => ({
            ...prev,
            customer_name: prev.customer_name || actual.name || actual.username || "",
            customer_email: prev.customer_email || actual.email || "",
            customer_phone: prev.customer_phone || actual.phone || actual.mobile || "",
          }));
        }
      } catch (err) {
        console.warn("Error loading stored user in addresses:", err);
      }
    };
    checkLocalUser();
  }, []);

  // Fetch addresses: read local storage and merge with order addresses from backend
  const fetchAddresses = React.useCallback(async () => {
    if (!userId) {
      setAddresses([]);
      return;
    }

    try {
      setLoading(true);
      const storageAddresses = await readUserAddresses(userId);

      // Fetch user orders from both /orders and /user-food-orders/my-orders
      let userOrders: any[] = [];
      try {
        const res = await api.get("/orders");
        const raw = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const mapped = raw
          .filter((order: any) => String(order.user_id) === String(userId))
          .map((order: any) => ({
            id: String(order.id || `order_${Date.now()}`),
            user_id: String(order.user_id),
            customer_name: order.customer_name || order.ordered_by_name || "",
            customer_email: order.customer_email || order.ordered_by_email || "",
            customer_phone: order.customer_phone || order.ordered_by_phone || "",
            street_address: order.street_address || "",
            city: order.city || "",
            district: order.district || "",
            state: order.state || "",
            country: order.country || "India",
            zip_code: order.zip_code || "",
          }));
        userOrders.push(...mapped);
      } catch {
        // Fallback to food orders
        try {
          const res2 = await api.get("/user-food-orders/my-orders");
          const raw2 = Array.isArray(res2.data) ? res2.data : res2.data?.data || [];
          const mapped2 = raw2
            .filter((order: any) => String(order.user_id) === String(userId))
            .map((order: any) => ({
              id: String(order.id || `order_${Date.now()}`),
              user_id: String(order.user_id),
              customer_name: order.customer_name || order.ordered_by_name || "",
              customer_email: order.customer_email || order.ordered_by_email || "",
              customer_phone: order.customer_phone || order.ordered_by_phone || "",
              street_address: order.street_address || "",
              city: order.city || "",
              district: order.district || "",
              state: order.state || "",
              country: order.country || "India",
              zip_code: order.zip_code || "",
            }));
          userOrders.push(...mapped2);
        } catch {}
      }

      // Filter valid addresses (must have street or city)
      const validOrders = userOrders.filter(
        (a) => Boolean(a.street_address?.trim()) || Boolean(a.city?.trim())
      );

      // Merge and deduplicate by comparing key fields
      const mergedAddresses = [...storageAddresses, ...validOrders].filter(
        (address, index, array) => {
          const match = array.findIndex((item) => {
            const first = `${address.customer_name || ""}|${address.customer_email || ""}|${address.customer_phone || ""}|${address.street_address || ""}|${address.city || ""}|${address.district || ""}|${address.state || ""}|${address.country || ""}|${address.zip_code || ""}`.toLowerCase();
            const second = `${item.customer_name || ""}|${item.customer_email || ""}|${item.customer_phone || ""}|${item.street_address || ""}|${item.city || ""}|${item.district || ""}|${item.state || ""}|${item.country || ""}|${item.zip_code || ""}`.toLowerCase();
            return first === second;
          });
          return match === index;
        }
      );

      await saveUserAddresses(userId, mergedAddresses);
      setAddresses(mergedAddresses);
    } catch (error) {
      console.error("fetchAddresses error:", error);
      const fallback = await readUserAddresses(userId);
      setAddresses(fallback);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAddresses();
    }
  }, [userId, fetchAddresses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAddresses();
    setRefreshing(false);
  };

  const handleChange = (field: keyof UserAddress, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // GPS Auto-detect Address
  const handleDetectGPS = async () => {
    try {
      setIsDetectingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is needed to auto-detect your delivery address."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      // Reverse geocoding via OpenStreetMap Nominatim
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          {
            headers: {
              "User-Agent": "VeetuRusiApp/1.0",
              "Accept-Language": "en",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          const addr = data.address || {};
          const street =
            addr.road ||
            addr.residential ||
            addr.suburb ||
            addr.neighbourhood ||
            "";
          const cityVal =
            addr.city || addr.town || addr.village || addr.suburb || "";
          const districtVal = addr.state_district || addr.county || cityVal;
          const stateVal = addr.state || "Tamil Nadu";
          const postcode = addr.postcode || "";

          setForm((prev) => ({
            ...prev,
            street_address: street || prev.street_address,
            city: cityVal || prev.city,
            district: districtVal || prev.district,
            state: stateVal || prev.state,
            zip_code: postcode || prev.zip_code,
          }));

          Alert.alert(
            "Location Detected! 📍",
            `Address filled near ${cityVal || "your area"}.`
          );
          return;
        }
      } catch {
        // Fallback to Expo Reverse Geocode
        const geocoded = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geocoded.length > 0) {
          const item = geocoded[0];
          setForm((prev) => ({
            ...prev,
            street_address: item.street || item.name || prev.street_address,
            city: item.city || item.subregion || prev.city,
            district: item.district || item.subregion || prev.district,
            state: item.region || prev.state,
            zip_code: item.postalCode || prev.zip_code,
          }));
          Alert.alert("Location Detected! 📍", "Address populated successfully.");
          return;
        }
      }
    } catch (e) {
      console.warn("GPS detection error:", e);
      Alert.alert(
        "Location Error",
        "Could not detect location automatically. Please enter your address manually."
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const validateForm = () => {
    if (!form.customer_name?.trim()) {
      Alert.alert("Missing Name", "Please enter full recipient name.");
      return false;
    }
    if (!form.customer_phone?.trim()) {
      Alert.alert("Missing Phone", "Please enter a contact phone number.");
      return false;
    }
    if (!form.street_address?.trim()) {
      Alert.alert("Missing Address", "Please enter your street address / house no.");
      return false;
    }
    if (!form.city?.trim()) {
      Alert.alert("Missing City", "Please enter your city.");
      return false;
    }
    if (!form.zip_code?.trim()) {
      Alert.alert("Missing Zip Code", "Please enter your 6-digit postal code.");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      customer_name: effectiveUser?.name || effectiveUser?.username || "",
      customer_email: effectiveUser?.email || "",
      customer_phone: effectiveUser?.phone || effectiveUser?.mobile || "",
      street_address: "",
      city: "",
      district: "",
      state: "Tamil Nadu",
      country: "India",
      zip_code: "",
    });
  };

  // Add Address
  const addAddress = async () => {
    if (!validateForm()) return;

    if (!userId) {
      Alert.alert("Login Required", "Please login to save addresses.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }

    try {
      const nextAddresses = await upsertUserAddress(userId, {
        ...form,
        id: Date.now().toString(),
        user_id: String(userId),
      });
      setAddresses(nextAddresses);
      Alert.alert("Success 🎉", "Address saved successfully!");
      resetForm();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save address.");
    }
  };

  // Edit Address
  const editAddress = (address: UserAddress) => {
    setEditingId(address.id);
    setForm({ ...address });
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // Update Address
  const updateAddress = async () => {
    if (!validateForm()) return;

    if (!userId || !editingId) return;

    try {
      const updatedAddresses = addresses.map((address) =>
        String(address.id) === String(editingId)
          ? ({
              ...address,
              ...form,
              id: editingId,
              user_id: String(userId),
            } as UserAddress)
          : address
      );

      setAddresses(updatedAddresses);
      await saveUserAddresses(userId, updatedAddresses);
      Alert.alert("Success 🎉", "Address updated successfully!");
      resetForm();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update address.");
    }
  };

  // Delete Address
  const deleteAddress = (id: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to remove this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!userId) return;
            try {
              const nextAddresses = await removeUserAddress(userId, id);
              setAddresses(nextAddresses);
              if (editingId === id) {
                resetForm();
              }
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Could not delete address.");
            }
          },
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}
    >
      {/* Top App Header */}
      <View className="flex-row items-center justify-between border-b border-borderLight bg-white px-4 py-3">
        <View className="flex-row items-center">
          <Pressable
            accessibilityLabel="Go back"
            className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-gray active:bg-grayDark/20"
            hitSlop={8}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.text}
            />
          </Pressable>
          <Text className="text-[20px] font-extrabold text-text">
            My Addresses
          </Text>
        </View>

        <TouchableOpacity
          className="flex-row items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 active:bg-primary/20"
          onPress={() => {
            resetForm();
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          <MaterialCommunityIcons
            name="plus"
            size={16}
            color={colors.primary}
          />
          <Text className="text-[12px] font-bold text-primary">New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Unauthenticated Banner */}
        {!userId && (
          <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-amber-50 p-4 border border-amber-200">
            <View className="flex-1 mr-3">
              <Text className="text-[14px] font-bold text-amber-900">
                You are not logged in
              </Text>
              <Text className="mt-0.5 text-[12px] text-amber-700">
                Log in to save and sync your delivery addresses across all orders.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              className="rounded-xl bg-amber-600 px-4 py-2"
            >
              <Text className="text-[12px] font-bold text-white">Login</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SECTION 1: ADDRESS LIST */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[16px] font-bold text-text">
              Saved Delivery Addresses ({addresses.length})
            </Text>
            {loading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {addresses.length === 0 && !loading ? (
            <View className="items-center justify-center rounded-2xl border border-dashed border-borderLight bg-white py-10 px-6 text-center">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={32}
                  color={colors.primary}
                />
              </View>
              <Text className="text-[16px] font-bold text-text">
                No addresses saved yet
              </Text>
              <Text className="mt-1 text-center text-[12px] leading-relaxed text-textSecondary">
                Fill in the form below or auto-detect using GPS to save your delivery
                location for future food orders!
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {addresses.map((address, index) => {
                const isCurrentlyEditing = editingId === address.id;
                return (
                  <View
                    key={address.id || index}
                    className={`rounded-2xl border bg-white p-4 shadow-sm shadow-black/5 ${
                      isCurrentlyEditing
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-borderLight"
                    }`}
                  >
                    {/* Top Row: Name and Type Tag */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <MaterialCommunityIcons
                            name="map-marker-radius"
                            size={18}
                            color={colors.primary}
                          />
                        </View>
                        <Text
                          className="text-[15px] font-bold text-text"
                          numberOfLines={1}
                        >
                          {address.customer_name || "Delivery Address"}
                        </Text>
                      </View>

                      {index === 0 && (
                        <View className="rounded-full bg-emerald-50 px-2.5 py-0.5 border border-emerald-200">
                          <Text className="text-[10px] font-black text-emerald-700">
                            DEFAULT
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Address Lines */}
                    <View className="mt-3 pl-1">
                      <Text className="text-[13px] font-semibold text-text leading-snug">
                        {address.street_address}
                      </Text>
                      <Text className="mt-0.5 text-[12px] text-textSecondary">
                        {[
                          address.city,
                          address.district,
                          address.state,
                          address.zip_code,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </Text>
                      <Text className="mt-0.5 text-[11px] font-medium text-textSecondary">
                        Country: {address.country || "India"}
                      </Text>

                      {/* Contact row */}
                      <View className="mt-2.5 flex-row flex-wrap items-center gap-3 border-t border-borderLight/60 pt-2">
                        {Boolean(address.customer_phone) && (
                          <View className="flex-row items-center gap-1">
                            <Feather
                              name="phone"
                              size={12}
                              color={colors.textSecondary}
                            />
                            <Text className="text-[12px] font-medium text-textSecondary">
                              {address.customer_phone}
                            </Text>
                          </View>
                        )}
                        {Boolean(address.customer_email) && (
                          <View className="flex-row items-center gap-1">
                            <Feather
                              name="mail"
                              size={12}
                              color={colors.textSecondary}
                            />
                            <Text
                              className="text-[12px] font-medium text-textSecondary"
                              numberOfLines={1}
                            >
                              {address.customer_email}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Action Buttons: Edit & Delete */}
                    <View className="mt-3.5 flex-row items-center justify-end gap-2 border-t border-borderLight pt-3">
                      <TouchableOpacity
                        onPress={() => editAddress(address)}
                        className="flex-row items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 border border-emerald-200 active:bg-emerald-100"
                      >
                        <Feather name="edit-2" size={13} color="#059669" />
                        <Text className="text-[12px] font-bold text-emerald-700">
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => deleteAddress(address.id)}
                        className="flex-row items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 border border-red-200 active:bg-red-100"
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={15}
                          color={colors.error}
                        />
                        <Text className="text-[12px] font-bold text-error">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* SECTION 2: ADDRESS FORM (ADD / EDIT) */}
        <View className="rounded-3xl border border-borderLight bg-white p-5 shadow-md shadow-black/5">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[17px] font-black text-text">
                {editingId ? "Edit Address ✏️" : "Add New Address 📍"}
              </Text>
              <Text className="mt-0.5 text-[11px] font-medium text-textSecondary">
                {editingId
                  ? "Update your delivery location details"
                  : "Save a new delivery address for quick checkout"}
              </Text>
            </View>

            {editingId && (
              <TouchableOpacity
                onPress={resetForm}
                className="rounded-full bg-gray px-3 py-1 active:bg-grayDark/20"
              >
                <Text className="text-[11px] font-bold text-textSecondary">
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* GPS Auto Detect Button */}
          <TouchableOpacity
            onPress={handleDetectGPS}
            disabled={isDetectingLocation}
            className="mb-4 flex-row items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/5 py-3 active:bg-primary/10"
          >
            {isDetectingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={18}
                color={colors.primary}
              />
            )}
            <Text className="text-[13px] font-black text-primary">
              {isDetectingLocation
                ? "Detecting Coordinates..."
                : "Auto-fill with Current GPS Location"}
            </Text>
          </TouchableOpacity>

          <View className="gap-3">
            {/* Customer Name */}
            <View>
              <Text className="mb-1 text-[12px] font-bold text-textSecondary">
                Recipient Full Name *
              </Text>
              <TextInput
                value={form.customer_name}
                onChangeText={(val) => handleChange("customer_name", val)}
                placeholder="e.g. John Doe"
                placeholderTextColor={colors.textSecondary}
                className="rounded-xl border border-borderLight bg-gray/30 px-3.5 py-2.5 text-[14px] text-text"
              />
            </View>

            {/* Customer Phone & Email Grid */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="mb-1 text-[12px] font-bold text-textSecondary">
                  Phone Number *
                </Text>
                <TextInput
                  value={form.customer_phone}
                  onChangeText={(val) => handleChange("customer_phone", val)}
                  placeholder="e.g. 9876543210"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textSecondary}
                  className="rounded-xl border border-borderLight bg-gray/30 px-3.5 py-2.5 text-[14px] text-text"
                />
              </View>

              <View className="flex-1">
                <Text className="mb-1 text-[12px] font-bold text-textSecondary">
                  Email Address
                </Text>
                <TextInput
                  value={form.customer_email}
                  onChangeText={(val) => handleChange("customer_email", val)}
                  placeholder="name@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textSecondary}
                  className="rounded-xl border border-borderLight bg-gray/30 px-3.5 py-2.5 text-[14px] text-text"
                />
              </View>
            </View>

            {/* Street Address */}
            <View>
              <Text className="mb-1 text-[12px] font-bold text-textSecondary">
                House No, Building, Street Address *
              </Text>
              <TextInput
                value={form.street_address}
                onChangeText={(val) => handleChange("street_address", val)}
                placeholder="Flat / House No, Street name, Landmark"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={2}
                style={{ minHeight: 60, textAlignVertical: "top" }}
                className="rounded-xl border border-borderLight bg-gray/30 px-3.5 py-2 text-[14px] text-text"
              />
            </View>

            {/* City & District Grid */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="mb-1 text-[12px] font-bold text-textSecondary">
                  City / Town *
                </Text>
                <TextInput
                  value={form.city}
                  onChangeText={(val) => handleChange("city", val)}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  className="rounded-xl border border-borderLight bg-gray/30 px-3.5 py-2.5 text-[14px] text-text"
                />
              </View>

              <View className="flex-1">
                <Text className="mb-1 text-[12px] font-bold text-textSecondary">
                  District
                </Text>
                <TextInput
                  value={form.district}
                  onChangeText={(val) => handleChange("district", val)}
                  placeholder="District"
                  placeholderTextColor={colors.textSecondary}
                  className="rounded-xl border border-borderLight bg-gray/30 px-3.5 py-2.5 text-[14px] text-text"
                />
              </View>
            </View>

            {/* State & Zip Code */}
            <View className="flex-row gap-2">
              {/* State Dropdown Trigger */}
              <View className="flex-1">
                <Text className="mb-1 text-[12px] font-bold text-textSecondary">
                  State *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowStatePicker(true)}
                  className="flex-row items-center justify-between rounded-xl border border-borderLight bg-gray/30 px-3.5 py-2.5"
                >
                  <Text
                    className="text-[13px] font-semibold text-text"
                    numberOfLines={1}
                  >
                    {form.state || "Select State"}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Zip Code */}
              <View className="flex-1">
                <Text className="mb-1 text-[12px] font-bold text-textSecondary">
                  ZIP / PIN Code *
                </Text>
                <TextInput
                  value={form.zip_code}
                  onChangeText={(val) => handleChange("zip_code", val)}
                  placeholder="600001"
                  keyboardType="numeric"
                  maxLength={6}
                  placeholderTextColor={colors.textSecondary}
                  className="rounded-xl border border-borderLight bg-gray/30 px-3.5 py-2.5 text-[14px] text-text"
                />
              </View>
            </View>

            {/* Country */}
            <View>
              <Text className="mb-1 text-[12px] font-bold text-textSecondary">
                Country
              </Text>
              <TextInput
                value={form.country}
                onChangeText={(val) => handleChange("country", val)}
                placeholder="India"
                placeholderTextColor={colors.textSecondary}
                className="rounded-xl border border-borderLight bg-gray/30 px-3.5 py-2.5 text-[14px] text-text"
              />
            </View>

            {/* Submit Action Button */}
            <TouchableOpacity
              onPress={editingId ? updateAddress : addAddress}
              className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 shadow-md shadow-primary/30 active:opacity-90"
            >
              <MaterialCommunityIcons
                name={editingId ? "content-save-edit" : "plus-circle"}
                size={18}
                color={colors.white}
              />
              <Text className="text-base font-black text-white">
                {editingId ? "Update Address" : "Save Address"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* STATE PICKER MODAL */}
      <Modal
        visible={showStatePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStatePicker(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <Pressable
            className="flex-1"
            onPress={() => setShowStatePicker(false)}
          />
          <View className="max-h-[80%] rounded-t-[32px] bg-white p-5 shadow-2xl">
            {/* Grab Handle */}
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-grayDark/30" />

            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-black text-text">
                Select State
              </Text>
              <TouchableOpacity
                onPress={() => setShowStatePicker(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-gray"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Search Input for States */}
            <View className="mb-3 flex-row items-center rounded-xl bg-gray px-3 py-2">
              <Ionicons
                name="search"
                size={16}
                color={colors.textSecondary}
              />
              <TextInput
                value={stateSearchText}
                onChangeText={setStateSearchText}
                placeholder="Search state..."
                placeholderTextColor={colors.textSecondary}
                className="ml-2 flex-1 text-[13px] text-text"
              />
              {Boolean(stateSearchText) && (
                <TouchableOpacity onPress={() => setStateSearchText("")}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[360px]">
              {filteredStates.map((st) => {
                const isSelected = form.state === st;
                return (
                  <TouchableOpacity
                    key={st}
                    onPress={() => {
                      handleChange("state", st);
                      setShowStatePicker(false);
                      setStateSearchText("");
                    }}
                    className={`flex-row items-center justify-between border-b border-borderLight/70 py-3.5 px-2 ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    <Text
                      className={`text-[14px] ${
                        isSelected
                          ? "font-bold text-primary"
                          : "font-medium text-text"
                      }`}
                    >
                      {st}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check-bold"
                        size={16}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
