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

function textValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

export function normalizeUserAddress(
  userId: string | number,
  address: Partial<UserAddress>,
  index = 0,
): UserAddress {
  return {
    id: textValue(address.id) || `stored_${userId}_${index}`,
    user_id: textValue(address.user_id) || String(userId),
    customer_name: textValue(address.customer_name),
    customer_email: textValue(address.customer_email),
    customer_phone: textValue(address.customer_phone),
    street_address: textValue(address.street_address),
    city: textValue(address.city),
    district: textValue(address.district),
    state: textValue(address.state),
    country: textValue(address.country) || "India",
    zip_code: textValue(address.zip_code),
    created_at: textValue(address.created_at) || undefined,
  };
}

function addressRows(response: any): UserAddress[] {
  const data = Array.isArray(response?.data)
    ? response.data
    : response?.data?.data;
  return Array.isArray(data)
    ? data.map((address, index) =>
        normalizeUserAddress(address.user_id || "", address, index),
      )
    : [];
}

export async function readRemoteUserAddress(
  userId: string | number,
): Promise<UserAddress | null> {
  if (!userId) return null;
  try {
    const addresses = await readRemoteUserAddresses(userId);
    return addresses[0] || null;
  } catch (err) {
    console.warn("Failed to read remote user address:", err);
    return null;
  }
}

export async function readRemoteUserAddresses(
  userId: string | number,
): Promise<UserAddress[]> {
  if (!userId) return [];
  try {
    const response = await api.get("/addresses");
    return addressRows(response).filter(
      (address) => String(address.user_id) === String(userId),
    );
  } catch (err) {
    const error = err as {
      status?: number | string;
      response?: { status?: number | string };
      message?: string;
    };
    const status = error.status || error.response?.status;
    console.warn(
      `Failed to read remote user addresses${status ? ` (HTTP ${status})` : ""}:`,
      error.message || err,
    );
    throw err;
  }
}

export async function saveRemoteUserAddress(
  userId: string | number,
  address: Partial<UserAddress>,
): Promise<UserAddress | null> {
  if (!userId) return null;
  try {
    const payload = { ...address, user_id: String(userId) };
    const response = address.id
      ? await api.put(`/addresses/${address.id}`, payload)
      : await api.post("/addresses", payload);
    const rows = addressRows(response).filter(
      (item) => String(item.user_id) === String(userId),
    );
    return rows[0] || normalizeUserAddress(userId, payload);
  } catch (err) {
    console.warn("Failed to save remote user address:", err);
    throw err;
  }
}

export async function removeRemoteUserAddress(
  userId: string | number,
  addressId: string,
) {
  if (!userId || !addressId) return;
  await api.delete(`/addresses/${addressId}`);
}

export async function readUserAddresses(userId: string | number): Promise<UserAddress[]> {
  if (!userId) return [];
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((address) => address && typeof address === "object")
          .map((address, index) => normalizeUserAddress(userId, address, index))
      : [];
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
      const newAddress = normalizeUserAddress(userId, {
        ...address,
        id:
          address.id ||
          `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        created_at: new Date().toISOString(),
      });
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
    const normalizedAddresses = addresses
      .filter((address) => address && typeof address === "object")
      .map((address, index) => normalizeUserAddress(userId, address, index));
    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify(normalizedAddresses)
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
