// we will now use it in a component
"use client";

import { useEffect, useState } from "react";

type Location = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported by your browser");
      setLoading(false);
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setLocation({ latitude, longitude, accuracy });
      setLoading(false);
    };

    const onError = (err: GeolocationPositionError) => {
      setError(err.message);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, []);

  return { location, error, loading };
}
