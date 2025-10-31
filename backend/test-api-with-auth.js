// Quick API Test with Authentication
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper to make HTTP request
function request(method, url, headers = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url, BASE_URL);
    const options = {
      method,
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, raw: body });
        } catch {
          resolve({ status: res.statusCode, data: body, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Colors for console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n🧪 Testing API Endpoints with Authentication...\n', 'blue');
  log('='.repeat(60), 'blue');

  // Test 1: Login as Admin
  log('\n1. Testing Admin Login...', 'yellow');
  const adminLogin = await request('POST', '/api/auth/login', {}, {
    email: 'admin@evbattery.com',
    password: 'admin123',
  });

  if (adminLogin.status === 200 && adminLogin.data.success && adminLogin.data.data.accessToken) {
    const adminToken = adminLogin.data.data.accessToken;
    log(`✅ Admin login: OK (Token: ${adminToken.substring(0, 20)}...)`, 'green');

    // Test Admin Endpoints
    log('\n--- Testing Admin Endpoints ---', 'yellow');

    // Admin Stations
    const adminStations = await request('GET', '/api/admin/stations', {
      Authorization: `Bearer ${adminToken}`,
    });
    log(
      `   GET /api/admin/stations: ${adminStations.status === 200 ? '✅ OK' : '❌ FAILED'} (${adminStations.status})`,
      adminStations.status === 200 ? 'green' : 'red'
    );

    // Admin Staff
    const adminStaff = await request('GET', '/api/admin/staff', {
      Authorization: `Bearer ${adminToken}`,
    });
    log(
      `   GET /api/admin/staff: ${adminStaff.status === 200 ? '✅ OK' : '❌ FAILED'} (${adminStaff.status})`,
      adminStaff.status === 200 ? 'green' : 'red'
    );

    // Admin Pricing
    const adminPricing = await request('GET', '/api/admin/pricing', {
      Authorization: `Bearer ${adminToken}`,
    });
    log(
      `   GET /api/admin/pricing: ${adminPricing.status === 200 ? '✅ OK' : '❌ FAILED'} (${adminPricing.status})`,
      adminPricing.status === 200 ? 'green' : 'red'
    );

    // Admin TopUp Packages
    const adminTopup = await request('GET', '/api/admin/topup-packages', {
      Authorization: `Bearer ${adminToken}`,
    });
    log(
      `   GET /api/admin/topup-packages: ${adminTopup.status === 200 ? '✅ OK' : '❌ FAILED'} (${adminTopup.status})`,
      adminTopup.status === 200 ? 'green' : 'red'
    );

    // Admin Dashboard
    const adminDashboard = await request('GET', '/api/admin/dashboard/stats', {
      Authorization: `Bearer ${adminToken}`,
    });
    log(
      `   GET /api/admin/dashboard/stats: ${adminDashboard.status === 200 ? '✅ OK' : '❌ FAILED'} (${adminDashboard.status})`,
      adminDashboard.status === 200 ? 'green' : 'red'
    );

    // Admin Users
    const adminUsers = await request('GET', '/api/admin/users', {
      Authorization: `Bearer ${adminToken}`,
    });
    log(
      `   GET /api/admin/users: ${adminUsers.status === 200 ? '✅ OK' : '❌ FAILED'} (${adminUsers.status})`,
      adminUsers.status === 200 ? 'green' : 'red'
    );
  } else {
    log(`❌ Admin login: FAILED (${adminLogin.status})`, 'red');
    if (adminLogin.data) {
      console.log(JSON.stringify(adminLogin.data, null, 2));
    }
  }

  // Test 2: Login as Driver
  log('\n\n2. Testing Driver Login...', 'yellow');
  const driverLogin = await request('POST', '/api/auth/login', {}, {
    email: 'driver1@evbattery.com',
    password: 'driver123',
  });

  if (driverLogin.status === 200 && driverLogin.data.success && driverLogin.data.data.accessToken) {
    const driverToken = driverLogin.data.data.accessToken;
    log(`✅ Driver login: OK (Token: ${driverToken.substring(0, 20)}...)`, 'green');

    // Test Driver Endpoints
    log('\n--- Testing Driver Endpoints ---', 'yellow');

    // Driver Wallet
    const driverWallet = await request('GET', '/api/driver/wallet/balance', {
      Authorization: `Bearer ${driverToken}`,
    });
    log(
      `   GET /api/driver/wallet/balance: ${driverWallet.status === 200 ? '✅ OK' : '❌ FAILED'} (${driverWallet.status})`,
      driverWallet.status === 200 ? 'green' : 'red'
    );

    // Driver Vehicles
    const driverVehicles = await request('GET', '/api/driver/vehicles', {
      Authorization: `Bearer ${driverToken}`,
    });
    log(
      `   GET /api/driver/vehicles: ${driverVehicles.status === 200 ? '✅ OK' : '❌ FAILED'} (${driverVehicles.status})`,
      driverVehicles.status === 200 ? 'green' : 'red'
    );

    // Driver Bookings
    const driverBookings = await request('GET', '/api/driver/bookings', {
      Authorization: `Bearer ${driverToken}`,
    });
    log(
      `   GET /api/driver/bookings: ${driverBookings.status === 200 ? '✅ OK' : '❌ FAILED'} (${driverBookings.status})`,
      driverBookings.status === 200 ? 'green' : 'red'
    );

    // Driver Notifications
    const driverNotifications = await request('GET', '/api/driver/notifications', {
      Authorization: `Bearer ${driverToken}`,
    });
    log(
      `   GET /api/driver/notifications: ${driverNotifications.status === 200 ? '✅ OK' : '❌ FAILED'} (${driverNotifications.status})`,
      driverNotifications.status === 200 ? 'green' : 'red'
    );

    // Driver Stations Nearby
    const driverStations = await request('GET', '/api/driver/stations/nearby?lat=10.762&lng=106.660&radius=10', {
      Authorization: `Bearer ${driverToken}`,
    });
    log(
      `   GET /api/driver/stations/nearby: ${driverStations.status === 200 ? '✅ OK' : '❌ FAILED'} (${driverStations.status})`,
      driverStations.status === 200 ? 'green' : 'red'
    );
  } else {
    log(`❌ Driver login: FAILED (${driverLogin.status})`, 'red');
    if (driverLogin.data) {
      console.log(JSON.stringify(driverLogin.data, null, 2));
    }
  }

  // Test 3: Login as Staff
  log('\n\n3. Testing Staff Login...', 'yellow');
  const staffLogin = await request('POST', '/api/auth/login', {}, {
    email: 'staff1@evbattery.com',
    password: 'staff123',
  });

  if (staffLogin.status === 200 && staffLogin.data.success && staffLogin.data.data.accessToken) {
    const staffToken = staffLogin.data.data.accessToken;
    log(`✅ Staff login: OK (Token: ${staffToken.substring(0, 20)}...)`, 'green');

    // Test Staff Endpoints
    log('\n--- Testing Staff Endpoints ---', 'yellow');

    // Staff Batteries
    const staffBatteries = await request('GET', '/api/staff/batteries', {
      Authorization: `Bearer ${staffToken}`,
    });
    log(
      `   GET /api/staff/batteries: ${staffBatteries.status === 200 ? '✅ OK' : '❌ FAILED'} (${staffBatteries.status})`,
      staffBatteries.status === 200 ? 'green' : 'red'
    );

    // Staff Bookings
    const staffBookings = await request('GET', '/api/staff/bookings', {
      Authorization: `Bearer ${staffToken}`,
    });
    log(
      `   GET /api/staff/bookings: ${staffBookings.status === 200 ? '✅ OK' : '❌ FAILED'} (${staffBookings.status})`,
      staffBookings.status === 200 ? 'green' : 'red'
    );
  } else {
    log(`❌ Staff login: FAILED (${staffLogin.status})`, 'red');
    if (staffLogin.data) {
      console.log(JSON.stringify(staffLogin.data, null, 2));
    }
  }

  // Test 4: Public Endpoints (no auth)
  log('\n\n4. Testing Public Endpoints (no auth)...', 'yellow');

  const publicStations = await request('GET', '/api/stations/public');
  log(
    `   GET /api/stations/public: ${publicStations.status === 200 ? '✅ OK' : '❌ FAILED'} (${publicStations.status})`,
    publicStations.status === 200 ? 'green' : 'red'
  );

  const healthCheck = await request('GET', '/health');
  log(
    `   GET /health: ${healthCheck.status === 200 ? '✅ OK' : '❌ FAILED'} (${healthCheck.status})`,
    healthCheck.status === 200 ? 'green' : 'red'
  );

  log('\n' + '='.repeat(60), 'blue');
  log('\n✅ API Test Complete!', 'green');
  log('\n📊 Summary:', 'blue');
  log('   - 401 responses = Correctly protected (need auth)', 'green');
  log('   - 200 responses = Endpoint working correctly', 'green');
  log('   - 400/422 responses = Validation working correctly', 'green');
  log('\n', 'reset');
}

main().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

