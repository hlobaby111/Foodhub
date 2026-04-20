import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';
import { theme } from '../utils/theme';
import LocationBottomSheet from '../components/LocationBottomSheet';

const { width } = Dimensions.get('window');

// Restaurant Card Component - Matching Web Design
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
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Photo Carousel */}
      <View style={styles.cardImageContainer}>
        {photos.map((url, i) => (
          <Image
            key={i}
            source={{ uri: url }}
            resizeMode="cover"
            style={[
              styles.cardImage,
              { opacity: i === photoIndex ? 1 : 0 },
            ]}
          />
        ))}

        {/* Photo Indicators */}
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

        {/* Delivery Time Badge */}
        {restaurant.deliveryTime && (
          <View style={styles.deliveryBadge}>
            <Icon name="clock-outline" size={11} color={theme.colors.text} />
            <Text style={styles.deliveryText}>{restaurant.deliveryTime}</Text>
          </View>
        )}
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Icon name="star" size={12} color={theme.colors.green[600]} />
            <Text style={styles.ratingText}>
              {restaurant.rating?.toFixed(1) || '0.0'}
            </Text>
          </View>
        </View>

        {/* Delivery Estimate */}
        <Text style={styles.prepTime}>
          {restaurant.avgPrepTime || 25}-{(restaurant.avgPrepTime || 25) + 15} min
        </Text>

        {/* Dotted Separator */}
        <View style={styles.dottedSeparator} />

        {/* Veg/Non-veg + Cuisines */}
        <View style={styles.metaRow}>
          {restaurant.isVeg ? (
            <View style={styles.vegBadge}>
              <View style={styles.vegIconBorder}>
                <View style={styles.vegIconDot} />
              </View>
              <Text style={styles.vegText}>Pure Veg</Text>
            </View>
          ) : (
            <View style={styles.nonVegBadge}>
              <View style={styles.nonVegIconBorder}>
                <View style={styles.nonVegIconDot} />
              </View>
              <Text style={styles.nonVegText}>Non-Veg</Text>
            </View>
          )}
          <Text style={styles.separator}>|</Text>
          <Text style={styles.cuisineText} numberOfLines={1}>
            {restaurant.cuisineType?.slice(0, 2).join(', ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { cartCount, cartTotal, cartRestaurant, clearCart } = useCart();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [userLocation, setUserLocation] = useState('Mumbai, Maharashtra');
  const [showLocationSheet, setShowLocationSheet] = useState(false);

  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchRestaurants();
    fetchBanners();
  }, [page, locationFilter]);

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
      const params = { page, limit: 12 };
      if (locationFilter) params.location = locationFilter;
      const response = await api.get('/api/restaurants', { params });
      setRestaurants(response.data.restaurants);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await api.get('/api/banners');
      setBanners(response.data.banners || []);
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRestaurants();
    await fetchBanners();
    setRefreshing(false);
  };

  const handleSearchChange = useCallback((value) => {
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
      } catch (e) {
        setSearchResults(null);
      }
    }, 500);
  }, []);

  const handleLocationSelect = (location) => {
    const label = location.city ? `${location.address}, ${location.city}` : location.address;
    if (label) {
      setUserLocation(label);
    }
    setShowLocationSheet(false);
  };

  const locations = ['Bandra, Mumbai', 'Andheri, Mumbai', 'Juhu, Mumbai', 'Colaba, Mumbai'];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Location Bar */}
        <View style={styles.locationBar}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setShowLocationSheet(true)}
          >
            <Icon name="navigation" size={20} color={theme.colors.primary} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Deliver to</Text>
              <Text style={styles.locationValue} numberOfLines={1}>
                {userLocation}
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Icon
              name="magnify"
              size={20}
              color={theme.colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={handleSearchChange}
              placeholder="Search for restaurant, cuisine or a dish"
              placeholderTextColor={theme.colors.textSecondary}
            />
            {search && (
              <TouchableOpacity
                onPress={() => {
                  setSearch('');
                  setSearchResults(null);
                }}
                style={styles.clearButton}
              >
                <Icon name="close" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
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
                      onPress={() => {
                        setSearchResults(null);
                        setSearch('');
                        navigation.navigate('RestaurantDetail', { id: r._id });
                      }}
                    >
                      <Image
                        source={{
                          uri: r.photos?.[0]?.url || r.coverImage?.url || 'https://images.unsplash.com/photo-1767418238663-d79db1fb7f78?w=100&h=100&fit=crop'
                        }}
                        style={styles.searchResultImage}
                      />
                      <View style={styles.searchResultText}>
                        <Text style={styles.searchResultName} numberOfLines={1}>
                          {r.name}
                        </Text>
                        <Text style={styles.searchResultCuisine} numberOfLines={1}>
                          {r.cuisineType?.join(', ')}
                        </Text>
                      </View>
                      <View style={styles.searchResultRating}>
                        <Icon name="star" size={12} color={theme.colors.green[700]} />
                        <Text style={styles.searchResultRatingText}>
                          {r.rating?.toFixed(1)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {searchResults.dishMatches?.length > 0 && (
                <View style={[styles.searchSection, styles.searchSectionBorder]}>
                  <Text style={styles.searchSectionTitle}>DISHES</Text>
                  {searchResults.dishMatches.map((r, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.searchResultItem}
                      onPress={() => {
                        setSearchResults(null);
                        setSearch('');
                        navigation.navigate('RestaurantDetail', { id: r._id });
                      }}
                    >
                      <View style={styles.searchResultText}>
                        <Text style={styles.searchResultName}>{r.matchedDish}</Text>
                        <Text style={styles.searchResultCuisine}>{r.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {(!searchResults.restaurants?.length && !searchResults.dishMatches?.length) && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No results found</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Banner Carousel */}
        {banners.length > 0 && (
          <View style={styles.bannerContainer}>
            <View style={styles.bannerWrapper}>
              {banners.map((banner, i) => (
                <View
                  key={banner._id}
                  style={[
                    styles.bannerSlide,
                    { opacity: i === currentBanner ? 1 : 0 },
                  ]}
                >
                  <Image
                    source={{ uri: banner.imageUrl }}
                    resizeMode="cover"
                    style={styles.bannerImage}
                  />
                  <View style={styles.bannerOverlay} />
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.bannerIndicators}>
                {banners.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setCurrentBanner(i)}
                    style={[
                      styles.bannerIndicator,
                      i === currentBanner && styles.bannerIndicatorActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !locationFilter && styles.filterChipActive,
              ]}
              onPress={() => {
                setLocationFilter('');
                setPage(1);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !locationFilter && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {locations.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.filterChip,
                  locationFilter === loc && styles.filterChipActive,
                ]}
                onPress={() => {
                  setLocationFilter(loc);
                  setPage(1);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    locationFilter === loc && styles.filterChipTextActive,
                  ]}
                >
                  {loc.split(',')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Restaurant Grid */}
        <View style={styles.restaurantSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {locationFilter ? `In ${locationFilter.split(',')[0]}` : 'All Restaurants'}
            </Text>
            <Text style={styles.sectionSubtitle}> {pagination.total} places</Text>
          </View>

          {loading ? (
            <View style={styles.gridContainer}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={styles.skeletonCard} />
              ))}
            </View>
          ) : restaurants.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No restaurants found</Text>
            </View>
          ) : (
            <>
              <View style={styles.gridContainer}>
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant._id}
                    restaurant={restaurant}
                    onPress={() =>
                      navigation.navigate('RestaurantDetail', { id: restaurant._id })
                    }
                  />
                ))}
              </View>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.paginationButton, page <= 1 && styles.paginationButtonDisabled]}
                    disabled={page <= 1}
                    onPress={() => setPage((p) => p - 1)}
                  >
                    <Text style={styles.paginationButtonText}>Prev</Text>
                  </TouchableOpacity>
                  <Text style={styles.paginationText}>
                    {page}/{pagination.pages}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      page >= pagination.pages && styles.paginationButtonDisabled,
                    ]}
                    disabled={page >= pagination.pages}
                    onPress={() => setPage((p) => p + 1)}
                  >
                    <Text style={styles.paginationButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* Footer Spacing */}
        <View style={{ height: cartCount > 0 ? 140 : 40 }} />
      </ScrollView>

      {/* Persistent Cart Bar */}
      {cartCount > 0 && (
        <View style={styles.cartBarContainer}>
          <View style={styles.cartBar}>
            <TouchableOpacity
              style={styles.cartBarContent}
              onPress={() => navigation.navigate('Cart')}
            >
              <View style={styles.cartIconContainer}>
                <Icon name="cart" size={20} color="white" />
              </View>
              <View style={styles.cartBarTextContainer}>
                <Text style={styles.cartBarMainText}>
                  {cartCount} item{cartCount > 1 ? 's' : ''} | INR{cartTotal}
                </Text>
                <Text style={styles.cartBarSubText} numberOfLines={1}>
                  {cartRestaurant?.name}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.cartBarActions}>
              <TouchableOpacity
                style={styles.viewCartButton}
                onPress={() => navigation.navigate('Cart')}
              >
                <Text style={styles.viewCartText}>View Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearCartButton} onPress={clearCart}>
                <Icon name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <LocationBottomSheet
        visible={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
        onLocationSelect={handleLocationSelect}
      />
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

  // Location Bar
  locationBar: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 16,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    lineHeight: 12,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'relative',
    zIndex: 1000,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  clearButton: {
    padding: 4,
  },

  // Search Results
  searchResultsContainer: {
    position: 'absolute',
    top: 72,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2000,
  },
  searchSection: {
    padding: 12,
  },
  searchSectionBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  searchSectionTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.muted,
  },
  searchResultText: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  searchResultCuisine: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  searchResultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 8,
  },
  searchResultRatingText: {
    fontSize: 12,
    color: theme.colors.green[700],
  },
  noResults: {
    padding: 24,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  // Banner
  bannerContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  bannerWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 160,
    position: 'relative',
  },
  bannerSlide: {
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  bannerIndicators: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  bannerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  bannerIndicatorActive: {
    width: 20,
    backgroundColor: 'white',
  },

  // Filters
  filterContainer: {
    paddingTop: 20,
    paddingLeft: 16,
  },
  filterChip: {
    backgroundColor: theme.colors.muted,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },

  // Restaurant Section
  restaurantSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  // Restaurant Card
  gridContainer: {
    gap: 16,
  },
  restaurantCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardImageContainer: {
    aspectRatio: 16 / 10,
    position: 'relative',
    backgroundColor: theme.colors.muted,
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    width: 12,
    backgroundColor: 'white',
  },
  deliveryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.green[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.green[700],
  },
  prepTime: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.green[600],
    marginBottom: 6,
  },
  dottedSeparator: {
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dotted',
    borderColor: theme.colors.border,
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vegIconBorder: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: theme.colors.green[600],
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.green[600],
  },
  vegText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.green[600],
  },
  nonVegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nonVegIconBorder: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: theme.colors.red[500],
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nonVegIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.red[500],
  },
  nonVegText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.red[500],
  },
  separator: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  cuisineText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  // Skeleton & Empty States
  skeletonCard: {
    height: 288,
    backgroundColor: theme.colors.muted,
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'white',
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationButtonText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  paginationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  // Cart Bar
  cartBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cartBar: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  cartBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  cartIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  cartBarTextContainer: {
    flex: 1,
  },
  cartBarMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  cartBarSubText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  cartBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewCartButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  clearCartButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 6,
  },

  // Location Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 16,
  },
  locationList: {
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  locationItemText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
});

export default HomeScreen;
