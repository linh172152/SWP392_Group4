# Admin Battery Management API Documentation

## Overview

Admin có quyền quản lý **TẤT CẢ** batteries từ **TẤT CẢ** stations trong hệ thống.

**Base URL:** `/api/admin/batteries`

**Authorization:** Requires `ADMIN` role

---

## API Endpoints

### 1. Get All Batteries

**GET** `/api/admin/batteries`

Lấy danh sách tất cả batteries với filtering và pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `station_id` | string | Filter by station |
| `status` | string | Filter by status (`available`, `charging`, `in_use`, `maintenance`, `damaged`) |
| `model` | string | Filter by battery model |
| `min_health` | number | Minimum health percentage |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20, max: 100) |

**Response:**

```json
{
  "success": true,
  "message": "Batteries retrieved successfully",
  "data": {
    "batteries": [
      {
        "battery_id": "uuid",
        "battery_code": "BAT001",
        "model": "Tesla Model 3 - 75kWh",
        "status": "available",
        "health_percentage": 95.5,
        "cycle_count": 120,
        "station_id": "uuid",
        "station": {
          "name": "Trạm Quận 1",
          "address": "123 Nguyễn Huệ, Q1, HCM"
        },
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-07T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### 2. Get Battery Statistics

**GET** `/api/admin/batteries/stats`

Lấy thống kê tổng quan về tất cả batteries.

**Response:**

```json
{
  "success": true,
  "message": "Battery statistics retrieved successfully",
  "data": {
    "total": 150,
    "by_status": {
      "available": 80,
      "charging": 30,
      "in_use": 25,
      "maintenance": 10,
      "damaged": 5
    },
    "by_model": [
      {
        "model": "Tesla Model 3 - 75kWh",
        "count": 60
      },
      {
        "model": "Tesla Model S - 100kWh",
        "count": 50
      }
    ],
    "low_health_count": 12,
    "avg_health": 89.5,
    "avg_cycle_count": 145
  }
}
```

---

### 3. Get Low Health Batteries

**GET** `/api/admin/batteries/low-health`

Lấy danh sách batteries có health thấp (cần bảo trì).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `threshold` | number | Health percentage threshold (default: 70) |

**Response:**

```json
{
  "success": true,
  "message": "Low health batteries retrieved successfully",
  "data": {
    "batteries": [
      {
        "battery_id": "uuid",
        "battery_code": "BAT045",
        "model": "VinFast VF8",
        "health_percentage": 65.2,
        "cycle_count": 350,
        "station": {
          "name": "Trạm Quận 2"
        }
      }
    ],
    "threshold": 70,
    "count": 12
  }
}
```

---

### 4. Get Battery Details

**GET** `/api/admin/batteries/:id`

Lấy thông tin chi tiết của 1 battery (bao gồm transfer history).

**Response:**

```json
{
  "success": true,
  "message": "Battery details retrieved successfully",
  "data": {
    "battery_id": "uuid",
    "battery_code": "BAT001",
    "model": "Tesla Model 3 - 75kWh",
    "status": "available",
    "health_percentage": 95.5,
    "cycle_count": 120,
    "station": {
      "name": "Trạm Quận 1",
      "address": "123 Nguyễn Huệ"
    },
    "transfer_logs_from": [
      {
        "transfer_id": "uuid",
        "from_station": {
          "name": "Trạm Quận 2"
        },
        "to_station": {
          "name": "Trạm Quận 1"
        },
        "transfer_reason": "Cân bằng tồn kho",
        "transfer_status": "completed",
        "transferred_at": "2025-01-05T10:00:00Z"
      }
    ]
  }
}
```

---

### 5. Create Battery

**POST** `/api/admin/batteries`

Tạo battery mới cho bất kỳ station nào.

**Request Body:**

```json
{
  "station_id": "uuid",
  "model": "Tesla Model 3 - 75kWh",
  "battery_code": "BAT150",
  "status": "available",
  "health_percentage": 100,
  "cycle_count": 0
}
```

**Validations:**

- `station_id`, `model`, `battery_code` are required
- `battery_code` must be unique
- Station must exist and not at full capacity
- `status` must be valid enum value

**Response:**

```json
{
  "success": true,
  "message": "Battery created successfully",
  "data": {
    "battery_id": "uuid",
    "battery_code": "BAT150",
    "model": "Tesla Model 3 - 75kWh",
    "status": "available",
    "health_percentage": 100,
    "cycle_count": 0,
    "station": {
      "name": "Trạm Quận 1"
    }
  }
}
```

---

### 6. Update Battery

**PUT** `/api/admin/batteries/:id`

Cập nhật thông tin battery (bao gồm chuyển station).

**Request Body:**

```json
{
  "station_id": "uuid",
  "model": "Tesla Model 3 - 75kWh",
  "battery_code": "BAT001",
  "status": "maintenance",
  "health_percentage": 85.5,
  "cycle_count": 150
}
```

**Validations:**

- Battery must exist
- If changing station: new station must not be at full capacity
- If changing battery_code: new code must be unique
- `status` must be valid enum value

**Response:**

```json
{
  "success": true,
  "message": "Battery updated successfully",
  "data": {
    "battery_id": "uuid",
    "battery_code": "BAT001",
    "status": "maintenance"
  }
}
```

---

### 7. Delete Battery

**DELETE** `/api/admin/batteries/:id`

Xóa battery khỏi hệ thống.

**Validations:**

- Battery must exist
- Battery must NOT be `in_use`

**Response:**

```json
{
  "success": true,
  "message": "Battery deleted successfully"
}
```

---

## Status Values

| Status        | Description           |
| ------------- | --------------------- |
| `available`   | Pin sẵn sàng để đổi   |
| `charging`    | Pin đang sạc          |
| `in_use`      | Pin đang được sử dụng |
| `maintenance` | Pin đang bảo trì      |
| `damaged`     | Pin hỏng              |

---

## Use Cases

### 1. Admin xem tất cả batteries từ tất cả stations

```bash
GET /api/admin/batteries?page=1&limit=50
```

### 2. Admin xem batteries của 1 station cụ thể

```bash
GET /api/admin/batteries?station_id=uuid&status=available
```

### 3. Admin xem batteries có SoH thấp (cần bảo trì)

```bash
GET /api/admin/batteries/low-health?threshold=70
```

### 4. Admin thêm battery mới vào station

```bash
POST /api/admin/batteries
{
  "station_id": "uuid",
  "model": "Tesla Model 3 - 75kWh",
  "battery_code": "BAT200",
  "status": "available"
}
```

### 5. Admin chuyển battery sang station khác

```bash
PUT /api/admin/batteries/:id
{
  "station_id": "new_station_uuid"
}
```

### 6. Admin xem thống kê batteries

```bash
GET /api/admin/batteries/stats
```

---

## Comparison: Admin vs Staff Battery API

| Feature        | Admin API                | Staff API              |
| -------------- | ------------------------ | ---------------------- |
| **Base URL**   | `/api/admin/batteries`   | `/api/staff/batteries` |
| **View Scope** | All stations             | Own station only       |
| **Create**     | Any station              | Own station only       |
| **Update**     | Any battery              | Own station only       |
| **Delete**     | Any battery              | Own station only       |
| **Statistics** | System-wide              | Station-specific       |
| **Transfer**   | Full transfer management | Request transfer only  |

---

## Integration với Frontend

### Tab 3: Battery Inventory trong BatteryPricingManagement.tsx

```typescript
// Fetch batteries
const batteries = await adminBatteryService.getBatteries({
  page: 1,
  limit: 20,
  station_id: selectedStation,
  status: filterStatus,
  min_health: 70,
});

// Get statistics
const stats = await adminBatteryService.getStats();

// Get low health batteries
const lowHealth = await adminBatteryService.getLowHealthBatteries({
  threshold: 70,
});
```

---

## Notes

- Admin có full control over tất cả batteries
- Staff chỉ quản lý batteries của station mình
- Transfer được log và track qua BatteryTransferLog
- SoH (State of Health) được track qua health_percentage và cycle_count
- Batteries có capacity limit theo station
