import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Navigation, 
  Calendar,
  Battery,
  Zap,
  Users,
  Shield,
  Wifi,
  Coffee,
  Car
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

// Mock station data
const mockStation = {
  id: '1',
  name: 'Downtown EV Hub',
  address: '123 Main Street, Downtown, City 12345',
  coordinates: { lat: 40.7128, lng: -74.0060 },
  phone: '+1 (555) 123-4567',
  email: 'downtown@evswap.com',
  operatingHours: {
    weekdays: '24/7',
    weekend: '24/7'
  },
  rating: 4.8,
  totalReviews: 245,
  images: [
    'https://images.unsplash.com/photo-1672542128826-5f0d578713d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb258ZW58MXx8fHwxNzU5NzEzOTIxfDA&ixlib=rb-4.1.0&q=80&w=1080'
  ],
  batteryInventory: {
    'Standard Range': { available: 8, total: 12, health: 95 },
    'Long Range': { available: 6, total: 10, health: 97 },
    'Performance': { available: 2, total: 4, health: 98 }
  },
  amenities: ['WiFi', 'Coffee Shop', 'Restrooms', 'Covered Parking', '24/7 Security'],
  swapBays: 8,
  avgSwapTime: '2.5 minutes',
  currentWaitTime: '< 5 minutes',
  staff: [
    { name: 'Sarah Johnson', role: 'Station Manager', avatar: '', rating: 4.9 },
    { name: 'Mike Chen', role: 'Technician', avatar: '', rating: 4.7 }
  ]
};

const mockReviews = [
  {
    id: '1',
    user: 'Alex Thompson',
    avatar: '',
    rating: 5,
    date: '2024-01-05',
    comment: 'Super fast service! The staff was very helpful and the station is always clean. Battery swap took exactly 3 minutes.',
    helpful: 12
  },
  {
    id: '2',
    user: 'Maria Garcia',
    avatar: '',
    rating: 4,
    date: '2024-01-03',
    comment: 'Good location with plenty of amenities nearby. Sometimes gets busy during peak hours but overall great experience.',
    helpful: 8
  },
  {
    id: '3',
    user: 'David Kim',
    avatar: '',
    rating: 5,
    date: '2024-01-01',
    comment: 'Best EV swap station in the area. Always has batteries available and the automated system works flawlessly.',
    helpful: 15
  }
];

const StationDetail: React.FC = () => {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);

  const getInventoryColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{mockStation.name}</h1>
            <Badge className="bg-green-100 text-green-800">Open 24/7</Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-gray-600 mb-4">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{mockStation.address}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Phone className="h-4 w-4" />
              <span className="text-sm">{mockStation.phone}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-1">
              {renderStars(mockStation.rating)}
              <span className="text-sm font-medium ml-1">{mockStation.rating}</span>
              <span className="text-sm text-gray-600">({mockStation.totalReviews} reviews)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-600">Wait: {mockStation.currentWaitTime}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg">
            <Navigation className="mr-2 h-4 w-4" />
            Get Directions
          </Button>
          <Button variant="outline" size="lg">
            <Calendar className="mr-2 h-4 w-4" />
            Reserve Slot
          </Button>
        </div>
      </div>

      {/* Station Images */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ImageWithFallback
                src={mockStation.images[selectedImage]}
                alt={mockStation.name}
                className="w-full h-64 lg:h-80 object-cover rounded-lg"
              />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                {mockStation.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative overflow-hidden rounded-lg ${
                      selectedImage === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`${mockStation.name} view ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Station Information Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Battery Inventory</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Battery Inventory & Health</CardTitle>
              <CardDescription>Real-time availability and battery condition status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(mockStation.batteryInventory).map(([type, info]) => (
                  <Card key={type}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{type}</h3>
                        <Badge variant="outline">
                          <Battery className="mr-1 h-3 w-3" />
                          {info.available}/{info.total}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Availability</span>
                          <span className={`font-medium ${getInventoryColor(info.available, info.total)}`}>
                            {Math.round((info.available / info.total) * 100)}%
                          </span>
                        </div>
                        <Progress value={(info.available / info.total) * 100} className="h-2" />
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Avg. Health</span>
                          <span className="font-medium text-green-600">{info.health}%</span>
                        </div>
                        <Progress value={info.health} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{mockStation.swapBays}</div>
                  <div className="text-sm text-gray-600">Swap Bays</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{mockStation.avgSwapTime}</div>
                  <div className="text-sm text-gray-600">Avg. Swap Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">98.5%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">234</div>
                  <div className="text-sm text-gray-600">Daily Swaps</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amenities">
          <Card>
            <CardHeader>
              <CardTitle>Station Amenities</CardTitle>
              <CardDescription>Available facilities and services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mockStation.amenities.map((amenity, index) => {
                  const getAmenityIcon = (amenity: string) => {
                    switch (amenity) {
                      case 'WiFi': return <Wifi className="h-5 w-5" />;
                      case 'Coffee Shop': return <Coffee className="h-5 w-5" />;
                      case '24/7 Security': return <Shield className="h-5 w-5" />;
                      case 'Covered Parking': return <Car className="h-5 w-5" />;
                      default: return <Zap className="h-5 w-5" />;
                    }
                  };

                  return (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-blue-600">
                        {getAmenityIcon(amenity)}
                      </div>
                      <span className="font-medium">{amenity}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Additional Services</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Vehicle inspection available on request</li>
                  <li>• Battery health diagnostics</li>
                  <li>• Mobile app for queue management</li>
                  <li>• Customer service hotline</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Station Staff</CardTitle>
              <CardDescription>Meet our professional team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockStation.staff.map((member, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.role}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {renderStars(member.rating)}
                        <span className="text-sm font-medium ml-1">{member.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
              <CardDescription>{mockStation.totalReviews} reviews with {mockStation.rating} average rating</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={review.avatar} />
                        <AvatarFallback>{review.user.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{review.user}</h4>
                          <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1 mb-3">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <button className="hover:text-blue-600">
                            👍 Helpful ({review.helpful})
                          </button>
                          <button className="hover:text-blue-600">Reply</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StationDetail;