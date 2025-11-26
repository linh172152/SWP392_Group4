import { PrismaClient, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

/**
 * Script to fill batteries into existing stations
 * Usage: npx ts-node backend/scripts/fill-batteries.ts
 */
async function fillBatteries() {
  try {
    console.log("🔋 Starting to fill batteries into stations...\n");

    // Get all active stations
    const stations = await prisma.stations.findMany({
      where: {
        status: "active",
      },
      select: {
        station_id: true,
        name: true,
        capacity: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    if (stations.length === 0) {
      console.log("❌ No active stations found.");
      return;
    }

    console.log(`Found ${stations.length} active station(s):\n`);

    for (const station of stations) {
      // Count current batteries in this station
      const currentBatteryCount = await prisma.batteries.count({
        where: {
          station_id: station.station_id,
        },
      });

      const capacity = Number(station.capacity) || 0;
      const availableSlots = capacity - currentBatteryCount;

      console.log(`📍 Station: ${station.name} (ID: ${station.station_id})`);
      console.log(`   Capacity: ${capacity}`);
      console.log(`   Current batteries: ${currentBatteryCount}`);
      console.log(`   Available slots: ${availableSlots}`);

      if (availableSlots <= 0) {
        console.log(`   ⚠️  Station is full. Skipping...\n`);
        continue;
      }

      // Calculate how many batteries to add (fill up to 80% of capacity or at least 10)
      const targetCount = Math.max(10, Math.floor(capacity * 0.8));
      const batteriesToAdd = Math.min(
        availableSlots,
        targetCount - currentBatteryCount
      );

      if (batteriesToAdd <= 0) {
        console.log(`   ✅ Station has enough batteries.\n`);
        continue;
      }

      console.log(`   Adding ${batteriesToAdd} battery(ies)...`);

      const batteryModels = [
        "VinFast VF8 Battery",
        "Tesla Model 3 Battery",
        "Pega Battery",
      ];

      const batteryPromises: Promise<any>[] = [];

      for (let i = 1; i <= batteriesToAdd; i++) {
        const modelIndex = i % batteryModels.length;
        const model = batteryModels[modelIndex];
        const capacity_kwh =
          model === "VinFast VF8 Battery"
            ? 87.7
            : model === "Tesla Model 3 Battery"
              ? 75
              : 80;
        const voltage =
          model === "VinFast VF8 Battery"
            ? 400
            : model === "Tesla Model 3 Battery"
              ? 350
              : 380;

        // Distribute status: 60% full, 30% charging, 10% maintenance
        const statusRandom = Math.random();
        let status: string;
        let currentCharge: number;
        let health_percentage: number;

        if (statusRandom < 0.6) {
          status = "full";
          currentCharge = 100;
          health_percentage = Math.random() * 5 + 95; // 95-100%
        } else if (statusRandom < 0.9) {
          status = "charging";
          currentCharge = Math.floor(Math.random() * 25) + 60; // 60-84%
          health_percentage = Math.random() * 10 + 85; // 85-95%
        } else {
          status = "maintenance";
          currentCharge = Math.floor(Math.random() * 30) + 40; // 40-69%
          health_percentage = Math.random() * 15 + 70; // 70-85%
        }

        const cycle_count = Math.floor(Math.random() * 120) + 60;

        // Generate unique battery code
        const stationNameShort = station.name
          .replace(/EV Battery Station - /g, "")
          .replace(/\s+/g, "")
          .substring(0, 3)
          .toUpperCase();
        const batteryCode = `BAT-${stationNameShort}-${(currentBatteryCount + i)
          .toString()
          .padStart(3, "0")}`;

        batteryPromises.push(
          prisma.batteries.create({
            data: {
              battery_id: randomUUID(),
              battery_code: batteryCode,
              station_id: station.station_id,
              model,
              capacity_kwh: new Prisma.Decimal(capacity_kwh),
              voltage: new Prisma.Decimal(voltage),
              current_charge: currentCharge,
              status,
              last_charged_at:
                status === "full"
                  ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
                  : null,
              health_percentage: new Prisma.Decimal(health_percentage),
              cycle_count,
              updated_at: new Date(),
            } as Prisma.batteriesUncheckedCreateInput,
          })
        );
      }

      await Promise.all(batteryPromises);
      console.log(`   ✅ Successfully added ${batteriesToAdd} battery(ies)!\n`);
    }

    console.log("✅ Finished filling batteries into stations!");
  } catch (error) {
    console.error("❌ Error filling batteries:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fillBatteries()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
