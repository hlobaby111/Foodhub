import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Check, Loader2, Navigation, Type, Map as MapIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import api from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const getGeolocationErrorMessage = (error) => {
  if (!error || typeof error.code !== 'number') {
    return 'Could not access your location. Please check browser location permission.';
  }

  switch (error.code) {
    case 1:
      return 'Location permission was denied. Allow location in your browser and try again.';
    case 2:
      return 'Location is unavailable on this device right now. Please try again or enter address manually.';
    case 3:
      return 'Location request timed out. Please try again in an open area or with better network/GPS.';
    default:
      return 'Could not access your location. Please check browser location permission.';
  }
};

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map click handler component
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const AddressSelector = ({ isOpen, onClose, onSelectAddress, currentLocation = null }) => {
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [activeTab, setActiveTab] = useState('saved');

  // Manual entry state
  const [manualAddress, setManualAddress] = useState({
    street: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '',
    lat: 19.0760,
    lng: 72.8777,
  });

  // Map picker state
  const [mapAddress, setMapAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    lat: currentLocation?.lat || 19.0760,
    lng: currentLocation?.lng || 72.8777,
  });
  const [selectedMapCoords, setSelectedMapCoords] = useState([mapAddress.lat, mapAddress.lng]);

  // New address form
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    pincode: '',
    lat: currentLocation?.lat || 19.0760,
    lng: currentLocation?.lng || 72.8777,
  });

  useEffect(() => {
    if (isOpen) {
      fetchSavedAddresses();
    }
  }, [isOpen]);

  const fetchSavedAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/addresses');
      setSavedAddresses(response.data.addresses || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser. Please enter address manually.');
        return;
      }

      if (!window.isSecureContext) {
        alert('Current location works only on HTTPS or localhost. Please open the app on localhost or a secure URL.');
        return;
      }

      setGettingLocation(true);
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      setManualAddress(prev => ({ ...prev, lat: latitude, lng: longitude }));
      setSelectedMapCoords([latitude, longitude]);
      setMapAddress(prev => ({ ...prev, lat: latitude, lng: longitude }));

      // Try to get address from coordinates using reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        if (data.address) {
          const addr = {
            street: data.address.road || data.address.house_number || '',
            city: data.address.city || data.address.town || '',
            state: data.address.state || '',
            pincode: data.address.postcode || '',
          };
          setManualAddress(prev => ({ ...prev, ...addr }));
        }
      } catch (e) {
        console.log('Reverse geocoding failed');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert(getGeolocationErrorMessage(error));
    } finally {
      setGettingLocation(false);
    }
  };

  const handleMapClick = (latlng) => {
    setSelectedMapCoords([latlng.lat, latlng.lng]);
    setMapAddress(prev => ({ ...prev, lat: latlng.lat, lng: latlng.lng }));
  };

  const handleSelectSavedAddress = (address) => {
    onSelectAddress({
      ...address,
      label: address.label || 'Saved Address',
    });
    onClose();
  };

  const handleSelectManualAddress = async () => {
    if (!manualAddress.street || !manualAddress.pincode) {
      alert('Please enter street and pincode');
      return;
    }

    const payload = {
      street: manualAddress.street,
      city: manualAddress.city,
      state: manualAddress.state,
      pincode: manualAddress.pincode,
      lat: manualAddress.lat,
      lng: manualAddress.lng,
      label: 'Current Location',
    };

    try {
      await api.post('/api/addresses', payload);
    } catch (error) {
      console.error('Failed to save current location address:', error);
    }

    onSelectAddress(payload);
    onClose();
  };

  const handleSelectMapAddress = async () => {
    if (!mapAddress.street) {
      alert('Please enter address details');
      return;
    }

    const payload = {
      street: mapAddress.street,
      city: mapAddress.city,
      state: mapAddress.state,
      pincode: mapAddress.pincode,
      lat: mapAddress.lat,
      lng: mapAddress.lng,
      label: 'Map Location',
    };

    try {
      await api.post('/api/addresses', payload);
    } catch (error) {
      console.error('Failed to save map address:', error);
    }

    onSelectAddress(payload);
    onClose();
  };

  const handleAddNewAddress = async () => {
    if (!newAddress.street || !newAddress.city) {
      alert('Please fill in street and city');
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/addresses', newAddress);
      onSelectAddress(newAddress);
      await fetchSavedAddresses();
      setNewAddress({
        label: 'Home',
        street: '',
        city: '',
        state: '',
        pincode: '',
        lat: currentLocation?.lat || 19.0760,
        lng: currentLocation?.lng || 72.8777,
      });
      onClose();
    } catch (error) {
      console.error('Failed to add address:', error);
      alert('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Select Delivery Address
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="current">GPS</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>

          {/* Saved Addresses Tab */}
          <TabsContent value="saved" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : savedAddresses.length > 0 ? (
              <div className="space-y-3">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSelectSavedAddress(addr)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{addr.label}</p>
                        <p className="text-sm text-gray-600">
                          {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                        </p>
                      </div>
                      {addr.isDefault && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No saved addresses. Add one below!</p>
            )}
          </TabsContent>

          {/* GPS Tab */}
          <TabsContent value="current" className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-4">
                Click the button below to use your current GPS location
              </p>
              <Button
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Current Location
                  </>
                )}
              </Button>
            </div>

            {manualAddress.street && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Street Address</Label>
                  <Input
                    value={manualAddress.street}
                    onChange={(e) => setManualAddress({ ...manualAddress, street: e.target.value })}
                    placeholder="Enter street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={manualAddress.city}
                      onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input
                      value={manualAddress.pincode}
                      onChange={(e) => setManualAddress({ ...manualAddress, pincode: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSelectManualAddress} className="w-full bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Address
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Street Address</Label>
                <Input
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    placeholder="Maharashtra"
                  />
                </div>
              </div>
              <div>
                <Label>Pincode</Label>
                <Input
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                  placeholder="400001"
                />
              </div>
              <div>
                <Label>Label (e.g., Home, Office)</Label>
                <Input
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                />
              </div>
              <Button
                onClick={handleAddNewAddress}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {loading ? 'Adding...' : 'Add & Select Address'}
              </Button>
            </div>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-4">
            <div className="h-64 rounded-lg overflow-hidden border">
              <MapContainer
                center={[selectedMapCoords[0], selectedMapCoords[1]]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={selectedMapCoords}>
                  <Popup>Selected Location</Popup>
                </Marker>
                <MapClickHandler onMapClick={handleMapClick} />
              </MapContainer>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              Click on the map to select your location
            </div>

            <div className="space-y-4">
              <div>
                <Label>Street Address</Label>
                <Input
                  value={mapAddress.street}
                  onChange={(e) => setMapAddress({ ...mapAddress, street: e.target.value })}
                  placeholder="Enter street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={mapAddress.city}
                    onChange={(e) => setMapAddress({ ...mapAddress, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    value={mapAddress.pincode}
                    onChange={(e) => setMapAddress({ ...mapAddress, pincode: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSelectMapAddress} className="w-full bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                Confirm Location
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddressSelector;
