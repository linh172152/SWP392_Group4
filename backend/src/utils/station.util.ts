import { prisma } from "../server";

/**
 * Calculate battery inventory by model for a station
 * Optimized reusable function
 */
export async function calculateBatteryInventory(stationId: string) {
  const allBatteries = await prisma.battery.findMany({
    where: { station_id: stationId },
    select: {
      model: true,
      status: true,
    },
  });

  const batteryInventory: Record<
    string,
    { available: number; charging: number; total: number }
  > = {};

  // Group by model
  const batteriesByModel = allBatteries.reduce(
    (acc, battery) => {
      if (!acc[battery.model]) {
        acc[battery.model] = { available: 0, charging: 0, total: 0 };
      }
      acc[battery.model].total++;
      if (battery.status === "full") {
        acc[battery.model].available++;
      } else if (battery.status === "charging") {
        acc[battery.model].charging++;
      }
      return acc;
    },
    {} as Record<string, { available: number; charging: number; total: number }>
  );

  // Only include models that have batteries
  Object.keys(batteriesByModel).forEach((model) => {
    batteryInventory[model] = batteriesByModel[model];
  });

  return batteryInventory;
}

/**
 * Calculate capacity percentage and warning for a station
 */
export async function calculateCapacityWarning(
  stationId: string,
  capacity: number | null
) {
  const totalBatteries = await prisma.battery.count({
    where: { station_id: stationId },
  });

  const capacityPercentage = capacity
    ? (totalBatteries / Number(capacity)) * 100
    : 0;

  const capacityWarning =
    capacityPercentage >= 90
      ? {
          level: "almost_full" as const,
          percentage: Math.round(capacityPercentage),
        }
      : null;

  return {
    capacityPercentage: Math.round(capacityPercentage),
    capacityWarning,
    totalBatteries,
  };
}

/**
 * Calculate both battery inventory and capacity warning in one go
 * Optimized to reduce database queries
 */
export async function calculateStationStats(
  stationId: string,
  capacity: number | null
) {
  // Fetch all data in parallel
  const [allBatteries, totalBatteries] = await Promise.all([
    prisma.battery.findMany({
      where: { station_id: stationId },
      select: {
        model: true,
        status: true,
      },
    }),
    prisma.battery.count({
      where: { station_id: stationId },
    }),
  ]);

  // Calculate battery inventory
  const batteryInventory: Record<
    string,
    { available: number; charging: number; total: number }
  > = {};

  const batteriesByModel = allBatteries.reduce(
    (acc, battery) => {
      if (!acc[battery.model]) {
        acc[battery.model] = { available: 0, charging: 0, total: 0 };
      }
      acc[battery.model].total++;
      if (battery.status === "full") {
        acc[battery.model].available++;
      } else if (battery.status === "charging") {
        acc[battery.model].charging++;
      }
      return acc;
    },
    {} as Record<string, { available: number; charging: number; total: number }>
  );

  Object.keys(batteriesByModel).forEach((model) => {
    batteryInventory[model] = batteriesByModel[model];
  });

  // Calculate capacity warning
  const capacityPercentage = capacity
    ? (totalBatteries / Number(capacity)) * 100
    : 0;

  const capacityWarning =
    capacityPercentage >= 90
      ? {
          level: "almost_full" as const,
          percentage: Math.round(capacityPercentage),
        }
      : null;

  return {
    batteryInventory,
    capacityPercentage: Math.round(capacityPercentage),
    capacityWarning,
    totalBatteries,
  };
}
