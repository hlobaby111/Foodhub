import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput as RNTextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Searchbar, Chip, FAB, Portal, Modal, Button, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

const RestaurantCard = ({ restaurant, onPress }) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = restaurant.photos?.length > 0
    ? restaurant.photos.map((p) => p.url)
    : [restaurant.coverImage?.url || 'https://images.unsplash.com/photo-1767418238663-d79db1fb7f78?w=600&h=400&fit=crop'];

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [photos.length]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardImageContainer}>
        {photos.map((url, i) => (
          <Image
            key={i}
            source={{ uri: url }}
            style={[
              styles.cardImage,
              { opacity: i === photoIndex ? 1 : 0 },
            ]}
          />
        ))}
        {photos.length > 1 && (
          <View style={styles.photoIndicators}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.indicator,
                  i === photoIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        )}
        {restaurant.deliveryTime && (
          <View style={styles.deliveryBadge}>
            <Icon name="clock-outline" size={12} color={theme.colors.text} />
            <Text style={styles.deliveryText}>{restaurant.deliveryTime}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.rating}>
            <Icon name="star" size={14} color={theme.colors.green[600]} />
            <Text style={styles.ratingText}>
              {restaurant.rating?.toFixed(1) || '0.0'}
            </Text>
          </View>
        </View>

        <Text style={styles.prepTime}>
          {restaurant.avgPrepTime || 25}-{(restaurant.avgPrepTime || 25) + 15} min
        </Text>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.vegBadge}>
            <View
              style={[
                styles.vegIcon,
                { borderColor: restaurant.isVeg ? theme.colors.green[600] : theme.colors.red[500] },
              ]}
            >
              <View
                style={[
                  styles.vegDot,
                  { backgroundColor: restaurant.isVeg ? theme.colors.green[600] : theme.colors.red[500] },
                ]}
              />
            </View>
            <Text
              style={[
                styles.vegText,
                { color: restaurant.isVeg ? theme.colors.green[600] : theme.colors.red[500] },
              ]}
            >
              {restaurant.isVeg ? 'Pure Veg' : 'Non-Veg'}
            </Text>
          </View>
          <Text style={styles.cuisine} numberOfLines={1}>
            | {restaurant.cuisineType?.slice(0, 2).join(', ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }) {
  const { cartCount, cartTotal, restaurant: cartRestaurant } = useCart();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [userLocation, setUserLocation] = useState('Mumbai, Maharashtra');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const searchTimeout = useRef(null);

  const locations = ['Bandra, Mumbai', 'Andheri, Mumbai', 'Juhu, Mumbai', 'Colaba, Mumbai'];

  useEffect(() => {
    fetchRestaurants();
    fetchBanners();
  }, [locationFilter]);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = { limit: 20 };
      if (locationFilter) params.location = locationFilter;
      
      const response = await api.get('/api/restaurants', { params });
      setRestaurants(response.data.restaurants || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await api.get('/api/banners');
      setBanners(response.data.banners || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRestaurants();
    await fetchBanners();
    setRefreshing(false);
  };

  const handleSearch = (value) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await api.get('/api/search', { params: { q: value } });
        setSearchResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults(null);
      }
    }, 500);
  };

  const handleRestaurantPress = (restaurant) => {
    setSearchResults(null);
    setSearch('');
    navigation.navigate('RestaurantDetail', { restaurantId: restaurant._id });
  };

  return (
    <View style={styles.container}>
      {/* Location Bar */}
      <View style={styles.locationBar}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setShowLocationModal(true)}
        >
          <Icon name="navigation-variant" size={20} color={theme.colors.primary} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Deliver to</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {userLocation}
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search for restaurant, cuisine or a dish"
            onChangeText={handleSearch}
            value={search}
            style={styles.searchBar}
            iconColor={theme.colors.textSecondary}
          />
        </View>

        {/* Search Results Dropdown */}
        {searchResults && (
          <View style={styles.searchResultsContainer}>
            {searchResults.restaurants?.length > 0 && (
              <View style={styles.searchSection}>
                <Text style={styles.searchSectionTitle}>RESTAURANTS</Text>
                {searchResults.restaurants.map((r) => (
                  <TouchableOpacity
                    key={r._id}
                    style={styles.searchResultItem}
                    onPress={() => handleRestaurantPress(r)}
                  >
                    <Image
                      source={{ uri: r.photos?.[0]?.url || r.coverImage?.url || 'https://images.unsplash.com/photo-1767418238663-d79db1fb7f78?w=100&h=100&fit=crop' }}
                      style={styles.searchResultImage}
                    />
                    <View style={styles.searchResultText}>
                      <Text style={styles.searchResultName}>{r.name}</Text>
                      <Text style={styles.searchResultCuisine}>
                        {r.cuisineType?.join(', ')}
                      </Text>
                    </View>
                    <View style={styles.searchResultRating}>
                      <Icon name="star" size={12} color={theme.colors.green[600]} />
                      <Text style={styles.searchResultRatingText}>
                        {r.rating?.toFixed(1)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {(!searchResults.restaurants?.length && !searchResults.dishMatches?.length) && (
              <Text style={styles.noResults}>No results found</Text>
            )}
          </View>
        )}

        {/* Banner Carousel */}
        {banners.length > 0 && (
          <View style={styles.bannerContainer}>
            {banners.map((banner, i) => (
              <View
                key={banner._id}
                style={[
                  styles.banner,
                  { opacity: i === currentBanner ? 1 : 0 },
                ]}
              >
                <Image source={{ uri: banner.imageUrl }} style={styles.bannerImage} />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                </View>
              </View>
            ))}
            <View style={styles.bannerIndicators}>
              {banners.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.bannerIndicator,
                    i === currentBanner && styles.activeBannerIndicator,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <Chip
            selected={!locationFilter}
            onPress={() => setLocationFilter('')}
            style={styles.filterChip}
            selectedColor={theme.colors.surface}
            mode="flat"
          >
            All
          </Chip>
          {locations.map((loc) => (
            <Chip
              key={loc}
              selected={locationFilter === loc}
              onPress={() => setLocationFilter(loc)}
              style={styles.filterChip}
              selectedColor={theme.colors.surface}
              mode="flat"
            >
              {loc.split(',')[0]}
            </Chip>
          ))}
        </ScrollView>

        {/* Restaurants Section */}
        <View style={styles.restaurantsHeader}>
          <Text style={styles.restaurantsTitle}>
            {locationFilter ? `In ${locationFilter.split(',')[0]}` : 'All Restaurants'}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : restaurants.length === 0 ? (
          <Text style={styles.noRestaurants}>No restaurants found</Text>
        ) : (
          <View style={styles.restaurantGrid}>
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant._id}
                restaurant={restaurant}
                onPress={() => handleRestaurantPress(restaurant)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <FAB
          icon="cart"
          label={`₹${cartTotal.toFixed(0)} | ${cartCount} items`}
          style={styles.cartFab}
          onPress={() => navigation.navigate('Cart')}
          color={theme.colors.surface}
          customSize={56}
        />
      )}

      {/* Location Modal */}
      <Portal>
        <Modal
          visible={showLocationModal}
          onDismiss={() => setShowLocationModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Set delivery location</Text>
          {['Mumbai, Maharashtra', 'Bandra West, Mumbai', 'Andheri East, Mumbai', 'Powai, Mumbai'].map((loc) => (
            <TouchableOpacity
              key={loc}
              style={styles.locationOption}
              onPress={() => {
                setUserLocation(loc);
                setShowLocationModal(false);
              }}
            >
              <Icon name="map-marker" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.locationOptionText}>{loc}</Text>
              {userLocation === loc && (
                <Icon name="check" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
          <Button
            mode="contained"
            onPress={() => setShowLocationModal(false)}
            style={styles.modalButton}
            buttonColor={theme.colors.primary}
          >
            Confirm
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  locationBar: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  locationLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  locationText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  searchBar: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  searchResultsContainer: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    elevation: 4,
  },
  searchSection: {
    marginBottom: theme.spacing.sm,
  },
  searchSectionTitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
  },
  searchResultText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  searchResultName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  searchResultCuisine: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  searchResultRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultRatingText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.green[600],
    marginLeft: 2,
  },
  noResults: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    padding: theme.spacing.lg,
  },
  bannerContainer: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    height: 140,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bannerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
  },
  bannerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  bannerIndicators: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.md,
    flexDirection: 'row',
  },
  bannerIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginLeft: 4,
  },
  activeBannerIndicator: {
    width: 16,
    backgroundColor: theme.colors.surface,
  },
  filterContainer: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  filterContent: {
    paddingRight: theme.spacing.md,
  },
  filterChip: {
    marginRight: theme.spacing.sm,
  },
  restaurantsHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  restaurantsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  noRestaurants: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xl,
  },
  restaurantGrid: {
    paddingHorizontal: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    elevation: 2,
  },
  cardImageContainer: {
    height: 180,
    position: 'relative',
  },
  cardImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  photoIndicators: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginLeft: 4,
  },
  activeIndicator: {
    width: 12,
    backgroundColor: theme.colors.surface,
  },
  deliveryBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    marginLeft: 4,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.green[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    marginLeft: theme.spacing.sm,
  },
  ratingText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.green[600],
    marginLeft: 2,
  },
  prepTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.green[600],
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vegIcon: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    marginLeft: 4,
  },
  cuisine: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  cartFab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  locationOptionText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
  },
  modalButton: {
    marginTop: theme.spacing.md,
  },
});
