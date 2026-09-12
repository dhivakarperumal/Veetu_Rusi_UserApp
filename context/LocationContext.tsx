import api from "@/app/api";
import { customAlert as Alert } from "@/components/CustomAlertHost";
import { AuthContext } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

export const LOCATION_STORAGE_KEY = "@veetu_rusi_user_location";

export interface UserLocation {
  latitude: number;
  longitude: number;
  locationName?: string;
  area?: string;
  district?: string;
  city?: string;
  pincode?: string;
}

interface LocationContextType {
  location: UserLocation | null;
  hasLocation: boolean;
  isLoadingLocation: boolean;
  fetchingLocation: boolean;
  locationError: string | null;
  fetchLocation: (
    onSuccess?: (loc: UserLocation) => void,
    silent?: boolean,
  ) => Promise<UserLocation | null>;
  setLocation: (loc: UserLocation | null) => Promise<void>;
  calculateDistance: (
    lat1: any,
    lon1: any,
    lat2: any,
    lon2: any,
  ) => string | null;
  isProductDeliverable: (
    product: Record<string, any>,
    targetLocation?: UserLocation | null,
  ) => boolean;
}

export const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<UserLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const updateUser = authContext?.updateUser;

  // Load saved location from AsyncStorage on startup
  useEffect(() => {
    const loadLocation = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (
            parsed &&
            typeof parsed.latitude === "number" &&
            typeof parsed.longitude === "number"
          ) {
            setLocationState(parsed);
            setIsLoadingLocation(false);
            return;
          }
        }

        // Fallback: Check if user profile has coordinates
        if (user?.latitude && user?.longitude) {
          const profileLoc: UserLocation = {
            latitude: Number(user.latitude),
            longitude: Number(user.longitude),
            locationName: user.location_name || "",
            area: user.area || "",
            district: user.district || "",
            city: user.city || user.area || "",
            pincode: user.pincode || "",
          };
          setLocationState(profileLoc);
          await AsyncStorage.setItem(
            LOCATION_STORAGE_KEY,
            JSON.stringify(profileLoc),
          );
        }
      } catch (err) {
        console.error("Error loading stored location:", err);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    loadLocation();
  }, [user?.latitude, user?.longitude]);

  // Set location and persist
  const setLocation = useCallback(async (loc: UserLocation | null) => {
    setLocationState(loc);
    try {
      if (loc) {
        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
      } else {
        await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save location to storage:", e);
    }
  }, []);

  // Distance calculation in km
  const calculateDistance = useCallback(
    (lat1: any, lon1: any, lat2: any, lon2: any): string | null => {
      const nLat1 = parseFloat(String(lat1 ?? ""));
      const nLon1 = parseFloat(String(lon1 ?? ""));
      const nLat2 = parseFloat(String(lat2 ?? ""));
      const nLon2 = parseFloat(String(lon2 ?? ""));

      if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
        return null;
      }

      const R = 6371; // Earth radius in km
      const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
      const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((nLat1 * Math.PI) / 180) *
          Math.cos((nLat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return (R * c).toFixed(2);
    },
    [],
  );

  // Parse radius from string/number format (e.g. "5 KM", "10", 15)
  const parseRadius = (val: unknown, fallback = 15): number => {
    if (typeof val === "number" && !isNaN(val) && val > 0) return val;
    if (!val) return fallback;
    const match = String(val).match(/[\d.]+/);
    if (match) {
      const num = parseFloat(match[0]);
      if (!isNaN(num) && num > 0) return num;
    }
    return fallback;
  };

  // Deliverability check
  const isProductDeliverable = useCallback(
    (
      product: Record<string, any>,
      targetLocation?: UserLocation | null,
    ): boolean => {
      if (product.status && String(product.status).toLowerCase() !== "active") {
        return false;
      }

      const loc = targetLocation ?? location;
      // If user hasn't set any location yet, show products
      if (!loc || !loc.latitude || !loc.longitude) {
        return true;
      }

      const prodLat = parseFloat(String(product.latitude ?? ""));
      const prodLon = parseFloat(String(product.longitude ?? ""));

      // If product has no GPS coords configured, consider deliverable
      if (isNaN(prodLat) || isNaN(prodLon) || prodLat === 0 || prodLon === 0) {
        return true;
      }

      const distStr = calculateDistance(
        loc.latitude,
        loc.longitude,
        prodLat,
        prodLon,
      );
      if (!distStr) return true;
      const distance = parseFloat(distStr);

      const radius = parseRadius(product.delivery_radius, 15);

      // Check distance within delivery radius + 3km tolerance
      if (distance <= radius + 3) return true;

      // Check matching area / city / district or pincode
      const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const userArea = clean(
        `${loc.area || ""} ${loc.district || ""} ${loc.city || ""} ${loc.locationName || ""}`,
      );
      const prodCity = clean(
        `${product.city || ""} ${product.district || ""} ${product.area_name || ""}`,
      );
      const userPin = String(loc.pincode || "").trim();
      const prodPin = String(product.pincode || "").trim();

      if (userPin && prodPin && userPin === prodPin) return true;
      if (
        userArea &&
        prodCity &&
        (userArea.includes(prodCity) || prodCity.includes(userArea))
      ) {
        if (distance <= 35) return true;
      }

      return false;
    },
    [location, calculateDistance],
  );

  // Fetch current GPS location
  const fetchLocation = useCallback(
    async (
      onSuccess?: (loc: UserLocation) => void,
      silent = false,
    ): Promise<UserLocation | null> => {
      try {
        setFetchingLocation(true);
        setLocationError(null);

        // 1. Permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          const permissionMessage = "Permission to access location was denied";
          setLocationError(permissionMessage);
          if (!silent) {
            Alert.alert(
              "Location Permission Needed",
              "Please allow location access to discover chefs and products deliverable to your area.",
            );
          }
          setFetchingLocation(false);
          return null;
        }

        // 2. Coordinates (Try current, fallback to last known)
        let coords: { latitude: number; longitude: number } | null = null;
        try {
          const currentPos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coords = {
            latitude: currentPos.coords.latitude,
            longitude: currentPos.coords.longitude,
          };
        } catch (posErr) {
          console.warn(
            "getCurrentPositionAsync failed, trying last known:",
            posErr,
          );
          const lastKnown = await Location.getLastKnownPositionAsync({});
          if (lastKnown) {
            coords = {
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude,
            };
          }
        }

        if (!coords) {
          throw new Error(
            "Unable to determine device location. Please ensure GPS is enabled.",
          );
        }

        const { latitude, longitude } = coords;

        // 3. Reverse Geocode
        let area = "";
        let district = "";
        let city = "";
        let pincode = "";
        let locationName = "";

        try {
          const reverseGeo = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          const geoData = reverseGeo[0] || {};
          city = geoData.city || geoData.subregion || "";
          district = geoData.region || geoData.district || "";
          area = geoData.subregion || geoData.city || geoData.name || "";
          pincode = geoData.postalCode || "";

          const parts = [city || area, district].filter(Boolean);
          locationName =
            parts.length > 0
              ? parts.join(", ")
              : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        } catch (geoErr) {
          console.warn("Reverse geocode warning:", geoErr);
          locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }

        const newLocation: UserLocation = {
          latitude,
          longitude,
          locationName,
          area: area || city,
          district,
          city,
          pincode,
        };

        // 4. Persist immediately to AsyncStorage
        await AsyncStorage.setItem(
          LOCATION_STORAGE_KEY,
          JSON.stringify(newLocation),
        );
        setLocationState(newLocation);

        // 5. Update backend profile & AuthContext if logged in
        if (user?.id) {
          try {
            const profileResponse = await api
              .get("/auth/profile")
              .catch(() => null);
            const profileUser =
              profileResponse?.data?.user ||
              profileResponse?.data ||
              user ||
              {};

            const username =
              profileUser.username || user?.username || user?.name || "";
            const email = profileUser.email || user?.email || "";

            if (username && email) {
              const updatedProfileResponse = await api.put("/auth/profile", {
                ...profileUser,
                username,
                email,
                latitude,
                longitude,
                location_name: locationName,
                area: area || city,
                district,
                pincode,
              });

              const freshProfile =
                updatedProfileResponse?.data?.user ||
                updatedProfileResponse?.data || {
                  ...profileUser,
                  latitude,
                  longitude,
                  location_name: locationName,
                  area: area || city,
                  district,
                  pincode,
                };

              if (updateUser) {
                await updateUser(freshProfile);
              }
            }
          } catch (profileErr) {
            console.warn(
              "Failed to sync location to backend profile:",
              profileErr,
            );
          }
        }

        if (onSuccess) {
          onSuccess(newLocation);
        }

        if (!silent) {
          Alert.alert(
            "Location Changed",
            `Delivery area set to ${locationName}. Showing nearby products.`,
          );
        }

        return newLocation;
      } catch (err) {
        console.error("fetchLocation error:", err);
        const msg =
          err instanceof Error ? err.message : "Failed to fetch location";
        setLocationError(msg);
        if (!silent) {
          Alert.alert("Location Update", msg);
        }
        return null;
      } finally {
        setFetchingLocation(false);
      }
    },
    [user, updateUser],
  );

  const hasLocation = useMemo(
    () => Boolean(location && location.latitude && location.longitude),
    [location],
  );

  const value = {
    location,
    hasLocation,
    isLoadingLocation,
    fetchingLocation,
    locationError,
    fetchLocation,
    setLocation,
    calculateDistance,
    isProductDeliverable,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
