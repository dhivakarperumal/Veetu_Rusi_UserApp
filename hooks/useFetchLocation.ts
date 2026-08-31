import api from "@/app/api";
import { AuthContext } from "@/context/AuthContext";
import * as Location from "expo-location";
import { useCallback, useContext, useState } from "react";

export function useFetchLocation() {
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const fetchLocation = useCallback(
    async (onSuccess?: () => void) => {
      try {
        setFetchingLocation(true);
        setLocationError(null);

        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Permission to access location was denied");
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
              await api.put("/auth/profile", {
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

              await api.get("/auth/profile");
            }
          }

          // Call the success callback
          if (onSuccess) {
            onSuccess();
          }
        } catch (geoError) {
          console.warn("Reverse geocoding failed:", geoError);
          // Still proceed with just coordinates even if geocoding fails
          if (onSuccess) {
            onSuccess();
          }
        }
      } catch (error) {
        console.error("Error fetching location:", error);
        setLocationError(
          error instanceof Error ? error.message : "Failed to fetch location"
        );
      } finally {
        setFetchingLocation(false);
      }
    },
    [user]
  );

  return { fetchingLocation, locationError, fetchLocation };
}
