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

    const url = `${API_ENDPOINTS.STATION.PUBLIC}/nearby?${queryParams.toString()}`;
    console.log('[driver-station.service] Fetching nearby stations:', url);

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[driver-station.service] API error:', response.status, errorData);
      throw new Error(errorData.message || `Không thể tìm trạm gần đây (${response.status})`);
    }

    const data = await response.json();
    console.log('[driver-station.service] Response:', data);
    
    // BE trả về: { success: true, data: { stations: [...], search_params: {...} } }
    // Hoặc: { success: true, data: [...] }
    if (data.success && data.data) {
      if (Array.isArray(data.data)) {
        return data.data;
      } else if (data.data.stations && Array.isArray(data.data.stations)) {
        return data.data.stations;
      }
    }
    
    console.warn('[driver-station.service] Unexpected response format:', data);
    return [];
  },

  // GET /api/public/stations - Tìm kiếm trạm công khai (không cần auth)
  async searchPublicStations(query: string): Promise<Station[]> {
    const queryParams = new URLSearchParams();
    
    // BE mới: search parameter để tìm theo name hoặc address
    if (query.trim()) {
      queryParams.append("search", query.trim());
    }
    
    // BE mới: status="all" để lấy tất cả stations (không chỉ active)
    // Hoặc không gửi status để mặc định lấy active
    queryParams.append("status", "all"); // Lấy tất cả để search được nhiều hơn
    
    // Tăng limit để lấy nhiều kết quả hơn
    queryParams.append("limit", "50");

    const url = `${API_ENDPOINTS.STATION.PUBLIC}?${queryParams.toString()}`;
    console.log('[driver-station.service] Searching stations:', url);

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[driver-station.service] Search API error:', response.status, errorData);
      throw new Error(errorData.message || `Không thể tìm kiếm trạm (${response.status})`);
    }

    const data = await response.json();
    console.log('[driver-station.service] Search response:', data);
    console.log('[driver-station.service] Search response data.data:', data.data);
    
    // BE trả về: { success: true, data: { stations: [...], pagination: {...} } }
    if (data.success && data.data) {
      if (Array.isArray(data.data)) {
        // Trường hợp BE trả về array trực tiếp (backward compatibility)
        console.log('[driver-station.service] Returning array directly, count:', data.data.length);
        return data.data;
      } else if (data.data.stations && Array.isArray(data.data.stations)) {
        // Trường hợp BE trả về object với stations array
        console.log('[driver-station.service] Returning stations array, count:', data.data.stations.length);
        return data.data.stations;
      } else {
        console.warn('[driver-station.service] data.data is not array and has no stations property:', data.data);
      }
    }
    
    console.warn('[driver-station.service] Unexpected search response format:', data);
    return [];
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
