import { PrismaClient, Prisma } from "@prisma/client";
import { hashPassword } from "../src/utils/bcrypt.util";

const prisma = new PrismaClient();

async function main() {
  // Safety check: Only seed if explicitly requested or if database is empty
  const existingUsersCount = await prisma.user.count();
  const existingStationsCount = await prisma.station.count();
  const forceSeed = process.env.FORCE_SEED === "true";
  const isProduction = process.env.NODE_ENV === "production";

  // In production, require explicit FORCE_SEED=true to prevent accidental seeding
  if (isProduction && !forceSeed) {
    console.log("⚠️  Production environment detected. Seed skipped for safety.");
    console.log("   To seed in production, set FORCE_SEED=true");
    console.log(`   Current data: ${existingUsersCount} users, ${existingStationsCount} stations`);
    return;
  }

  // If database already has data, skip seeding unless FORCE_SEED=true
  if (!forceSeed && (existingUsersCount > 0 || existingStationsCount > 0)) {
    console.log("⚠️  Database already contains data. Seed skipped to prevent data loss.");
    console.log(`   Current data: ${existingUsersCount} users, ${existingStationsCount} stations`);
    console.log("   To force seed, set FORCE_SEED=true");
    return;
  }

  console.log("🌱 Starting comprehensive database seeding...");

  // Generate simple password hashes for existing users
  const adminPasswordHash = await hashPassword("admin123");
  const staffPasswordHash = await hashPassword("staff123");
  const driverPasswordHash = await hashPassword("driver123");

  // ===========================================
  // CREATE ADMIN USERS (using upsert to avoid duplicates)
  // ===========================================
  const admins = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@evbattery.com" },
      update: {
        full_name: "Nguyen Van Admin",
        password_hash: adminPasswordHash,
        phone: "0123456789",
        role: "ADMIN",
        status: "ACTIVE",
      },
      create: {
        full_name: "Nguyen Van Admin",
        email: "admin@evbattery.com",
        password_hash: adminPasswordHash,
        phone: "0123456789",
        role: "ADMIN",
        status: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "manager@evbattery.com" },
      update: {
        full_name: "Tran Thi Manager",
        password_hash: adminPasswordHash,
        phone: "0123456790",
        role: "ADMIN",
        status: "ACTIVE",
      },
      create: {
        full_name: "Tran Thi Manager",
        email: "manager@evbattery.com",
        password_hash: adminPasswordHash,
        phone: "0123456790",
        role: "ADMIN",
        status: "ACTIVE",
      },
    }),
  ]);
  console.log("✅ Created admin users:", admins.length);

  // ===========================================
  // CREATE STATIONS
  // ===========================================
  const stations = await Promise.all([
    prisma.station.create({
      data: {
        name: "EV Battery Station - District 1",
        address: "123 Nguyen Hue, District 1, Ho Chi Minh City",
        latitude: 10.7769,
        longitude: 106.7009,
        capacity: 50,
        supported_models: [
          "Tesla Model 3",
          "VinFast VF8",
          "BYD Atto 3",
          "BMW iX3",
        ],
        operating_hours: "24/7",
        status: "active",
      },
    }),
    prisma.station.create({
      data: {
        name: "EV Battery Station - District 7",
        address: "456 Nguyen Thi Thap, District 7, Ho Chi Minh City",
        latitude: 10.7374,
        longitude: 106.7223,
        capacity: 40,
        supported_models: ["VinFast VF8", "BYD Atto 3", "Hyundai IONIQ 5"],
        operating_hours: "6:00 - 22:00",
        status: "active",
      },
    }),
    prisma.station.create({
      data: {
        name: "EV Battery Station - Thu Duc",
        address: "789 Vo Van Ngan, Thu Duc City, Ho Chi Minh City",
        latitude: 10.8603,
        longitude: 106.7599,
        capacity: 60,
        supported_models: [
          "Tesla Model 3",
          "VinFast VF8",
          "BYD Atto 3",
          "BMW iX3",
          "Mercedes EQS",
        ],
        operating_hours: "24/7",
        status: "active",
      },
    }),
    prisma.station.create({
      data: {
        name: "EV Battery Station - Binh Thanh",
        address: "321 Dien Bien Phu, Binh Thanh District, Ho Chi Minh City",
        latitude: 10.8106,
        longitude: 106.7091,
        capacity: 35,
        supported_models: ["VinFast VF8", "BYD Atto 3"],
        operating_hours: "7:00 - 21:00",
        status: "maintenance",
      },
    }),
  ]);
  console.log("✅ Created stations:", stations.length);

  // ===========================================
  // CREATE STAFF USERS (using upsert to avoid duplicates)
  // ===========================================
  const staffs = await Promise.all([
    prisma.user.upsert({
      where: { email: "staff1@evbattery.com" },
      update: {
        full_name: "Le Van Staff 1",
        password_hash: staffPasswordHash,
        phone: "0987654321",
        role: "STAFF",
        station_id: stations[0].station_id,
        status: "ACTIVE",
      },
      create: {
        full_name: "Le Van Staff 1",
        email: "staff1@evbattery.com",
        password_hash: staffPasswordHash,
        phone: "0987654321",
        role: "STAFF",
        station_id: stations[0].station_id,
        status: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "staff2@evbattery.com" },
      update: {
        full_name: "Pham Thi Staff 2",
        password_hash: staffPasswordHash,
        phone: "0987654322",
        role: "STAFF",
        station_id: stations[0].station_id,
        status: "ACTIVE",
      },
      create: {
        full_name: "Pham Thi Staff 2",
        email: "staff2@evbattery.com",
        password_hash: staffPasswordHash,
        phone: "0987654322",
        role: "STAFF",
        station_id: stations[0].station_id,
        status: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "staff3@evbattery.com" },
      update: {
        full_name: "Hoang Van Staff 3",
        password_hash: staffPasswordHash,
        phone: "0987654323",
        role: "STAFF",
        station_id: stations[1].station_id,
        status: "ACTIVE",
      },
      create: {
        full_name: "Hoang Van Staff 3",
        email: "staff3@evbattery.com",
        password_hash: staffPasswordHash,
        phone: "0987654323",
        role: "STAFF",
        station_id: stations[1].station_id,
        status: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "staff4@evbattery.com" },
      update: {
        full_name: "Vu Thi Staff 4",
        password_hash: staffPasswordHash,
        phone: "0987654324",
        role: "STAFF",
        station_id: stations[2].station_id,
        status: "ACTIVE",
      },
      create: {
        full_name: "Vu Thi Staff 4",
        email: "staff4@evbattery.com",
        password_hash: staffPasswordHash,
        phone: "0987654324",
        role: "STAFF",
        station_id: stations[2].station_id,
        status: "ACTIVE",
      },
    }),
  ]);
  console.log("✅ Created staff users:", staffs.length);

  // ===========================================
  // CREATE DRIVER USERS (using upsert to avoid duplicates)
  // ===========================================
  const drivers = await Promise.all([
    prisma.user.upsert({
      where: { email: "driver1@evbattery.com" },
      update: {
        full_name: "Tran Van Driver 1",
        password_hash: driverPasswordHash,
        phone: "0912345678",
        role: "DRIVER",
        status: "ACTIVE",
      },
      create: {
        full_name: "Tran Van Driver 1",
        email: "driver1@evbattery.com",
        password_hash: driverPasswordHash,
        phone: "0912345678",
        role: "DRIVER",
        status: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "driver2@evbattery.com" },
      update: {
        full_name: "Nguyen Thi Driver 2",
        password_hash: driverPasswordHash,
        phone: "0912345679",
        role: "DRIVER",
        status: "ACTIVE",
      },
      create: {
        full_name: "Nguyen Thi Driver 2",
        email: "driver2@evbattery.com",
        password_hash: driverPasswordHash,
        phone: "0912345679",
        role: "DRIVER",
        status: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "driver3@evbattery.com" },
      update: {
        full_name: "Le Van Driver 3",
        password_hash: driverPasswordHash,
        phone: "0912345680",
        role: "DRIVER",
        status: "ACTIVE",
      },
      create: {
        full_name: "Le Van Driver 3",
        email: "driver3@evbattery.com",
        password_hash: driverPasswordHash,
        phone: "0912345680",
        role: "DRIVER",
        status: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "driver4@evbattery.com" },
      update: {
        full_name: "Pham Thi Driver 4",
        password_hash: driverPasswordHash,
        phone: "0912345681",
        role: "DRIVER",
        status: "ACTIVE",
      },
      create: {
        full_name: "Pham Thi Driver 4",
        email: "driver4@evbattery.com",
        password_hash: driverPasswordHash,
        phone: "0912345681",
        role: "DRIVER",
        status: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "driver5@evbattery.com" },
      update: {
        full_name: "Hoang Van Driver 5",
        password_hash: driverPasswordHash,
        phone: "0912345682",
        role: "DRIVER",
        status: "ACTIVE",
      },
      create: {
        full_name: "Hoang Van Driver 5",
        email: "driver5@evbattery.com",
        password_hash: driverPasswordHash,
        phone: "0912345682",
        role: "DRIVER",
        status: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "driver6@evbattery.com" },
      update: {
        full_name: "Vu Thi Driver 6",
        password_hash: driverPasswordHash,
        phone: "0912345683",
        role: "DRIVER",
        status: "INACTIVE",
      },
      create: {
        full_name: "Vu Thi Driver 6",
        email: "driver6@evbattery.com",
        password_hash: driverPasswordHash,
        phone: "0912345683",
        role: "DRIVER",
        status: "INACTIVE",
      },
    }),
  ]);
  console.log("✅ Created driver users:", drivers.length);

  // ===========================================
  // CREATE VEHICLES
  // ===========================================
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        user_id: drivers[0].user_id,
        license_plate: "51A-12345",
        vehicle_type: "car",
        make: "VinFast",
        model: "VF8",
        year: 2023,
        battery_model: "VinFast VF8 Battery",
      },
    }),
    prisma.vehicle.create({
      data: {
        user_id: drivers[1].user_id,
        license_plate: "51B-67890",
        vehicle_type: "car",
        make: "Tesla",
        model: "Model 3",
        year: 2022,
        battery_model: "Tesla Model 3 Battery",
      },
    }),
    prisma.vehicle.create({
      data: {
        user_id: drivers[2].user_id,
        license_plate: "51C-11111",
        vehicle_type: "car",
        make: "BYD",
        model: "Atto 3",
        year: 2023,
        battery_model: "BYD Atto 3 Battery",
      },
    }),
    prisma.vehicle.create({
      data: {
        user_id: drivers[3].user_id,
        license_plate: "51D-22222",
        vehicle_type: "car",
        make: "BMW",
        model: "iX3",
        year: 2022,
        battery_model: "BMW iX3 Battery",
      },
    }),
    prisma.vehicle.create({
      data: {
        user_id: drivers[4].user_id,
        license_plate: "51E-33333",
        vehicle_type: "car",
        make: "Hyundai",
        model: "IONIQ 5",
        year: 2023,
        battery_model: "Hyundai IONIQ 5 Battery",
      },
    }),
    prisma.vehicle.create({
      data: {
        user_id: drivers[5].user_id,
        license_plate: "51F-44444",
        vehicle_type: "motorbike",
        make: "VinFast",
        model: "Theon",
        year: 2023,
        battery_model: "VinFast Theon Battery",
      },
    }),
  ]);
  console.log("✅ Created vehicles:", vehicles.length);

  // ===========================================
  // CREATE BATTERIES
  // ===========================================
  const batteryPromises: Promise<any>[] = [];

  // Station 1 - District 1 (50 capacity)
  for (let i = 1; i <= 15; i++) {
    const status = i <= 8 ? "full" : i <= 12 ? "charging" : "maintenance";
    const health_percentage =
      status === "full"
        ? Math.random() * 5 + 95
        : status === "charging"
          ? Math.random() * 10 + 85
          : Math.random() * 15 + 70;
    const cycle_count = Math.floor(Math.random() * 120) + 60;

    batteryPromises.push(
      prisma.battery.create({
        data: {
          battery_code: `BAT-D1-${i.toString().padStart(3, "0")}`,
          station_id: stations[0].station_id,
          model:
            i <= 5
              ? "VinFast VF8 Battery"
              : i <= 10
                ? "Tesla Model 3 Battery"
                : "BYD Atto 3 Battery",
          capacity_kwh: i <= 5 ? 87.7 : i <= 10 ? 75 : 60.48,
          voltage: i <= 5 ? 400 : i <= 10 ? 350 : 400,
          current_charge: Math.floor(Math.random() * 40) + 60, // 60-100%
          status,
          last_charged_at: new Date(
            Date.now() - Math.random() * 24 * 60 * 60 * 1000
          ),
          health_percentage,
          cycle_count,
        },
      })
    );
  }

  // Station 2 - District 7 (40 capacity)
  for (let i = 1; i <= 12; i++) {
    const status = i <= 6 ? "full" : i <= 10 ? "charging" : "in_use";
    const health_percentage =
      status === "full"
        ? Math.random() * 5 + 95
        : status === "charging"
          ? Math.random() * 10 + 85
          : Math.random() * 15 + 65;
    const cycle_count = Math.floor(Math.random() * 140) + 80;

    batteryPromises.push(
      prisma.battery.create({
        data: {
          battery_code: `BAT-D7-${i.toString().padStart(3, "0")}`,
          station_id: stations[1].station_id,
          model:
            i <= 4
              ? "VinFast VF8 Battery"
              : i <= 8
                ? "BYD Atto 3 Battery"
                : "Hyundai IONIQ 5 Battery",
          capacity_kwh: i <= 4 ? 87.7 : i <= 8 ? 60.48 : 72.6,
          voltage: i <= 4 ? 400 : i <= 8 ? 400 : 400,
          current_charge: Math.floor(Math.random() * 30) + 70, // 70-100%
          status,
          last_charged_at: new Date(
            Date.now() - Math.random() * 12 * 60 * 60 * 1000
          ),
          health_percentage,
          cycle_count,
        },
      })
    );
  }

  // Station 3 - Thu Duc (60 capacity)
  for (let i = 1; i <= 18; i++) {
    const status = i <= 10 ? "full" : i <= 15 ? "charging" : "maintenance";
    const health_percentage =
      status === "full"
        ? Math.random() * 5 + 96
        : status === "charging"
          ? Math.random() * 8 + 88
          : Math.random() * 20 + 60;
    const cycle_count = Math.floor(Math.random() * 160) + 90;

    batteryPromises.push(
      prisma.battery.create({
        data: {
          battery_code: `BAT-TD-${i.toString().padStart(3, "0")}`,
          station_id: stations[2].station_id,
          model:
            i <= 6
              ? "Tesla Model 3 Battery"
              : i <= 12
                ? "VinFast VF8 Battery"
                : i <= 15
                  ? "BYD Atto 3 Battery"
                  : "BMW iX3 Battery",
          capacity_kwh: i <= 6 ? 75 : i <= 12 ? 87.7 : i <= 15 ? 60.48 : 80,
          voltage: i <= 6 ? 350 : i <= 12 ? 400 : i <= 15 ? 400 : 400,
          current_charge: Math.floor(Math.random() * 25) + 75, // 75-100%
          status,
          last_charged_at: new Date(
            Date.now() - Math.random() * 6 * 60 * 60 * 1000
          ),
          health_percentage,
          cycle_count,
        },
      })
    );
  }

  const createdBatteries = await Promise.all(batteryPromises);
  console.log("✅ Created batteries:", createdBatteries.length);

  // ===========================================
  // CREATE SERVICE PACKAGES
  // ===========================================
  const packageDefinitions = [
    {
      name: "75kWh Flex Monthly",
      description: "Không giới hạn đổi pin 75kWh trong 30 ngày",
      battery_capacity_kwh: 75,
      duration_days: 30,
      price: 590000,
      billing_cycle: "monthly" as const,
      benefits: [
        "Ưu tiên đặt lịch tại giờ cao điểm",
        "Miễn phí đổi pin tiêu chuẩn 75kWh",
        "Giảm 10% phụ phí đổi pin nhanh",
      ],
    },
    {
      name: "75kWh Flex Annual",
      description: "Tiết kiệm 2 tháng phí khi trả trước 1 năm",
      battery_capacity_kwh: 75,
      duration_days: 365,
      price: 5900000,
      billing_cycle: "yearly" as const,
      benefits: [
        "Bao gồm toàn bộ quyền lợi gói tháng",
        "Tặng kèm 2 lượt vệ sinh pin tại trạm",
        "Ưu đãi 5% khi mua phụ kiện",
      ],
    },
    {
      name: "100kWh Pro Monthly",
      description: "Gói cho xe dung lượng lớn với quyền lợi VIP",
      battery_capacity_kwh: 100,
      duration_days: 30,
      price: 830000,
      billing_cycle: "monthly" as const,
      benefits: [
        "Không giới hạn đổi pin 100kWh",
        "Ưu tiên xử lý tại quầy VIP",
        "Miễn phí 1 lần hỗ trợ cứu hộ/năm",
      ],
    },
    {
      name: "100kWh Pro Annual",
      description: "Dành cho fleet cao cấp – bao trọn năm",
      battery_capacity_kwh: 100,
      duration_days: 365,
      price: 8300000,
      billing_cycle: "yearly" as const,
      benefits: [
        "Bao gồm toàn bộ quyền lợi gói tháng",
        "Hỗ trợ kỹ thuật định kỳ 6 tháng/lần",
        "Ưu đãi 7% phí đổi pin tại trạm đối tác",
      ],
    },
  ];

  const servicePackages = await Promise.all(
    packageDefinitions.map((pkg) =>
      prisma.servicePackage.create({
        data: {
          name: pkg.name,
          description: pkg.description,
          battery_capacity_kwh: pkg.battery_capacity_kwh,
          duration_days: pkg.duration_days,
          price: pkg.price,
          billing_cycle: pkg.billing_cycle,
          benefits: pkg.benefits,
          swap_limit: null,
          battery_models: Prisma.JsonNull,
          metadata: {
            currency: "VND",
            createdBy: "seed",
          },
          is_active: true,
        },
      })
    )
  );
  console.log("✅ Created service packages:", servicePackages.length);

  // ===========================================
  // CREATE USER SUBSCRIPTIONS
  // ===========================================
  const subscriptions = await Promise.all([
    prisma.userSubscription.create({
      data: {
        user_id: drivers[0].user_id,
        package_id: servicePackages[0].package_id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        remaining_swaps: null,
        status: "active",
        auto_renew: true,
        metadata: {
          payment_method: "wallet",
          price_paid: packageDefinitions[0].price,
        },
      },
    }),
    prisma.userSubscription.create({
      data: {
        user_id: drivers[1].user_id,
        package_id: servicePackages[1].package_id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        remaining_swaps: null,
        status: "active",
        auto_renew: false,
        metadata: {
          payment_method: "vnpay",
          price_paid: packageDefinitions[1].price,
        },
      },
    }),
    prisma.userSubscription.create({
      data: {
        user_id: drivers[2].user_id,
        package_id: servicePackages[2].package_id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        remaining_swaps: null,
        status: "active",
        auto_renew: false,
        metadata: {
          payment_method: "wallet",
          price_paid: packageDefinitions[2].price,
        },
      },
    }),
  ]);
  console.log("✅ Created user subscriptions:", subscriptions.length);

  // ===========================================
  // CREATE BOOKINGS
  // ===========================================
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        booking_code: "BSS20250120001",
        user_id: drivers[0].user_id,
        vehicle_id: vehicles[0].vehicle_id,
        station_id: stations[0].station_id,
        battery_model: "VinFast VF8 Battery",
        scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: "pending",
      },
    }),
    prisma.booking.create({
      data: {
        booking_code: "BSS20250120002",
        user_id: drivers[1].user_id,
        vehicle_id: vehicles[1].vehicle_id,
        station_id: stations[0].station_id,
        battery_model: "Tesla Model 3 Battery",
        scheduled_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
        status: "confirmed",
        checked_in_at: new Date(Date.now() + 3.5 * 60 * 60 * 1000),
        checked_in_by_staff_id: staffs[0].user_id,
      },
    }),
    prisma.booking.create({
      data: {
        booking_code: "BSS20250120003",
        user_id: drivers[2].user_id,
        vehicle_id: vehicles[2].vehicle_id,
        station_id: stations[1].station_id,
        battery_model: "BYD Atto 3 Battery",
        scheduled_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: "completed",
        checked_in_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        checked_in_by_staff_id: staffs[2].user_id,
      },
    }),
    prisma.booking.create({
      data: {
        booking_code: "BSS20250120004",
        user_id: drivers[3].user_id,
        vehicle_id: vehicles[3].vehicle_id,
        station_id: stations[2].station_id,
        battery_model: "BMW iX3 Battery",
        scheduled_at: new Date(Date.now() + 6 * 60 * 60 * 1000),
        status: "pending",
      },
    }),
    prisma.booking.create({
      data: {
        booking_code: "BSS20250120005",
        user_id: drivers[4].user_id,
        vehicle_id: vehicles[4].vehicle_id,
        station_id: stations[1].station_id,
        battery_model: "Hyundai IONIQ 5 Battery",
        scheduled_at: new Date(Date.now() - 1 * 60 * 60 * 1000),
        status: "cancelled",
      },
    }),
  ]);
  console.log("✅ Created bookings:", bookings.length);

  // ===========================================
  // CREATE TRANSACTIONS
  // ===========================================
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        transaction_code: "TXN20250120001",
        booking_id: bookings[2].booking_id,
        user_id: drivers[2].user_id,
        vehicle_id: vehicles[2].vehicle_id,
        station_id: stations[1].station_id,
        old_battery_id:
          (
            await prisma.battery.findFirst({
              where: { station_id: stations[1].station_id, status: "in_use" },
            })
          )?.battery_id || createdBatteries[15].battery_id,
        new_battery_id:
          (
            await prisma.battery.findFirst({
              where: { station_id: stations[1].station_id, status: "full" },
            })
          )?.battery_id || createdBatteries[16].battery_id,
        staff_id: staffs[2].user_id,
        swap_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        swap_started_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        swap_completed_at: new Date(Date.now() - 1.4 * 60 * 60 * 1000),
        swap_duration_minutes: 6,
        payment_status: "completed",
        amount: 150000,
        notes: "Smooth battery swap process",
      },
    }),
  ]);
  console.log("✅ Created transactions:", transactions.length);

  // ===========================================
  // CREATE PAYMENTS
  // ===========================================
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        transaction_id: transactions[0].transaction_id,
        user_id: drivers[2].user_id,
        amount: 150000,
        payment_method: "vnpay",
        payment_status: "completed",
        payment_gateway_ref: "VNPAY20250120001",
        paid_at: new Date(Date.now() - 1.4 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        subscription_id: subscriptions[0].subscription_id,
        user_id: drivers[0].user_id,
        amount: 500000,
        payment_method: "momo",
        payment_status: "completed",
        payment_gateway_ref: "MOMO20250120001",
        paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        subscription_id: subscriptions[1].subscription_id,
        user_id: drivers[1].user_id,
        amount: 800000,
        payment_method: "credit_card",
        payment_status: "completed",
        payment_gateway_ref: "CC20250120001",
        paid_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log("✅ Created payments:", payments.length);

  // ===========================================
  // CREATE SUPPORT TICKETS
  // ===========================================
  const supportTickets = await Promise.all([
    prisma.supportTicket.create({
      data: {
        ticket_number: "TKT20250120001",
        user_id: drivers[0].user_id,
        category: "battery_issue",
        subject: "Battery not charging properly",
        description:
          "My vehicle battery is not charging to 100% even after leaving it overnight.",
        priority: "medium",
        status: "open",
      },
    }),
    prisma.supportTicket.create({
      data: {
        ticket_number: "TKT20250120002",
        user_id: drivers[1].user_id,
        category: "station_issue",
        subject: "Station machine not working",
        description:
          "The battery swap machine at District 1 station is showing error messages.",
        priority: "high",
        status: "in_progress",
        assigned_to_staff_id: staffs[0].user_id,
      },
    }),
    prisma.supportTicket.create({
      data: {
        ticket_number: "TKT20250120003",
        user_id: drivers[2].user_id,
        category: "payment_issue",
        subject: "Payment not processed",
        description:
          "I was charged twice for the same battery swap transaction.",
        priority: "urgent",
        status: "resolved",
        assigned_to_staff_id: staffs[1].user_id,
        resolved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.supportTicket.create({
      data: {
        ticket_number: "TKT20250120004",
        user_id: drivers[3].user_id,
        category: "service_complaint",
        subject: "Poor customer service",
        description: "Staff at Thu Duc station was not helpful and rude.",
        priority: "medium",
        status: "open",
      },
    }),
  ]);
  console.log("✅ Created support tickets:", supportTickets.length);

  // ===========================================
  // CREATE TICKET REPLIES
  // ===========================================
  const ticketReplies = await Promise.all([
    prisma.ticketReply.create({
      data: {
        ticket_id: supportTickets[1].ticket_id,
        user_id: staffs[0].user_id,
        message:
          "Thank you for reporting this issue. We have identified the problem and are working on a fix. The machine should be operational within 2 hours.",
        is_staff: true,
      },
    }),
    prisma.ticketReply.create({
      data: {
        ticket_id: supportTickets[1].ticket_id,
        user_id: drivers[1].user_id,
        message: "Thank you for the quick response. I will check back later.",
        is_staff: false,
      },
    }),
    prisma.ticketReply.create({
      data: {
        ticket_id: supportTickets[2].ticket_id,
        user_id: staffs[1].user_id,
        message:
          "We have investigated your payment issue and found a duplicate charge. A refund of 150,000 VND has been processed to your account. The refund should appear within 3-5 business days.",
        is_staff: true,
      },
    }),
  ]);
  console.log("✅ Created ticket replies:", ticketReplies.length);

  // ===========================================
  // CREATE STATION RATINGS
  // ===========================================
  const stationRatings = await Promise.all([
    prisma.stationRating.create({
      data: {
        user_id: drivers[2].user_id,
        station_id: stations[1].station_id,
        transaction_id: transactions[0].transaction_id,
        rating: 5,
        comment:
          "Excellent service! Fast and efficient battery swap. Staff was very helpful.",
      },
    }),
  ]);
  console.log("✅ Created station ratings:", stationRatings.length);

  // ===========================================
  // CREATE BATTERY TRANSFER LOGS
  // ===========================================
  const batteryTransferLogs = await Promise.all([
    prisma.batteryTransferLog.create({
      data: {
        battery_id: createdBatteries[0].battery_id,
        from_station_id: stations[0].station_id,
        to_station_id: stations[1].station_id,
        transfer_reason: "Inventory rebalancing",
        transferred_by: admins[0].user_id,
        notes: "Moving battery to balance inventory between stations",
      },
    }),
    prisma.batteryTransferLog.create({
      data: {
        battery_id: createdBatteries[15].battery_id,
        from_station_id: stations[1].station_id,
        to_station_id: stations[2].station_id,
        transfer_reason: "Maintenance",
        transferred_by: admins[1].user_id,
        notes: "Battery sent for routine maintenance check",
      },
    }),
  ]);
  console.log("✅ Created battery transfer logs:", batteryTransferLogs.length);

  console.log("🎉 Comprehensive database seeding completed successfully!");
  console.log("\n📊 Final Summary:");
  console.log(
    `- Users: ${admins.length + staffs.length + drivers.length} (${admins.length} Admin, ${staffs.length} Staff, ${drivers.length} Driver)`
  );
  console.log(`- Stations: ${stations.length}`);
  console.log(`- Vehicles: ${vehicles.length}`);
  console.log(`- Batteries: ${createdBatteries.length}`);
  console.log(`- Service Packages: ${servicePackages.length}`);
  console.log(`- Subscriptions: ${subscriptions.length}`);
  console.log(`- Bookings: ${bookings.length}`);
  console.log(`- Transactions: ${transactions.length}`);
  console.log(`- Payments: ${payments.length}`);
  console.log(`- Support Tickets: ${supportTickets.length}`);
  console.log(`- Ticket Replies: ${ticketReplies.length}`);
  console.log(`- Station Ratings: ${stationRatings.length}`);
  console.log(`- Battery Transfer Logs: ${batteryTransferLogs.length}`);
  console.log("\n🚀 Database is now ready for comprehensive testing!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
