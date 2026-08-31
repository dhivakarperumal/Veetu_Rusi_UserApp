import api from "@/app/api";
import { AuthContext } from "@/context/AuthContext";
import * as Location from "expo-location";
import { useCallback, useContext, useState } from "react";

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

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

          // Update user location in backend
          if (user?.id) {
            await api.put("/auth/profile", {
              latitude,
              longitude,
              location_name: `${geoData.city}, ${geoData.region}`,
              area: geoData.city,
              district: geoData.region,
              pincode: geoData.postalCode,
            });

            // Update local auth context by fetching fresh profile
            await api.get("/auth/profile");
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
    [user?.id]
  );

  return { fetchingLocation, locationError, fetchLocation };
}
