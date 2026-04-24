import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import api from '../services/api';
import { theme } from '../utils/theme';

// Only import expo-location on native platforms
let Location;
if (Platform.OS !== 'web') {
  try {
    Location = require('expo-location');
  } catch (e) {
    console.warn('expo-location not available:', e);
  }
}

const reverseGeocode = async (latitude, longitude) => {
  // Prefer native reverse geocode on device.
  if (Platform.OS !== 'web' && Location?.reverseGeocodeAsync) {
    try {
      const nativeResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (Array.isArray(nativeResult) && nativeResult[0]) {
        const entry = nativeResult[0];
        const street = [entry.name, entry.street].filter(Boolean).join(' ').trim();
        const city = entry.city || entry.subregion || entry.district || '';
        const state = entry.region || '';
        const pincode = entry.postalCode || '';
        const address = [street, city, state, pincode].filter(Boolean).join(', ');
        if (address) {
          return { street, city, state, pincode, address };
        }
      }
    } catch (error) {
      console.warn('Native reverse geocoding failed:', error?.message || error);
    }
  }

  // Fallback to Nominatim.
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en',
          'User-Agent': 'FoodHubMobile/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocode HTTP ${response.status}`);
    }

    const data = await response.json();
    const addr = data?.address || {};
    const street = [addr.house_number, addr.road || addr.neighbourhood || addr.suburb]
      .filter(Boolean)
      .join(' ')
      .trim();
    const city = addr.city || addr.town || addr.village || addr.county || '';
    const state = addr.state || '';
    const pincode = addr.postcode || '';
    const address = data?.display_name || [street, city, state, pincode].filter(Boolean).join(', ');

    if (address) {
      return { street, city, state, pincode, address };
    }
  } catch (error) {
    console.warn('Nominatim reverse geocoding failed:', error?.message || error);
  }

  const fallbackAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  return {
    street: fallbackAddress,
    city: '',
    state: '',
    pincode: '',
    address: fallbackAddress,
  };
};

const AddressSelectorScreen = ({ navigation, route }) => {
  const { onSelectAddress } = route.params || {};
  const [activeTab, setActiveTab] = useState('saved');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const resolveCurrentPosition = async () => {
    if (Platform.OS === 'web') {
      if (!navigator?.geolocation) throw new Error('Location API not available');
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
      });
    }

    if (!Location || !Location.requestForegroundPermissionsAsync) {
      throw new Error('Location API not available');
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    return Location.getCurrentPositionAsync({});
  };

  // Manual entry state
  const [manualAddress, setManualAddress] = useState({
    street: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '',
    lat: 19.0760,
    lng: 72.8777,
  });

  // New address form
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    pincode: '',
    lat: 19.0760,
    lng: 72.8777,
  });

  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/addresses');
      setSavedAddresses(response.data.addresses || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      Alert.alert('Error', 'Failed to fetch saved addresses');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      const location = await resolveCurrentPosition();
      const { latitude, longitude } = location.coords;

      setManualAddress(prev => ({
        ...prev,
        lat: latitude,
        lng: longitude,
      }));

      const geocoded = await reverseGeocode(latitude, longitude);
      setManualAddress(prev => ({
        ...prev,
        street: geocoded.street || prev.street,
        city: geocoded.city || prev.city,
        state: geocoded.state || prev.state,
        pincode: geocoded.pincode || prev.pincode,
      }));
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not access your location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSelectSavedAddress = (address) => {
    if (onSelectAddress) {
      onSelectAddress(address);
    }
    navigation.goBack();
  };

  const handleSelectManualAddress = () => {
    if (!manualAddress.street || !manualAddress.pincode) {
      Alert.alert('Error', 'Please enter street and pincode');
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

    const finalize = () => {
      if (onSelectAddress) onSelectAddress(payload);
      navigation.goBack();
    };

    api.post('/api/addresses', payload)
      .catch((error) => {
        console.error('Failed to persist selected address:', error);
      })
      .finally(finalize);
  };

  const handleAddNewAddress = async () => {
    if (!newAddress.street || !newAddress.city) {
      Alert.alert('Error', 'Please fill in street and city');
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/addresses', newAddress);
      fetchSavedAddresses();
      Alert.alert('Success', 'Address added successfully!');
      if (onSelectAddress) {
        onSelectAddress(newAddress);
      }
      setNewAddress({
        label: 'Home',
        street: '',
        city: '',
        state: '',
        pincode: '',
        lat: 19.0760,
        lng: 72.8777,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to add address:', error);
      Alert.alert('Error', 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Delivery Address</Text>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabsContainer}>
        {['saved', 'gps', 'manual', 'new'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'saved' ? 'Saved' : tab === 'gps' ? 'GPS' : tab === 'manual' ? 'Enter' : 'New'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Saved Addresses Tab */}
        {activeTab === 'saved' && (
          <View>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : savedAddresses.length > 0 ? (
              <View style={styles.addressList}>
                {savedAddresses.map(addr => (
                  <TouchableOpacity
                    key={addr._id}
                    style={styles.addressCard}
                    onPress={() => handleSelectSavedAddress(addr)}
                  >
                    <View style={styles.addressContent}>
                      <View style={styles.addressHeader}>
                        <Text style={styles.addressLabel}>{addr.label}</Text>
                        {addr.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressText} numberOfLines={2}>
                        {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No saved addresses</Text>
                <Text style={styles.emptySubtext}>Add one using the other tabs</Text>
              </View>
            )}
          </View>
        )}

        {/* GPS Tab */}
        {activeTab === 'gps' && (
          <View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Click the button below to use your current GPS location
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={getCurrentLocation}
              disabled={gettingLocation}
            >
              <Icon name="map-marker" size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {gettingLocation ? 'Getting Location...' : 'Get Current Location'}
              </Text>
            </TouchableOpacity>

            {manualAddress.street !== '' && (
              <View style={styles.formContainer}>
                <Text style={styles.formLabel}>Street Address</Text>
                <TextInput
                  style={styles.input}
                  value={manualAddress.street}
                  onChangeText={text => setManualAddress({ ...manualAddress, street: text })}
                  placeholder="Enter street address"
                  placeholderTextColor={theme.colors.textSecondary}
                />

                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.formLabel}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={manualAddress.city}
                      onChangeText={text => setManualAddress({ ...manualAddress, city: text })}
                      placeholder="City"
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.formLabel}>Pincode</Text>
                    <TextInput
                      style={styles.input}
                      value={manualAddress.pincode}
                      onChangeText={text => setManualAddress({ ...manualAddress, pincode: text })}
                      placeholder="Pincode"
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.successButton]}
                  onPress={handleSelectManualAddress}
                >
                  <Icon name="check" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Confirm Address</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={newAddress.street}
              onChangeText={text => setNewAddress({ ...newAddress, street: text })}
              placeholder="123 Main Street"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.formLabel}>City</Text>
            <TextInput
              style={styles.input}
              value={newAddress.city}
              onChangeText={text => setNewAddress({ ...newAddress, city: text })}
              placeholder="Mumbai"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.formLabel}>State</Text>
            <TextInput
              style={styles.input}
              value={newAddress.state}
              onChangeText={text => setNewAddress({ ...newAddress, state: text })}
              placeholder="Maharashtra"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.formLabel}>Pincode</Text>
            <TextInput
              style={styles.input}
              value={newAddress.pincode}
              onChangeText={text => setNewAddress({ ...newAddress, pincode: text })}
              placeholder="400001"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.button, styles.successButton]}
              onPress={handleSelectManualAddress}
            >
              <Icon name="check" size={20} color="#fff" />
              <Text style={styles.buttonText}>Use This Address</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* New Address Tab */}
        {activeTab === 'new' && (
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>Label (e.g., Home, Office)</Text>
            <TextInput
              style={styles.input}
              value={newAddress.label}
              onChangeText={text => setNewAddress({ ...newAddress, label: text })}
              placeholder="Home"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.formLabel}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={newAddress.street}
              onChangeText={text => setNewAddress({ ...newAddress, street: text })}
              placeholder="123 Main Street"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.formLabel}>City</Text>
            <TextInput
              style={styles.input}
              value={newAddress.city}
              onChangeText={text => setNewAddress({ ...newAddress, city: text })}
              placeholder="Mumbai"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.formLabel}>State</Text>
            <TextInput
              style={styles.input}
              value={newAddress.state}
              onChangeText={text => setNewAddress({ ...newAddress, state: text })}
              placeholder="Maharashtra"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.formLabel}>Pincode</Text>
            <TextInput
              style={styles.input}
              value={newAddress.pincode}
              onChangeText={text => setNewAddress({ ...newAddress, pincode: text })}
              placeholder="400001"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.button, styles.successButton]}
              onPress={handleAddNewAddress}
              disabled={loading}
            >
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.buttonText}>{loading ? 'Adding...' : 'Add & Select Address'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
  },
  addressList: {
    gap: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  addressText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  formContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    marginTop: 16,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddressSelectorScreen;
