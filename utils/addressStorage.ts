import api from "@/app/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserAddress {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  street_address: string;
  city: string;
  district: string;
  state: string;
  country: string;
  zip_code: string;
  created_at?: string;
}

const STORAGE_PREFIX = "@veetu_rusi_user_addresses_";

function getProfileData(response: any) {
  return response?.data?.user || response?.data?.data || response?.data || {};
}

function profileToAddress(userId: string | number, profile: any): UserAddress | null {
  const streetAddress = profile?.street_address || profile?.address || "";
  const city = profile?.city || profile?.area || "";
  const hasAddress = streetAddress || city || profile?.district || profile?.pincode || profile?.zip_code;
  if (!hasAddress) return null;

  return {
    id: String(profile?.address_id || `profile_${userId}`),
    user_id: String(userId),
    customer_name: profile?.customer_name || profile?.name || profile?.username || "",
    customer_email: profile?.customer_email || profile?.email || "",
    customer_phone: profile?.customer_phone || profile?.phone || profile?.mobile || "",
    street_address: streetAddress,
    city,
    district: profile?.district || "",
    state: profile?.state || "",
    country: profile?.country || "India",
    zip_code: profile?.zip_code || profile?.pincode || "",
    created_at: profile?.address_created_at || profile?.updated_at,
  };
}

export async function readRemoteUserAddress(
  userId: string | number,
): Promise<UserAddress | null> {
  if (!userId) return null;
  try {
    const profile = getProfileData(await api.get("/auth/profile"));
    return profileToAddress(userId, profile);
  } catch (err) {
    console.warn("Failed to read remote user address:", err);
    return null;
  }
}

export async function saveRemoteUserAddress(
  userId: string | number,
  address: Partial<UserAddress>,
): Promise<UserAddress | null> {
  if (!userId) return null;
  try {
    const profileResponse = await api.get("/auth/profile");
    const profile = getProfileData(profileResponse);
    const customerName = address.customer_name || profile.name || profile.username || "";
    const customerEmail = address.customer_email || profile.email || "";
    const customerPhone = address.customer_phone || profile.phone || profile.mobile || "";
    const city = address.city || "";
    const streetAddress = address.street_address || "";
    const zipCode = address.zip_code || "";

    const response = await api.put("/auth/profile", {
      ...profile,
      name: customerName,
      username: profile.username || customerName,
      email: customerEmail,
      phone: customerPhone,
      mobile: customerPhone,
      address: streetAddress,
      street_address: streetAddress,
      area: city,
      city,
      district: address.district || "",
      state: address.state || "",
      country: address.country || "India",
      pincode: zipCode,
      zip_code: zipCode,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
    });
    return profileToAddress(userId, getProfileData(response)) || {
      id: String(address.id || `profile_${userId}`),
      user_id: String(userId),
      customer_name: address.customer_name || "",
      customer_email: address.customer_email || "",
      customer_phone: address.customer_phone || "",
      street_address: address.street_address || "",
      city: address.city || "",
      district: address.district || "",
      state: address.state || "",
      country: address.country || "India",
      zip_code: address.zip_code || "",
    };
  } catch (err) {
    console.warn("Failed to save remote user address:", err);
    return null;
  }
}

export async function readUserAddresses(userId: string | number): Promise<UserAddress[]> {
  if (!userId) return [];
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read user addresses:", err);
    return [];
  }
}

export async function upsertUserAddress(
  userId: string | number,
  address: Partial<UserAddress>
): Promise<UserAddress[]> {
  if (!userId) return [];
  try {
    const current = await readUserAddresses(userId);
    const existingIndex = address.id
      ? current.findIndex((a) => a.id === address.id)
      : current.findIndex(
          (a) =>
            a.street_address?.trim().toLowerCase() ===
              address.street_address?.trim().toLowerCase() &&
            a.zip_code?.trim() === address.zip_code?.trim()
        );

    let updated: UserAddress[];

    if (existingIndex > -1) {
      updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...address,
        user_id: String(userId),
      } as UserAddress;
    } else {
      const newAddress: UserAddress = {
        id: address.id || `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user_id: String(userId),
        customer_name: address.customer_name || "",
        customer_email: address.customer_email || "",
        customer_phone: address.customer_phone || "",
        street_address: address.street_address || "",
        city: address.city || "",
        district: address.district || "",
        state: address.state || "",
        country: address.country || "India",
        zip_code: address.zip_code || "",
        created_at: new Date().toISOString(),
      };
      updated = [newAddress, ...current];
    }

    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify(updated)
    );
    return updated;
  } catch (err) {
    console.error("Failed to upsert user address:", err);
    return [];
  }
}

export async function saveUserAddresses(
  userId: string | number,
  addresses: UserAddress[]
): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify(addresses)
    );
  } catch (err) {
    console.error("Failed to save user addresses:", err);
  }
}

export async function deleteUserAddress(
  userId: string | number,
  addressId: string
): Promise<UserAddress[]> {
  if (!userId || !addressId) return [];
  try {
    const current = await readUserAddresses(userId);
    const filtered = current.filter((a) => a.id !== addressId);
    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify(filtered)
    );
    return filtered;
  } catch (err) {
    console.error("Failed to delete user address:", err);
    return [];
  }
}

export const removeUserAddress = deleteUserAddress;
