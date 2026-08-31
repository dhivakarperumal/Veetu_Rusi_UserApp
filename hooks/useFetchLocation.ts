import api from "@/app/api";
import { AuthContext } from "@/context/AuthContext";
import * as Location from "expo-location";
import { useCallback, useContext, useState } from "react";
import { Alert } from "react-native";

export function useFetchLocation() {
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const updateUser = authContext?.updateUser;

  const fetchLocation = useCallback(
    async (onSuccess?: (location: { latitude: number; longitude: number }) => void) => {
      try {
        setFetchingLocation(true);
        setLocationError(null);

        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          const permissionMessage = "Permission to access location was denied";
          setLocationError(permissionMessage);
          Alert.alert("Location access denied", "Please enable location access to see nearby products.");
          setFetchingLocation(false);
          return;
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;

        // Get reverse geocoding (address from coordinates)
        try {
          const reverseGeo = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          const geoData = reverseGeo[0] || {};

          // Update user location in backend. Some backend profile updates require
          // username and email to be present even when only changing location data.
          if (user?.id) {
            const profileResponse = await api.get("/auth/profile").catch(() => null);
            const profileUser = profileResponse?.data?.user || profileResponse?.data || user || {};

            const username = profileUser.username || user?.username || user?.name || "";
            const email = profileUser.email || user?.email || "";

            if (!username || !email) {
              console.warn(
                "Skipping profile location update because username/email are missing for this user profile."
              );
            } else {
              const updatedProfileResponse = await api.put("/auth/profile", {
                ...profileUser,
                username,
                email,
                latitude,
                longitude,
                location_name: `${geoData.city || profileUser.area || user?.area || ""}, ${geoData.region || profileUser.district || user?.district || ""}`.replace(/^,|,$/g, "").trim() || user?.location_name || "",
                area: geoData.city || profileUser.area || user?.area || "",
                district: geoData.region || profileUser.district || user?.district || "",
                pincode: geoData.postalCode || profileUser.pincode || user?.pincode || "",
              });

              const freshProfile =
                updatedProfileResponse?.data?.user ||
                updatedProfileResponse?.data ||
                profileUser;

              if (freshProfile && updateUser) {
                await updateUser(freshProfile);
              }
            }
          }

          // Call the success callback
          if (onSuccess) {
            onSuccess({ latitude, longitude });
          }

          Alert.alert("Location updated", "Your area has been refreshed and nearby products are ready.");
        } catch (geoError) {
          console.warn("Reverse geocoding failed:", geoError);
          // Still proceed with just coordinates even if geocoding fails
          if (onSuccess) {
            onSuccess({ latitude, longitude });
          }

          Alert.alert("Location updated", "Your coordinates were captured. Nearby products are refreshing.");
        }
      } catch (error) {
        console.error("Error fetching location:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch location";
        setLocationError(errorMessage);
        Alert.alert("Location update failed", "Please try again or check your location permissions.");
      } finally {
        setFetchingLocation(false);
      }
    },
    [user, updateUser]
  );

  return { fetchingLocation, locationError, fetchLocation };
}
