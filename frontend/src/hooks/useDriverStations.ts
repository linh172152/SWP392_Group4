import { useState, useCallback } from "react";
import { driverStationService } from "../services/driver-station.service";
import type {
  Station,
  NearbyStationsParams,
} from "../services/driver-station.service";

export const useDriverStations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tìm trạm gần đây (authenticated)
  const findNearbyStations = useCallback(
    async (params: NearbyStationsParams) => {
      setLoading(true);
      setError(null);
      try {
        const data = await driverStationService.findNearbyStations(params);
        setStations(data);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Đã xảy ra lỗi";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Tìm kiếm trạm công khai (không cần auth)
  const searchStations = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await driverStationService.searchPublicStations(query);
      setStations(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Đã xảy ra lỗi";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy chi tiết trạm công khai (không cần auth)
  const getStationDetails = useCallback(async (stationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await driverStationService.getPublicStationDetails(stationId);
      setCurrentStation(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Đã xảy ra lỗi";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tìm trạm gần công khai (không cần auth)
  const findNearbyPublicStations = useCallback(
    async (params: NearbyStationsParams) => {
      setLoading(true);
      setError(null);
      try {
        const data = await driverStationService.findNearbyPublicStations(params);
        setStations(data);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Đã xảy ra lỗi";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    stations,
    currentStation,
    loading,
    error,

    // Actions
    findNearbyStations,
    searchStations,
    getStationDetails,
    findNearbyPublicStations,
    clearError,
  };
};

