// Comprehensive API Test - Test ALL endpoints in the project
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test credentials from seed
const TEST_CREDENTIALS = {
  admin: { email: 'admin@evbattery.com', password: 'admin123' },
  driver: { email: 'driver1@evbattery.com', password: 'driver123' },
  staff: { email: 'staff1@evbattery.com', password: 'staff123' },
};

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
      timeout: 10000, // Increase timeout
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

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

async function login(role) {
  const creds = TEST_CREDENTIALS[role];
  const response = await request('POST', '/api/auth/login', {}, creds);
  if (response.status === 200 && response.data.success && response.data.data.accessToken) {
    return response.data.data.accessToken;
  }
  throw new Error(`Failed to login as ${role}: ${response.status}`);
}

async function testEndpoint(name, method, path, token = null, body = null, expectedStatus = [200, 201]) {
  results.total++;
  // Add small delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 100));
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await request(method, path, headers, body);
    
    const status = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const isSuccess = status.includes(response.status);
    
    if (isSuccess) {
      results.passed++;
      log(`  ✅ ${method} ${path} → ${response.status}`, 'green');
      return true;
    } else {
      results.failed++;
      results.errors.push(`${method} ${path}: Expected ${expectedStatus}, got ${response.status}`);
      log(`  ❌ ${method} ${path} → ${response.status} (expected ${expectedStatus})`, 'red');
      return false;
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`${method} ${path}: ${error.message}`);
    log(`  ❌ ${method} ${path} → ERROR: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🧪 COMPREHENSIVE API TEST - Testing ALL Endpoints\n', 'cyan');
  log('='.repeat(70), 'blue');

  // Step 1: Login and get tokens
  log('\n📝 Step 1: Authenticating...', 'yellow');
  let adminToken, driverToken, staffToken;

  try {
    adminToken = await login('admin');
    log('  ✅ Admin login successful', 'green');
  } catch (e) {
    log(`  ❌ Admin login failed: ${e.message}`, 'red');
    process.exit(1);
  }

  try {
    driverToken = await login('driver');
    log('  ✅ Driver login successful', 'green');
  } catch (e) {
    log(`  ❌ Driver login failed: ${e.message}`, 'red');
    process.exit(1);
  }

  try {
    staffToken = await login('staff');
    log('  ✅ Staff login successful', 'green');
  } catch (e) {
    log(`  ❌ Staff login failed: ${e.message}`, 'red');
    process.exit(1);
  }

  // Step 2: Test Public Endpoints (no auth)
  log('\n📝 Step 2: Testing Public Endpoints...', 'yellow');
  await testEndpoint('Health Check', 'GET', '/health', null, null, 200);
  await testEndpoint('Public Stations', 'GET', '/api/stations/public', null, null, 200);
  await testEndpoint('Public Stations Nearby', 'GET', '/api/stations/public/nearby?latitude=10.762&longitude=106.660&radius=10', null, null, 200);

  // Step 3: Test Auth Endpoints
  log('\n📝 Step 3: Testing Authentication Endpoints...', 'yellow');
  await testEndpoint('Auth Register (validation)', 'POST', '/api/auth/register', null, {}, [400, 422]);
  await testEndpoint('Auth Login (validation)', 'POST', '/api/auth/login', null, {}, [400, 422]);
  await testEndpoint('Get Profile (me)', 'GET', '/api/auth/me', driverToken, null, 200);
  await testEndpoint('Verify Token', 'GET', '/api/auth/verify', driverToken, null, 200);
  await testEndpoint('Update Profile', 'PUT', '/api/auth/profile', driverToken, { full_name: 'Test' }, 200);
  await testEndpoint('Change Password (validation)', 'PUT', '/api/auth/change-password', driverToken, {}, [400, 422]);

  // Step 4: Test Driver Endpoints
  log('\n📝 Step 4: Testing Driver Endpoints...', 'yellow');
  
  // Wallet
  await testEndpoint('Wallet Balance', 'GET', '/api/driver/wallet/balance', driverToken, null, 200);
  await testEndpoint('Wallet Transactions', 'GET', '/api/driver/wallet/transactions', driverToken, null, 200);
  await testEndpoint('Wallet TopUp (validation)', 'POST', '/api/driver/wallet/topup', driverToken, {}, [400, 422]);
  
  // Vehicles
  await testEndpoint('Driver Vehicles', 'GET', '/api/driver/vehicles', driverToken, null, 200);
  await testEndpoint('Driver Vehicles (POST - validation)', 'POST', '/api/driver/vehicles', driverToken, {}, [400, 422]);
  
  // Stations
  await testEndpoint('Driver Stations Nearby', 'GET', '/api/driver/stations/nearby?lat=10.762&lng=106.660&radius=10', driverToken, null, 200);
  await testEndpoint('Driver Stations Search', 'GET', '/api/driver/stations/search?query=test', driverToken, null, 200);
  
  // Bookings
  await testEndpoint('Driver Bookings', 'GET', '/api/driver/bookings', driverToken, null, 200);
  await testEndpoint('Driver Bookings (POST - validation)', 'POST', '/api/driver/bookings', driverToken, {}, [400, 422]);
  await testEndpoint('Driver Bookings Instant (validation)', 'POST', '/api/driver/bookings/instant', driverToken, {}, [400, 422]);
  
  // Notifications
  await testEndpoint('Driver Notifications', 'GET', '/api/driver/notifications', driverToken, null, 200);
  await testEndpoint('Driver Notifications Read All', 'PUT', '/api/driver/notifications/read-all', driverToken, null, 200);

  // Step 5: Test Staff Endpoints
  log('\n📝 Step 5: Testing Staff Endpoints...', 'yellow');
  
  // Batteries
  await testEndpoint('Staff Batteries', 'GET', '/api/staff/batteries', staffToken, null, 200);
  await testEndpoint('Staff Batteries (POST - validation)', 'POST', '/api/staff/batteries', staffToken, {}, [400, 422]);
  
  // Bookings
  await testEndpoint('Staff Bookings', 'GET', '/api/staff/bookings', staffToken, null, 200);
  await testEndpoint('Staff Booking Confirm (validation)', 'POST', '/api/staff/bookings/test-id/confirm', staffToken, {}, [400, 404, 422]);
  await testEndpoint('Staff Booking Complete (validation)', 'POST', '/api/staff/bookings/test-id/complete', staffToken, {}, [400, 404, 422]);

  // Step 6: Test Admin Endpoints
  log('\n📝 Step 6: Testing Admin Endpoints...', 'yellow');
  
  // Users
  await testEndpoint('Admin Users', 'GET', '/api/admin/users', adminToken, null, 200);
  await testEndpoint('Admin Users (POST - validation)', 'POST', '/api/admin/users', adminToken, {}, [400, 422]);
  
  // Stations
  await testEndpoint('Admin Stations', 'GET', '/api/admin/stations', adminToken, null, 200);
  await testEndpoint('Admin Stations (POST - validation)', 'POST', '/api/admin/stations', adminToken, {}, [400, 422]);
  
  // Staff
  await testEndpoint('Admin Staff', 'GET', '/api/admin/staff', adminToken, null, 200);
  await testEndpoint('Admin Staff (POST - validation)', 'POST', '/api/admin/staff', adminToken, {}, [400, 422]);
  
  // Pricing
  await testEndpoint('Admin Pricing', 'GET', '/api/admin/pricing', adminToken, null, 200);
  await testEndpoint('Admin Pricing (POST - validation)', 'POST', '/api/admin/pricing', adminToken, {}, [400, 422]);
  
  // TopUp Packages
  await testEndpoint('Admin TopUp Packages', 'GET', '/api/admin/topup-packages', adminToken, null, 200);
  await testEndpoint('Admin TopUp Packages (POST - validation)', 'POST', '/api/admin/topup-packages', adminToken, {}, [400, 422]);
  
  // Dashboard
  await testEndpoint('Admin Dashboard Stats', 'GET', '/api/admin/dashboard/stats', adminToken, null, 200);
  await testEndpoint('Admin Dashboard Overview', 'GET', '/api/admin/dashboard/overview', adminToken, null, 200);
  await testEndpoint('Admin Dashboard Revenue', 'GET', '/api/admin/dashboard/revenue', adminToken, null, 200);
  await testEndpoint('Admin Dashboard Usage', 'GET', '/api/admin/dashboard/usage', adminToken, null, 200);
  await testEndpoint('Admin Dashboard Batteries', 'GET', '/api/admin/dashboard/batteries', adminToken, null, 200);

  // Step 7: Test Protected Endpoints (should return 401)
  log('\n📝 Step 7: Testing Security (Protected Endpoints)...', 'yellow');
  await testEndpoint('Protected: Driver Wallet (no token)', 'GET', '/api/driver/wallet/balance', null, null, [401, 403]);
  await testEndpoint('Protected: Staff Batteries (no token)', 'GET', '/api/staff/batteries', null, null, [401, 403]);
  await testEndpoint('Protected: Admin Stations (no token)', 'GET', '/api/admin/stations', null, null, [401, 403]);
  await testEndpoint('Protected: Admin Pricing (no token)', 'GET', '/api/admin/pricing', null, null, [401, 403]);

  // Step 8: Test Role Authorization (should return 403)
  log('\n📝 Step 8: Testing Role Authorization...', 'yellow');
  await testEndpoint('Role Check: Driver accessing Admin', 'GET', '/api/admin/stations', driverToken, null, [403, 401]);
  await testEndpoint('Role Check: Driver accessing Staff', 'GET', '/api/staff/batteries', driverToken, null, [403, 401]);
  await testEndpoint('Role Check: Staff accessing Admin', 'GET', '/api/admin/users', staffToken, null, [403, 401]);

  // Final Report
  log('\n' + '='.repeat(70), 'blue');
  log('\n📊 FINAL TEST REPORT\n', 'cyan');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`⏭️  Skipped: ${results.skipped}`, 'yellow');

  if (results.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.errors.forEach((error, index) => {
      log(`  ${index + 1}. ${error}`, 'red');
    });
  }

  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  log(`\n📈 Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! API is production-ready!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

