import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Plus, X, Loader } from 'lucide-react';
import api from '../utils/api';

const formatAddress = (address) => {
  const parts = [address.street, address.city, address.state, address.pincode].filter(Boolean);
  return parts.join(', ');
};

const LocationSelector = ({ isOpen, onClose, onLocationSelect, onSelectAddress }) => {
  const handleSelect = onLocationSelect || onSelectAddress;
  const [loading, setLoading] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [recentLocations, setRecentLocations] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchRecentLocations = async () => {
      try {
        const response = await api.get('/api/addresses');
        const addresses = Array.isArray(response.data?.addresses) ? response.data.addresses : [];
        setRecentLocations(addresses.slice(0, 5));
      } catch (error) {
        console.error('Failed to load saved addresses:', error);
        setRecentLocations([]);
      }
    };

    fetchRecentLocations();
  }, [isOpen]);

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          const location = {
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '',
            street: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          };

          try {
            await api.put('/api/addresses/location/current', { lat: latitude, lng: longitude });
          } catch (error) {
            console.error('Failed to update current location in backend:', error);
          }

          setDetectedLocation(location);
          if (handleSelect) {
            handleSelect(location);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to retrieve your location. Please add address manually.');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleSelectRecent = (location) => {
    const selected = {
      ...location,
      address: formatAddress(location),
    };
    if (handleSelect) {
      handleSelect(selected);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Select Location</h2>
                <p className="text-sm text-muted-foreground">Choose how to set your delivery location</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <button
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="w-full group relative overflow-hidden rounded-xl border-2 border-primary bg-primary hover:bg-primary/90 p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                {loading ? (
                  <Loader className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Navigation className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-white mb-1">Use Current Location</h3>
                <p className="text-sm text-white/80">We'll detect your location automatically</p>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </button>

          {detectedLocation && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-in slide-in-from-top duration-300">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 mb-1">Location Detected</p>
                  <p className="text-xs text-green-700">{detectedLocation.address}</p>
                </div>
              </div>
            </div>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-muted-foreground">OR</span>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              window.location.href = '/profile';
            }}
            className="w-full group rounded-xl border-2 border-border hover:border-primary bg-white hover:bg-muted/50 p-6 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-foreground mb-1">Add Address Manually</h3>
                <p className="text-sm text-muted-foreground">Enter your delivery address</p>
              </div>
            </div>
          </button>

          <div className="pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Recent Locations</p>
            <div className="space-y-2">
              {(recentLocations.length > 0 ? recentLocations : [
                { _id: 'home', label: 'Home', street: 'Bandra West', city: 'Mumbai', state: 'Maharashtra' },
                { _id: 'work', label: 'Work', street: 'Andheri East', city: 'Mumbai', state: 'Maharashtra' },
              ]).map((loc, i) => (
                <button
                  key={loc._id || i}
                  onClick={() => handleSelectRecent(loc)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground">{loc.label ? `${loc.label} - ${formatAddress(loc)}` : formatAddress(loc)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
