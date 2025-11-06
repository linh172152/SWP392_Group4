/**
 * Utility functions để extract battery models từ station data
 */

import { Station } from "../services/driver-station.service";
import { Vehicle } from "../services/vehicle.service";

/**
 * Lấy danh sách unique battery models từ station
 * Ưu tiên: battery_inventory > batteries array > supported_models
 */
export function getBatteryModels(station: Station): string[] {
  // Cách 1: Từ battery_inventory (nếu có - từ API chi tiết trạm)
  if (station.battery_inventory && typeof station.battery_inventory === 'object') {
    const models = Object.keys(station.battery_inventory);
    if (models.length > 0) {
      return models;
    }
  }

  // Cách 2: Từ batteries array
  if (station.batteries && Array.isArray(station.batteries)) {
    const models = [...new Set(station.batteries.map(b => b.model))];
    if (models.length > 0) {
      return models;
    }
  }

  // Cách 3: Từ supported_models (JSON field)
  if (station.supported_models) {
    try {
      // Nếu là string, parse JSON
      const models = typeof station.supported_models === 'string' 
        ? JSON.parse(station.supported_models)
        : station.supported_models;
      
      if (Array.isArray(models)) {
        return models;
      }
    } catch (e) {
      console.warn('Failed to parse supported_models:', e);
    }
  }

  return [];
}

/**
 * Match battery model với vehicle battery_model (flexible matching)
 */
export function matchBatteryModel(batteryModel: string, vehicleBatteryModel: string): boolean {
  const battery = batteryModel.toLowerCase().trim();
  const vehicle = vehicleBatteryModel.toLowerCase().trim();
  
  // Exact match
  if (battery === vehicle) return true;
  
  // Match với " Battery" suffix
  if (battery === `${vehicle} battery`) return true;
  if (vehicle === `${battery} battery`) return true;
  
  // Match khi remove " Battery" suffix
  if (battery.replace(' battery', '') === vehicle) return true;
  if (vehicle.replace(' battery', '') === battery) return true;
  
  return false;
}

/**
 * Lọc battery models chỉ hiện những loại phù hợp với vehicles của driver
 */
export function getCompatibleBatteryModels(station: Station, vehicles: Vehicle[]): string[] {
  if (!vehicles || vehicles.length === 0) return [];
  
  const allBatteryModels = getBatteryModels(station);
  const compatibleModels: string[] = [];
  
  // Lấy danh sách unique battery models từ vehicles
  const vehicleBatteryModels = vehicles
    .filter(v => v.battery_model)
    .map(v => v.battery_model!)
    .filter((model, index, self) => self.indexOf(model) === index); // unique
  
  // Match từng battery model trong trạm với vehicle battery models
  allBatteryModels.forEach(batteryModel => {
    const isCompatible = vehicleBatteryModels.some(vehicleModel => 
      matchBatteryModel(batteryModel, vehicleModel)
    );
    
    if (isCompatible) {
      compatibleModels.push(batteryModel);
    }
  });
  
  return compatibleModels;
}

/**
 * Lấy danh sách vehicles tương thích với một battery model cụ thể
 */
export function getCompatibleVehicles(batteryModel: string, vehicles: Vehicle[]): Vehicle[] {
  return vehicles.filter(vehicle => {
    if (!vehicle.battery_model) return false;
    return matchBatteryModel(batteryModel, vehicle.battery_model);
  });
}

/**
 * Lấy thông tin chi tiết về từng model pin (số lượng available, charging, total)
 */
export function getBatteryModelStats(station: Station): Record<string, {
  available: number;
  charging: number;
  total: number;
}> {
  // Nếu có battery_inventory từ API, dùng luôn
  if (station.battery_inventory && typeof station.battery_inventory === 'object') {
    return station.battery_inventory as Record<string, {
      available: number;
      charging: number;
      total: number;
    }>;
  }

  // Tính toán từ batteries array
  const stats: Record<string, {
    available: number;
    charging: number;
    total: number;
  }> = {};

  if (station.batteries && Array.isArray(station.batteries)) {
    station.batteries.forEach(battery => {
      if (!stats[battery.model]) {
        stats[battery.model] = {
          available: 0,
          charging: 0,
          total: 0,
        };
      }

      stats[battery.model].total++;
      
      if (battery.status === 'full') {
        stats[battery.model].available++;
      } else if (battery.status === 'charging') {
        stats[battery.model].charging++;
      }
    });
  }

  return stats;
}

/**
 * Lấy số lượng pin available cho một model cụ thể
 */
export function getAvailableCountForModel(station: Station, model: string): number {
  const stats = getBatteryModelStats(station);
  return stats[model]?.available || 0;
}

/**
 * Kiểm tra xem trạm có pin của model này không
 */
export function hasBatteryModel(station: Station, model: string): boolean {
  const models = getBatteryModels(station);
  return models.some(m => m.toLowerCase().trim() === model.toLowerCase().trim());
}

