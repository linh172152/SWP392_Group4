# Ví dụ: Hiển thị Danh Sách Loại Pin từ API

## 📋 Tổng Quan

API đã trả về thông tin về battery models trong response. Dưới đây là cách extract và hiển thị.

---

## 🔌 API Response Structure

### 1. GET `/api/stations/public/:id` (Chi tiết trạm)

**Response:**
```json
{
  "success": true,
  "data": {
    "station_id": "...",
    "name": "Trạm ABC",
    "batteries": [
      {
        "battery_id": "...",
        "battery_code": "BAT001",
        "model": "Model A",
        "status": "full",
        "capacity_kwh": 50.0,
        "current_charge": 100
      },
      {
        "battery_id": "...",
        "battery_code": "BAT002",
        "model": "Model A",
        "status": "charging",
        ...
      },
      {
        "battery_id": "...",
        "battery_code": "BAT003",
        "model": "Model B",
        "status": "full",
        ...
      }
    ],
    "battery_inventory": {
      "Model A": {
        "available": 8,
        "charging": 2,
        "total": 10
      },
      "Model B": {
        "available": 5,
        "charging": 1,
        "total": 6
      }
    },
    "supported_models": ["Model A", "Model B", "Model C"]
  }
}
```

### 2. GET `/api/stations/public` (Danh sách trạm)

**Response:**
```json
{
  "success": true,
  "data": {
    "stations": [
      {
        "station_id": "...",
        "name": "Trạm ABC",
        "batteries": [
          { "model": "Model A", "status": "full", ... },
          { "model": "Model A", "status": "full", ... },
          { "model": "Model B", "status": "charging", ... }
        ]
      }
    ]
  }
}
```

---

## 💻 Cách Sử Dụng trong Component

### Ví dụ 1: Lấy danh sách unique battery models

```typescript
import { getBatteryModels, getBatteryModelStats } from '../utils/batteryModelUtils';
import { driverStationService, Station } from '../services/driver-station.service';

const StationDetail: React.FC = () => {
  const { id } = useParams();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStation = async () => {
      try {
        const data = await driverStationService.getPublicStationDetails(id!);
        setStation(data);
      } catch (error) {
        console.error('Error fetching station:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStation();
    }
  }, [id]);

  if (loading || !station) {
    return <div>Loading...</div>;
  }

  // Lấy danh sách unique battery models
  const batteryModels = getBatteryModels(station);
  // Ví dụ: ["Model A", "Model B"]

  // Lấy thông tin chi tiết từng model
  const batteryStats = getBatteryModelStats(station);
  // Ví dụ: {
  //   "Model A": { available: 8, charging: 2, total: 10 },
  //   "Model B": { available: 5, charging: 1, total: 6 }
  // }

  return (
    <div>
      <h2>Các loại pin có trong trạm:</h2>
      <ul>
        {batteryModels.map((model) => (
          <li key={model}>
            {model} - Available: {batteryStats[model]?.available || 0} / Total: {batteryStats[model]?.total || 0}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### Ví dụ 2: Hiển thị trong Card với Badge

```typescript
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Battery } from 'lucide-react';

const BatteryModelsList: React.FC<{ station: Station }> = ({ station }) => {
  const batteryModels = getBatteryModels(station);
  const batteryStats = getBatteryModelStats(station);

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-4">Các loại pin có sẵn</h3>
        <div className="space-y-3">
          {batteryModels.map((model) => {
            const stats = batteryStats[model];
            const availabilityPercentage = stats?.total 
              ? Math.round((stats.available / stats.total) * 100)
              : 0;

            return (
              <div
                key={model}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Battery className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{model}</p>
                    <p className="text-sm text-gray-600">
                      {stats?.available || 0} sẵn sàng / {stats?.total || 0} tổng
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    availabilityPercentage >= 70
                      ? "default"
                      : availabilityPercentage >= 30
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {availabilityPercentage}%
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
```

### Ví dụ 3: Dropdown để chọn battery model khi đặt chỗ

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const BookingForm: React.FC<{ station: Station; vehicle: Vehicle }> = ({ station, vehicle }) => {
  const batteryModels = getBatteryModels(station);
  const batteryStats = getBatteryModelStats(station);

  // Filter chỉ các model phù hợp với xe
  const compatibleModels = batteryModels.filter(
    model => model.toLowerCase().trim() === vehicle.battery_model.toLowerCase().trim()
  );

  return (
    <div>
      <label>Chọn loại pin:</label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Chọn loại pin" />
        </SelectTrigger>
        <SelectContent>
          {compatibleModels.length > 0 ? (
            compatibleModels.map((model) => {
              const stats = batteryStats[model];
              return (
                <SelectItem key={model} value={model}>
                  {model} ({stats?.available || 0} sẵn sàng)
                </SelectItem>
              );
            })
          ) : (
            <SelectItem value="" disabled>
              Không có pin phù hợp với xe của bạn
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
```

### Ví dụ 4: Hiển thị trong StationFinding (Danh sách trạm)

```typescript
const StationCard: React.FC<{ station: Station }> = ({ station }) => {
  const batteryModels = getBatteryModels(station);

  return (
    <Card>
      <CardContent>
        <h3>{station.name}</h3>
        <p>{station.address}</p>
        
        {/* Hiển thị các loại pin */}
        <div className="mt-2">
          <p className="text-sm font-medium mb-1">Loại pin có sẵn:</p>
          <div className="flex flex-wrap gap-2">
            {batteryModels.map((model) => (
              <Badge key={model} variant="outline">
                {model}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 📝 Lưu Ý

1. **API chi tiết trạm** (`/api/stations/public/:id`) trả về đầy đủ nhất:
   - Có `battery_inventory` với thống kê chi tiết
   - Có `batteries[]` array đầy đủ

2. **API danh sách trạm** (`/api/stations/public`) chỉ trả về:
   - `batteries[]` với pin có `status = "full"` (để tối ưu)
   - Không có `battery_inventory`

3. **Utility functions** tự động xử lý:
   - Ưu tiên `battery_inventory` nếu có
   - Fallback về `batteries[]` array
   - Fallback về `supported_models` nếu cần

4. **Case-insensitive**: BE so sánh battery model không phân biệt hoa thường, nhưng FE nên giữ nguyên format để hiển thị.

---

## 🎯 Summary

✅ **CÓ**, API đã trả về thông tin battery models qua:
- `station.batteries[]` → mỗi battery có `model`
- `station.battery_inventory` → object với key là model name
- `station.supported_models` → JSON field

✅ Sử dụng utility functions `getBatteryModels()` và `getBatteryModelStats()` để extract dễ dàng.

✅ Có thể hiển thị trong:
- Station detail page
- Station list/card
- Booking form (dropdown chọn model)
- Filter/search stations by battery model

