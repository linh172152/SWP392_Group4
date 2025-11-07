import { API_ENDPOINTS } from "../config/api";

// Interface khớp với Prisma schema backend
export interface Battery {
  battery_id: string;
  battery_code: string;
  model: string;
  capacity_kwh?: number;
  voltage?: number;
  current_charge: number;
  status: "full" | "charging" | "in_use" | "maintenance" | "damaged";
  last_charged_at?: string;
}

export interface StationRating {
  rating_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: {
    user_id: string;
    full_name: string;
  };
}

export interface Station {
  station_id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  supported_models: string[] | any; // JSON array
  operating_hours?: string;
  status: "active" | "maintenance" | "closed";
  created_at: string;
  updated_at: string;
  batteries?: Battery[];
  station_ratings?: StationRating[];
  average_rating?: number;
  total_ratings?: number;
  available_batteries?: number;
  distance_km?: number;
  battery_stats?: Record<string, number>;
}

export interface NearbyStationsParams {
  latitude: number;
  longitude: number;
  radius?: number; // km, default: 10
}

export interface SearchStationsParams {
  query: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const driverStationService = {
  // GET /api/public/stations/nearby - Tìm trạm gần công khai (không cần auth)
  async findNearbyPublicStations(params: NearbyStationsParams): Promise<Station[]> {
    const { latitude, longitude, radius = 10 } = params;
    
    // Backend expects 'latitude' and 'longitude' (not 'lat' and 'lng')
    const queryParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });

    const response = await fetch(
      `${API_ENDPOINTS.STATION.PUBLIC}/nearby?${queryParams.toString()}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Không thể tìm trạm gần đây");
    }

    const data = await response.json();
    return data.data?.stations || data.data || [];
  },

  // GET /api/public/stations - Tìm kiếm trạm công khai (không cần auth)
  async searchPublicStations(query: string): Promise<Station[]> {
    const queryParams = new URLSearchParams();
    
    if (query.trim()) {
      queryParams.append("search", query);
    }

    const response = await fetch(
      `${API_ENDPOINTS.STATION.PUBLIC}?${queryParams.toString()}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Không thể tìm kiếm trạm");
    }

    const data = await response.json();
    return data.data?.stations || data.data || [];
  },

  // GET /api/public/stations/:id - Chi tiết trạm công khai (không cần auth)
  async getPublicStationDetails(stationId: string): Promise<Station> {
    const response = await fetch(
      `${API_ENDPOINTS.STATION.PUBLIC}/${stationId}`,
      {
        method: "GET",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Không tìm thấy trạm");
      }
      throw new Error(data.message || "Không thể lấy thông tin trạm");
    }

    return data.data;
  },

  // --- AUTHENTICATED APIs (chỉ dùng khi đã đăng nhập) ---

  // GET /api/driver/stations/nearby - Tìm trạm gần đây (authenticated)
  async findNearbyStations(params: NearbyStationsParams): Promise<Station[]> {
    const { latitude, longitude, radius = 10 } = params;
    
    const queryParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });

    const response = await fetch(
      `${API_ENDPOINTS.DRIVER.STATIONS}/nearby?${queryParams.toString()}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Không thể tìm trạm gần đây");
    }

    const data = await response.json();
    return data.data || [];
  },

  // GET /api/driver/stations/search - Tìm kiếm trạm (authenticated)
  async searchStations(params: SearchStationsParams): Promise<Station[]> {
    const { query, latitude, longitude, radius = 10 } = params;
    
    const queryParams = new URLSearchParams({ query });
    
    if (latitude && longitude) {
      queryParams.append("latitude", latitude.toString());
      queryParams.append("longitude", longitude.toString());
      queryParams.append("radius", radius.toString());
    }

    const response = await fetch(
      `${API_ENDPOINTS.DRIVER.STATIONS}/search?${queryParams.toString()}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Không thể tìm kiếm trạm");
    }

    const data = await response.json();
    return data.data || [];
  },

  // GET /api/driver/stations/:id - Chi tiết trạm (authenticated)
  async getStationDetails(stationId: string): Promise<Station> {
    const response = await fetch(
      `${API_ENDPOINTS.DRIVER.STATIONS}/${stationId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Không tìm thấy trạm");
      }
      throw new Error(data.message || "Không thể lấy thông tin trạm");
    }

    return data.data;
  },
};

export default driverStationService;
