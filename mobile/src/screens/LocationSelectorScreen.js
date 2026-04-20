import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../utils/theme';
import api from '../services/api';

let Location;
if (Platform.OS !== 'web') {
  try {
    Location = require('expo-location');
  } catch (e) {
    console.warn('expo-location is not available:', e);
  }
}

const buildAddress = (entry) => {
  const parts = [entry.street, entry.city, entry.state, entry.pincode].filter(Boolean);
  return parts.join(', ');
};

const LocationSelectorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const onLocationSelect = route.params?.onSelectAddress;
  const [loading, setLoading] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [recentLocations, setRecentLocations] = useState([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await api.get('/api/addresses');
        const addresses = Array.isArray(response.data?.addresses) ? response.data.addresses : [];
        setRecentLocations(addresses.slice(0, 5));
      } catch (error) {
        console.error('Failed to load recent locations:', error);
        setRecentLocations([]);
      }
    };

    fetchRecent();
  }, []);

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      if (!Location || !Location.requestForegroundPermissionsAsync) {
        throw new Error('Location API not available');
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow location access to continue.');
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

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
        address: resolvedAddress,
      };

      try {
        await api.put('/api/addresses/location/current', {
          lat: latitude,
          lng: longitude,
        });
      } catch (error) {
        console.error('Failed to update current location in backend:', error);
      }

      setDetectedLocation(location);
      if (onLocationSelect) {
        onLocationSelect(location);
      }
      setLoading(false);

      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch (error) {
      console.error(error);
      Alert.alert('Unable to get location', 'Please add address manually.');
      setLoading(false);
    }
  };

  const handleSelectRecent = (entry) => {
    const location = {
      ...entry,
      address: buildAddress(entry),
      lat: entry.lat,
      lng: entry.lng,
    };

    if (onLocationSelect) {
      onLocationSelect(location);
    }
    navigation.goBack();
  };

  const fallbackLocations = [
    { id: 'home', label: 'Home', address: 'Bandra West, Mumbai, Maharashtra' },
    { id: 'work', label: 'Work', address: 'Andheri East, Mumbai, Maharashtra' },
  ];

  const recent = recentLocations.length
    ? recentLocations.map((loc) => ({
        id: loc._id,
        label: loc.label || 'Saved',
        address: buildAddress(loc),
        street: loc.street,
        city: loc.city,
        state: loc.state,
        pincode: loc.pincode,
        lat: loc.lat,
        lng: loc.lng,
      }))
    : fallbackLocations;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Select Location</Text>
            <Text style={styles.headerSubtitle}>Choose your delivery location</Text>
          </View>
        </View>

        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Icon name="map-marker" size={48} color={theme.colors.primary} />
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleUseCurrentLocation}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonIconContainer}>
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Icon name="navigation" size={24} color="white" />
              )}
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.primaryButtonTitle}>Use Current Location</Text>
              <Text style={styles.primaryButtonSubtitle}>
                We'll detect your location automatically
              </Text>
            </View>
          </TouchableOpacity>

          {detectedLocation && (
            <View style={styles.detectedLocationCard}>
              <View style={styles.detectedLocationIcon}>
                <Icon name="check-circle" size={20} color={theme.colors.green[600]} />
              </View>
              <View style={styles.detectedLocationText}>
                <Text style={styles.detectedLocationTitle}>Location Detected</Text>
                <Text style={styles.detectedLocationAddress}>
                  {detectedLocation.address}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <View style={styles.buttonIconContainerSecondary}>
              <Icon name="plus" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.secondaryButtonTitle}>Add Address Manually</Text>
              <Text style={styles.secondaryButtonSubtitle}>
                Enter your delivery address
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>RECENT LOCATIONS</Text>
          {recent.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.recentItem}
              onPress={() => handleSelectRecent(location)}
            >
              <View style={styles.recentIconContainer}>
                <Icon name="map-marker" size={18} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.recentTextContainer}>
                <Text style={styles.recentLabel}>{location.label}</Text>
                <Text style={styles.recentAddress}>{location.address}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    paddingHorizontal: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  primaryButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  detectedLocationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.green[50],
    borderWidth: 1,
    borderColor: theme.colors.green[600],
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  detectedLocationIcon: {
    marginTop: 2,
  },
  detectedLocationText: {
    flex: 1,
  },
  detectedLocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.green[700],
    marginBottom: 4,
  },
  detectedLocationAddress: {
    fontSize: 12,
    color: theme.colors.green[600],
    lineHeight: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  buttonIconContainerSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  secondaryButtonSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  recentSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  recentTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentTextContainer: {
    flex: 1,
  },
  recentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  recentAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default LocationSelectorScreen;
