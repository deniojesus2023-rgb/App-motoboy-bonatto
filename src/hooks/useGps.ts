import { useState, useEffect, useRef, useCallback } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { trpc } from "../lib/trpc";

const LOCATION_TASK_NAME = "bonatto-background-location";

// Registra a task de localização em segundo plano (deve ser no nível do módulo)
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }: any) => {
  if (error) {
    console.error("Background location error:", error);
    return;
  }
  if (data) {
    // A atualização real é feita pelo hook via foreground watcher
    // Esta task garante que o GPS continue ativo quando o app vai para background
    const { locations } = data;
    if (locations && locations.length > 0) {
      const { latitude, longitude } = locations[0].coords;
      // Armazena temporariamente para uso pelo hook
      (global as any).__lastDriverLocation = { lat: latitude.toFixed(7), lng: longitude.toFixed(7) };
    }
  }
});

interface GpsState {
  active: boolean;
  lat: string | null;
  lng: string | null;
  error: string | null;
  permissionGranted: boolean;
}

export function useGps(token: string | null, activeOrderId?: number | null) {
  const [gps, setGps] = useState<GpsState>({
    active: false,
    lat: null,
    lng: null,
    error: null,
    permissionGranted: false,
  });

  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const updateLocation = trpc.drivers.updateLocation.useMutation();

  // Verifica permissões ao montar
  useEffect(() => {
    checkPermissions();
  }, []);

  async function checkPermissions() {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== "granted") {
      setGps((s) => ({ ...s, error: "Permissão de localização negada" }));
      return;
    }
    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    setGps((s) => ({
      ...s,
      permissionGranted: true,
      error: bg !== "granted" ? "GPS em segundo plano não autorizado — o rastreamento pausará quando o app fechar" : null,
    }));
  }

  const start = useCallback(async () => {
    if (!gps.permissionGranted) {
      await checkPermissions();
    }

    try {
      // Inicia watcher em primeiro plano
      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const lat = location.coords.latitude.toFixed(7);
          const lng = location.coords.longitude.toFixed(7);
          setGps((s) => ({ ...s, active: true, lat, lng, error: null }));
          if (token) {
            updateLocation.mutate({
              token,
              lat,
              lng,
              orderId: activeOrderId ?? undefined,
            });
          }
        }
      );

      // Inicia task de segundo plano (se permissão concedida)
      const { status: bg } = await Location.getBackgroundPermissionsAsync();
      if (bg === "granted") {
        const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
        if (!isRunning) {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
            distanceInterval: 20,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: "Bonatto Motoboy",
              notificationBody: "GPS ativo — rastreando sua localização",
              notificationColor: "#6E0D12",
            },
          });
        }
      }

      setGps((s) => ({ ...s, active: true, error: null }));
    } catch (err: any) {
      setGps((s) => ({ ...s, error: err.message ?? "Erro ao iniciar GPS" }));
    }
  }, [token, activeOrderId, gps.permissionGranted]);

  const stop = useCallback(async () => {
    watcherRef.current?.remove();
    watcherRef.current = null;

    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
    }

    setGps((s) => ({ ...s, active: false }));
  }, []);

  const toggle = useCallback(() => {
    if (gps.active) stop();
    else start();
  }, [gps.active, start, stop]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      watcherRef.current?.remove();
    };
  }, []);

  return { gps, toggle, start, stop };
}
