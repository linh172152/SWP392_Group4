import {
  PrismaClient,
  Prisma,
  PaymentStatus,
  BatteryStatus,
} from "@prisma/client";
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
    console.log(
      "⚠️  Production environment detected. Seed skipped for safety."
    );
    console.log("   To seed in production, set FORCE_SEED=true");
    console.log(
      `   Current data: ${existingUsersCount} users, ${existingStationsCount} stations`
    );
    return;
  }

  // If database already has data, skip seeding unless FORCE_SEED=true
  if (!forceSeed && (existingUsersCount > 0 || existingStationsCount > 0)) {
    console.log(
      "⚠️  Database already contains data. Seed skipped to prevent data loss."
    );
    console.log(
      `   Current data: ${existingUsersCount} users, ${existingStationsCount} stations`
    );
    console.log("   To force seed, set FORCE_SEED=true");
    return;
  }

  console.log("🌱 Starting comprehensive database seeding...");

  if (forceSeed) {
    console.log("🧹 Clearing existing data (FORCE_SEED=true)...");
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "battery_history",
        "transactions",
        "payments",
        "bookings",
        "staff_schedules",
        "vehicles",
        "user_subscriptions",
        "service_packages",
        "batteries",
        "station_ratings",
        "support_tickets",
        "ticket_replies",
        "battery_transfer_logs",
        "notifications",
        "wallets",
        "topup_packages",
        "stations",
        "users"
      RESTART IDENTITY CASCADE;
    `);
  }

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
        supported_models: ["Tesla Model 3", "VinFast VF8"],
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
        supported_models: ["VinFast VF8", "Tesla Model 3"],
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
        supported_models: ["Tesla Model 3", "VinFast VF8"],
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
        supported_models: ["VinFast VF8", "Tesla Model 3"],
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
  // CREATE STAFF SCHEDULES (demo data)
  // ===========================================
  const schedulePromises: Promise<any>[] = [];
  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  staffs.forEach((staff, index) => {
    if (!staff) return;

    const baseStationId = staff.station_id ?? stations[0]?.station_id ?? null;
    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
      const shiftDate = new Date(
        startOfToday.getTime() + dayOffset * 24 * 60 * 60 * 1000
      );
      const shiftStart = new Date(shiftDate);
      shiftStart.setUTCHours(7 + (index % 2) * 4, 0, 0, 0); // 07:00 or 11:00 UTC
      const shiftEnd = new Date(shiftStart);
      shiftEnd.setUTCHours(shiftStart.getUTCHours() + 8, 0, 0, 0);

      schedulePromises.push(
        prisma.staffSchedule.create({
          data: {
            staff_id: staff.user_id,
            station_id: baseStationId,
            shift_date: shiftDate,
            shift_start: shiftStart,
            shift_end: shiftEnd,
            status: "scheduled",
            notes: "Demo ca trực",
          },
        })
      );
    }
  });

  if (schedulePromises.length > 0) {
    await Promise.all(schedulePromises);
    console.log("✅ Created staff schedules:", schedulePromises.length);
  }

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
  // CREATE WALLETS FOR DRIVERS
  // ===========================================
  const wallets = await Promise.all(
    drivers.map((driver) =>
      prisma.wallet.create({
        data: {
          user_id: driver.user_id,
          balance: new Prisma.Decimal(0),
        },
      })
    )
  );
  console.log("✅ Created wallets:", wallets.length);

  // ===========================================
  // CREATE VEHICLES
  // ===========================================
  const vehicleDefinitions = [
    {
      user: drivers[0],
      license_plate: "51A-12345",
      make: "VinFast",
      model: "VF8",
      battery_model: "VinFast VF8 Battery",
      year: 2023,
    },
    {
      user: drivers[1],
      license_plate: "51B-67890",
      make: "Tesla",
      model: "Model 3",
      battery_model: "Tesla Model 3 Battery",
      year: 2022,
    },
    {
      user: drivers[2],
      license_plate: "51C-11111",
      make: "VinFast",
      model: "VF8 Plus",
      battery_model: "VinFast VF8 Battery",
      year: 2023,
    },
    {
      user: drivers[3],
      license_plate: "51D-22222",
      make: "Tesla",
      model: "Model 3 Performance",
      battery_model: "Tesla Model 3 Battery",
      year: 2023,
    },
    {
      user: drivers[4],
      license_plate: "51E-33333",
      make: "VinFast",
      model: "VF8 Eco",
      battery_model: "VinFast VF8 Battery",
      year: 2024,
    },
    {
      user: drivers[5],
      license_plate: "51F-44444",
      make: "Tesla",
      model: "Model 3 Long Range",
      battery_model: "Tesla Model 3 Battery",
      year: 2024,
    },
  ];

  const vehicles = await Promise.all(
    vehicleDefinitions.map((definition) =>
      prisma.vehicle.create({
        data: {
          user_id: definition.user.user_id,
          license_plate: definition.license_plate,
          vehicle_type: "car",
          make: definition.make,
          model: definition.model,
          year: definition.year,
          battery_model: definition.battery_model,
        },
      })
    )
  );
  console.log("✅ Created vehicles:", vehicles.length);

  // ===========================================
  // CREATE BATTERIES
  // ===========================================
  const batteryPromises: Promise<any>[] = [];

  // Station 1 - District 1 (50 capacity)
  for (let i = 1; i <= 15; i++) {
    const status = i <= 8 ? "full" : i <= 12 ? "charging" : "maintenance";
    const currentCharge =
      status === "full"
        ? 100
        : status === "charging"
          ? Math.floor(Math.random() * 25) + 60 // 60-84%
          : Math.floor(Math.random() * 30) + 40; // 40-69%
    const health_percentage =
      status === "full"
        ? Math.random() * 5 + 95
        : status === "charging"
          ? Math.random() * 10 + 85
          : Math.random() * 15 + 70;
    const cycle_count = Math.floor(Math.random() * 120) + 60;

    const model = i % 2 === 1 ? "VinFast VF8 Battery" : "Tesla Model 3 Battery";
    const capacity_kwh = model === "VinFast VF8 Battery" ? 87.7 : 75;
    const voltage = model === "VinFast VF8 Battery" ? 400 : 350;

    batteryPromises.push(
      prisma.battery.create({
        data: {
          battery_code: `BAT-D1-${i.toString().padStart(3, "0")}`,
          station_id: stations[0].station_id,
          model,
          capacity_kwh,
          voltage,
          current_charge: currentCharge,
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
    const currentCharge =
      status === "full"
        ? 100
        : status === "charging"
          ? Math.floor(Math.random() * 25) + 55 // 55-79%
          : Math.floor(Math.random() * 25) + 20; // 20-44%
    const health_percentage =
      status === "full"
        ? Math.random() * 5 + 95
        : status === "charging"
          ? Math.random() * 10 + 85
          : Math.random() * 15 + 65;
    const cycle_count = Math.floor(Math.random() * 140) + 80;

    const model = i % 2 === 1 ? "Tesla Model 3 Battery" : "VinFast VF8 Battery";
    const capacity_kwh = model === "VinFast VF8 Battery" ? 87.7 : 75;
    const voltage = model === "VinFast VF8 Battery" ? 400 : 350;

    batteryPromises.push(
      prisma.battery.create({
        data: {
          battery_code: `BAT-D7-${i.toString().padStart(3, "0")}`,
          station_id: stations[1].station_id,
          model,
          capacity_kwh,
          voltage,
          current_charge: currentCharge,
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
    const currentCharge =
      status === "full"
        ? 100
        : status === "charging"
          ? Math.floor(Math.random() * 25) + 65 // 65-89%
          : Math.floor(Math.random() * 30) + 35; // 35-64%
    const health_percentage =
      status === "full"
        ? Math.random() * 5 + 96
        : status === "charging"
          ? Math.random() * 8 + 88
          : Math.random() * 20 + 60;
    const cycle_count = Math.floor(Math.random() * 160) + 90;

    const model = i % 2 === 0 ? "Tesla Model 3 Battery" : "VinFast VF8 Battery";
    const capacity_kwh = model === "VinFast VF8 Battery" ? 87.7 : 75;
    const voltage = model === "VinFast VF8 Battery" ? 400 : 350;

    batteryPromises.push(
      prisma.battery.create({
        data: {
          battery_code: `BAT-TD-${i.toString().padStart(3, "0")}`,
          station_id: stations[2].station_id,
          model,
          capacity_kwh,
          voltage,
          current_charge: currentCharge,
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
      swapLimit: 12,
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
      swapLimit: 150,
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
      swapLimit: 16,
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
      swapLimit: 180,
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
          swap_limit: pkg.swapLimit,
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
  // CREATE TOP-UP PACKAGES
  // ===========================================
  const topupPackageDefinitions = [
    {
      name: "Bronze Boost 200K",
      description:
        "Nạp nhanh 200.000 VND và nhận thêm 10.000 VND để sử dụng cho các lần đổi pin.",
      topupAmount: 200000,
      bonusAmount: 10000,
      actualAmount: 210000,
    },
    {
      name: "Silver Saver 400K",
      description:
        "Gói tiết kiệm cho tài xế thường xuyên: nhận thêm 40.000 VND khi nạp 400.000 VND.",
      topupAmount: 400000,
      bonusAmount: 40000,
      actualAmount: 440000,
    },
    {
      name: "Quick Charge 100K",
      description:
        "Gói nhỏ cho chuyến đi ngắn: nạp 100.000 VND kèm 5.000 VND khuyến mãi.",
      topupAmount: 100000,
      bonusAmount: 5000,
      actualAmount: 105000,
    },
  ];

  const topupPackages = await Promise.all(
    topupPackageDefinitions.map((pkg) =>
      prisma.topUpPackage.create({
        data: {
          name: pkg.name,
          description: pkg.description,
          topup_amount: new Prisma.Decimal(pkg.topupAmount),
          bonus_amount: new Prisma.Decimal(pkg.bonusAmount),
          actual_amount: new Prisma.Decimal(pkg.actualAmount),
          is_active: true,
        },
      })
    )
  );
  console.log("✅ Created top-up packages:", topupPackages.length);

  // ===========================================
  // CREATE USER SUBSCRIPTIONS
  // ===========================================
  const userSubscriptions = await Promise.all([
    prisma.userSubscription.create({
      data: {
        user_id: drivers[0].user_id,
        package_id: servicePackages[0].package_id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        remaining_swaps: packageDefinitions[0].swapLimit,
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
        remaining_swaps: packageDefinitions[1].swapLimit,
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
        remaining_swaps: packageDefinitions[2].swapLimit,
        status: "active",
        auto_renew: false,
        metadata: {
          payment_method: "wallet",
          price_paid: packageDefinitions[2].price,
        },
      },
    }),
  ]);
  console.log("✅ Created user subscriptions:", userSubscriptions.length);

  // ===========================================
  // CREATE DEMO BOOKINGS WITH HOLD DATA
  // ===========================================
  const batteriesForHolds = await prisma.battery.findMany({
    take: 5,
    orderBy: { created_at: "asc" },
  });

  if (batteriesForHolds.length < 5) {
    throw new Error(
      "Seed requires at least 5 batteries to demonstrate hold flow"
    );
  }

  const nowTime = new Date();
  const twoHoursLater = new Date(nowTime.getTime() + 2 * 60 * 60 * 1000);
  const fourHoursLater = new Date(nowTime.getTime() + 4 * 60 * 60 * 1000);
  const sixHoursLater = new Date(nowTime.getTime() + 6 * 60 * 60 * 1000);

  // ===========================================
  // CREATE WALLET TOP-UPS
  // ===========================================
  const walletTopups = await Promise.all([
    prisma.payment.create({
      data: {
        user_id: drivers[0].user_id,
        topup_package_id: topupPackages[0].package_id,
        amount: new Prisma.Decimal(topupPackageDefinitions[0].topupAmount),
        payment_method: "vnpay",
        payment_status: "completed" as PaymentStatus,
        payment_type: "TOPUP",
        metadata: {
          bonus_amount: topupPackageDefinitions[0].bonusAmount,
          actual_wallet_credit: topupPackageDefinitions[0].actualAmount,
        },
        paid_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        user_id: drivers[1].user_id,
        topup_package_id: topupPackages[1].package_id,
        amount: new Prisma.Decimal(topupPackageDefinitions[1].topupAmount),
        payment_method: "vnpay",
        payment_status: "completed" as PaymentStatus,
        payment_type: "TOPUP",
        metadata: {
          bonus_amount: topupPackageDefinitions[1].bonusAmount,
          actual_wallet_credit: topupPackageDefinitions[1].actualAmount,
        },
        paid_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        user_id: drivers[4].user_id,
        topup_package_id: topupPackages[2].package_id,
        amount: new Prisma.Decimal(topupPackageDefinitions[2].topupAmount),
        payment_method: "vnpay",
        payment_status: "completed" as PaymentStatus,
        payment_type: "TOPUP",
        metadata: {
          bonus_amount: topupPackageDefinitions[2].bonusAmount,
          actual_wallet_credit: topupPackageDefinitions[2].actualAmount,
        },
        paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log("✅ Created top-up payments:", walletTopups.length);

  await prisma.wallet.update({
    where: { user_id: drivers[0].user_id },
    data: { balance: new Prisma.Decimal(210000) },
  });
  await prisma.wallet.update({
    where: { user_id: drivers[1].user_id },
    data: { balance: new Prisma.Decimal(440000) },
  });
  await prisma.wallet.update({
    where: { user_id: drivers[2].user_id },
    data: { balance: new Prisma.Decimal(0) },
  });
  await prisma.wallet.update({
    where: { user_id: drivers[3].user_id },
    data: { balance: new Prisma.Decimal(0) },
  });
  await prisma.wallet.update({
    where: { user_id: drivers[4].user_id },
    data: { balance: new Prisma.Decimal(105000) },
  });
  await prisma.wallet.update({
    where: { user_id: drivers[5].user_id },
    data: { balance: new Prisma.Decimal(0) },
  });

  const refundPayment = await prisma.payment.create({
    data: {
      user_id: drivers[2].user_id,
      amount: new Prisma.Decimal(150000),
      payment_method: "wallet",
      payment_status: "completed" as PaymentStatus,
      payment_type: "REFUND",
      metadata: {
        reason: "duplicate_charge_resolution",
        related_ticket_number: "TKT20250120003",
      },
      paid_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });
  await prisma.wallet.update({
    where: { user_id: drivers[2].user_id },
    data: { balance: new Prisma.Decimal(150000) },
  });

  const holdPayment = await prisma.payment.create({
    data: {
      user_id: drivers[1].user_id,
      amount: new Prisma.Decimal(250000),
      payment_method: "wallet",
      payment_status: "reserved" as PaymentStatus,
      payment_type: "SWAP",
      metadata: {
        type: "booking_hold",
        note: "Demo hold payment for driver 2",
      },
      paid_at: new Date(),
    },
  });

  await prisma.wallet.update({
    where: { user_id: drivers[1].user_id },
    data: { balance: new Prisma.Decimal(190000) },
  });

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        booking_code: "BSS20250120001",
        user_id: drivers[0].user_id,
        vehicle_id: vehicles[0].vehicle_id,
        station_id: stations[0].station_id,
        battery_model: "VinFast VF8 Battery",
        scheduled_at: twoHoursLater,
        status: "pending",
        notes: "Demo booking with subscription hold",
        locked_battery_id: batteriesForHolds[0].battery_id,
        locked_battery_previous_status: batteriesForHolds[0]
          .status as BatteryStatus,
        locked_subscription_id: userSubscriptions[0]?.subscription_id ?? null,
        locked_swap_count: 1,
        locked_wallet_amount: new Prisma.Decimal(0),
        locked_wallet_payment_id: null,
        hold_expires_at: new Date(twoHoursLater.getTime() + 15 * 60 * 1000),
        use_subscription: true,
      } as any,
      include: { station: true, vehicle: true },
    }),
    prisma.booking.create({
      data: {
        booking_code: "BSS20250120002",
        user_id: drivers[1].user_id,
        vehicle_id: vehicles[1].vehicle_id,
        station_id: stations[1].station_id,
        battery_model: "Tesla Model 3 Battery",
        scheduled_at: fourHoursLater,
        status: "pending",
        notes: "Demo booking with wallet hold",
        locked_battery_id: batteriesForHolds[1].battery_id,
        locked_battery_previous_status: batteriesForHolds[1]
          .status as BatteryStatus,
        locked_subscription_id: null,
        locked_swap_count: 0,
        locked_wallet_amount: holdPayment.amount,
        locked_wallet_payment_id: holdPayment.payment_id,
        hold_expires_at: new Date(fourHoursLater.getTime() + 15 * 60 * 1000),
        use_subscription: false,
      } as any,
      include: { station: true, vehicle: true },
    }),
    prisma.booking.create({
      data: {
        booking_code: "BSS20250120003",
        user_id: drivers[2].user_id,
        vehicle_id: vehicles[2].vehicle_id,
        station_id: stations[1].station_id,
        battery_model: "VinFast VF8 Battery",
        scheduled_at: new Date(nowTime.getTime() - 2 * 60 * 60 * 1000),
        status: "completed",
        notes: "Completed booking for Driver 3",
        use_subscription: false,
      },
      include: { station: true, vehicle: true },
    }),
    prisma.booking.create({
      data: {
        booking_code: "BSS20250120004",
        user_id: drivers[3].user_id,
        vehicle_id: vehicles[3].vehicle_id,
        station_id: stations[2].station_id,
        battery_model: "VinFast VF8 Battery",
        scheduled_at: new Date(nowTime.getTime() - 30 * 60 * 1000),
        status: "cancelled",
        notes: "Cancelled booking for Driver 4",
        use_subscription: false,
      },
      include: { station: true, vehicle: true },
    }),
    prisma.booking.create({
      data: {
        booking_code: "BSS20250120005",
        user_id: drivers[4].user_id,
        vehicle_id: vehicles[4].vehicle_id,
        station_id: stations[0].station_id,
        battery_model: "VinFast VF8 Battery",
        scheduled_at: sixHoursLater,
        status: "pending",
        notes: "Driver 5 scheduling for later",
        use_subscription: false,
      },
      include: { station: true, vehicle: true },
    }),
  ]);
  console.log("✅ Created bookings:", bookings.length);

  // Update batteries used for holds to reserved/in_use for demo consistency
  await prisma.battery.update({
    where: { battery_id: batteriesForHolds[0].battery_id },
    data: {
      status: "reserved" as BatteryStatus,
      station_id: stations[0].station_id,
    },
  });
  await prisma.battery.update({
    where: { battery_id: batteriesForHolds[1].battery_id },
    data: {
      status: "reserved" as BatteryStatus,
      station_id: stations[1].station_id,
    },
  });

  await (prisma as any).batteryHistory.createMany({
    data: [
      {
        battery_id: batteriesForHolds[0].battery_id,
        booking_id: bookings[0].booking_id,
        station_id: stations[0].station_id,
        actor_user_id: drivers[0].user_id,
        action: "reserved",
        notes: "Seed: Pin giữ cho booking subscription",
      },
      {
        battery_id: batteriesForHolds[1].battery_id,
        booking_id: bookings[1].booking_id,
        station_id: stations[1].station_id,
        actor_user_id: drivers[1].user_id,
        action: "reserved",
        notes: "Seed: Pin giữ kèm giữ tiền ví",
      },
      {
        battery_id: batteriesForHolds[0].battery_id,
        booking_id: bookings[0].booking_id,
        station_id: stations[0].station_id,
        actor_user_id: staffs[0]?.user_id ?? null,
        action: "issued",
        notes: "Seed: Staff giao pin giữ cho driver",
      },
      {
        battery_id: batteriesForHolds[1].battery_id,
        booking_id: bookings[1].booking_id,
        station_id: stations[1].station_id,
        actor_user_id: staffs[1]?.user_id ?? null,
        action: "released",
        notes: "Seed: Hủy booking nên trả pin về kho",
      },
      {
        battery_id: batteriesForHolds[2].battery_id,
        booking_id: bookings[2].booking_id,
        station_id: stations[1].station_id,
        actor_user_id: staffs[2]?.user_id ?? null,
        action: "returned",
        notes: "Seed: Hoàn tất đổi pin – pin cũ trả về",
      },
    ],
  });

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
  const swapAndSubscriptionPayments = await Promise.all([
    prisma.payment.create({
      data: {
        transaction_id: transactions[0].transaction_id,
        user_id: drivers[2].user_id,
        amount: 150000,
        payment_method: "vnpay",
        payment_status: "completed",
        payment_gateway_ref: "VNPAY20250120001",
        paid_at: new Date(Date.now() - 1.4 * 60 * 60 * 1000),
        payment_type: "SWAP",
      },
    }),
    prisma.payment.create({
      data: {
        subscription_id: userSubscriptions[0].subscription_id,
        user_id: drivers[0].user_id,
        amount: 500000,
        payment_method: "wallet",
        payment_status: "completed",
        payment_gateway_ref: "WALLET20250120001",
        paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        payment_type: "SUBSCRIPTION",
      },
    }),
    prisma.payment.create({
      data: {
        subscription_id: userSubscriptions[1].subscription_id,
        user_id: drivers[1].user_id,
        amount: 800000,
        payment_method: "wallet",
        payment_status: "completed",
        payment_gateway_ref: "WALLET20250120002",
        paid_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        payment_type: "SUBSCRIPTION",
      },
    }),
  ]);
  const allPayments = [
    holdPayment,
    ...walletTopups,
    refundPayment,
    ...swapAndSubscriptionPayments,
  ];
  console.log("✅ Created payments:", allPayments.length);

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

  // ===========================================
  // CREATE NOTIFICATIONS
  // ===========================================
  const notificationSeedData = [
    {
      user_id: drivers[0].user_id,
      type: "booking",
      title: "Giữ pin thành công",
      message: `Đơn ${bookings[0].booking_code} đã giữ pin thành công tại trạm ${bookings[0].station?.name ?? ""}.`,
      data: {
        booking_id: bookings[0].booking_id,
        booking_code: bookings[0].booking_code,
        station_id: bookings[0].station_id,
      },
    },
    {
      user_id: drivers[1].user_id,
      type: "payment",
      title: "Đã giữ 250.000 VND cho đơn đổi pin",
      message: `Ví của bạn đã giữ 250.000 VND cho đơn ${bookings[1].booking_code}. Số dư khả dụng hiện tại là 190.000 VND.`,
      data: {
        booking_id: bookings[1].booking_id,
        booking_code: bookings[1].booking_code,
        payment_id: holdPayment.payment_id,
        reserved_amount: holdPayment.amount,
      },
    },
    {
      user_id: drivers[2].user_id,
      type: "payment",
      title: "Hoàn tiền 150.000 VND đã được xử lý",
      message:
        "Chúng tôi đã hoàn 150.000 VND vào ví do lỗi thanh toán trùng lặp. Vui lòng kiểm tra lịch sử giao dịch.",
      data: {
        payment_id: refundPayment.payment_id,
        amount: refundPayment.amount,
      },
    },
    {
      user_id: staffs[0].user_id,
      type: "staff_booking",
      title: "Tài xế sắp đến trạm",
      message: `Xe biển số ${bookings[0].vehicle?.license_plate ?? ""} sẽ đến đổi pin lúc ${bookings[0].scheduled_at.toISOString()}.`,
      data: {
        booking_id: bookings[0].booking_id,
        station_id: bookings[0].station_id,
        vehicle_id: bookings[0].vehicle_id,
      },
    },
    {
      user_id: drivers[4].user_id,
      type: "wallet",
      title: "Nạp ví thành công",
      message:
        "Bạn vừa nạp 100.000 VND và nhận thêm 5.000 VND khuyến mãi. Tổng số dư hiện tại: 105.000 VND.",
      data: {
        payment_id: walletTopups[2].payment_id,
        new_balance: "105000",
      },
    },
  ];

  const notificationsResult = await prisma.notification.createMany({
    data: notificationSeedData,
  });
  const notificationsCount = notificationsResult.count;
  console.log("✅ Created notifications:", notificationsCount);

  console.log("🎉 Comprehensive database seeding completed successfully!");
  console.log("\n📊 Final Summary:");
  console.log(
    `- Users: ${admins.length + staffs.length + drivers.length} (${admins.length} Admin, ${staffs.length} Staff, ${drivers.length} Driver)`
  );
  console.log(`- Stations: ${stations.length}`);
  console.log(`- Vehicles: ${vehicles.length}`);
  console.log(`- Batteries: ${createdBatteries.length}`);
  console.log(`- Service Packages: ${servicePackages.length}`);
  console.log(`- Top-up Packages: ${topupPackages.length}`);
  console.log(`- Wallets: ${wallets.length}`);
  console.log(`- Subscriptions: ${userSubscriptions.length}`);
  console.log(`- Bookings: ${bookings.length}`);
  console.log(`- Transactions: ${transactions.length}`);
  console.log(`- Payments: ${allPayments.length}`);
  console.log(`- Support Tickets: ${supportTickets.length}`);
  console.log(`- Ticket Replies: ${ticketReplies.length}`);
  console.log(`- Station Ratings: ${stationRatings.length}`);
  console.log(`- Battery Transfer Logs: ${batteryTransferLogs.length}`);
  console.log(`- Notifications: ${notificationsCount}`);
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
