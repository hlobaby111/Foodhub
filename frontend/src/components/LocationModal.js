import React, { useEffect, useState } from 'react';
import { X, Navigation, Plus, MapPin, Loader } from 'lucide-react';
import api from '../utils/api';

const getGeolocationErrorMessage = (error) => {
  if (!error || typeof error.code !== 'number') {
    return 'Unable to get location. Please enable location services.';
  }

  switch (error.code) {
    case 1:
      return 'Location permission was denied. Allow location in your browser and try again.';
    case 2:
      return 'Location is unavailable on this device right now. Please try again or enter address manually.';
    case 3:
      return 'Location request timed out. Please try again in an open area or with better network/GPS.';
    default:
      return 'Unable to get location. Please enable location services.';
  }
};

const formatAddress = (address) => {
  const parts = [address.street, address.city, address.state, address.pincode].filter(Boolean);
  return parts.join(', ');
};

const LocationModal = ({ isOpen, onClose, onLocationSelect, onAddManualAddress }) => {
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSavedAddresses = async () => {
      try {
        const response = await api.get('/api/addresses');
        setSavedAddresses(Array.isArray(response.data?.addresses) ? response.data.addresses : []);
      } catch (error) {
        console.error('Failed to load saved addresses:', error);
        setSavedAddresses([]);
      }
    };

    fetchSavedAddresses();
  }, [isOpen]);

  const handleCurrentLocation = async () => {
    setLoading(true);
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser. Please enter address manually.');
        setLoading(false);
        return;
      }

      if (!window.isSecureContext) {
        alert('Current location works only on HTTPS or localhost. Please open the app on localhost or a secure URL.');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let resolvedAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          try {
            const reverse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await reverse.json();
            if (data?.display_name) {
              resolvedAddress = data.display_name;
            }
          } catch (error) {
            console.error('Reverse geocoding failed:', error);
          }

          const location = {
            lat: latitude,
            lng: longitude,
            street: resolvedAddress,
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '',
            label: 'Current Location',
            address: resolvedAddress,
          };

          try {
            await api.put('/api/addresses/location/current', { lat: latitude, lng: longitude });
            await api.post('/api/addresses', {
              label: 'Current Location',
              street: resolvedAddress,
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '',
              lat: latitude,
              lng: longitude,
            });
          } catch (error) {
            console.error('Failed to update current location in backend:', error);
          }

          onLocationSelect(location);
          onClose();
          setLoading(false);
        },
        (error) => {
          alert(getGeolocationErrorMessage(error));
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20 px-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl mb-20 animate-in slide-in-from-top duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Choose Location</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={handleCurrentLocation}
              disabled={loading}
              className="group relative overflow-hidden rounded-xl border-2 border-primary/20 hover:border-primary bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 p-5 transition-all duration-200 hover:shadow-lg disabled:opacity-60 text-left"
            >
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {loading ? (
                      <Loader className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <Navigation className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-foreground mb-1 text-base">Use Current Location</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Auto-detect using GPS</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>

            <button
              onClick={() => {
                onClose();
                if (onAddManualAddress) onAddManualAddress();
              }}
              className="group rounded-xl border-2 border-border hover:border-primary/50 bg-white hover:bg-muted/30 p-5 transition-all duration-200 hover:shadow-md text-left"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-foreground mb-1 text-base">Add New Address</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Enter address manually</p>
                </div>
              </div>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">Saved Addresses</span>
            </div>
          </div>

          <div className="space-y-3">
            {savedAddresses.map((address) => (
              <button
                key={address._id}
                onClick={() => {
                  onLocationSelect({ ...address, address: formatAddress(address) });
                  onClose();
                }}
                className="w-full group flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 hover:shadow-sm text-left"
              >
                <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">{address.label || 'Saved'}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mb-0.5 line-clamp-1">{formatAddress(address)}</p>
                </div>

                <div className="flex items-center pt-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <svg
                      className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {savedAddresses.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">No saved addresses yet</p>
              <button
                onClick={() => {
                  onClose();
                  if (onAddManualAddress) onAddManualAddress();
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Add your first address
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
