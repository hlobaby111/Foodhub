import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

const RestaurantDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;
  const { user } = useAuth();
  const { addToCart, cartItems, updateQuantity, cartCount, cartTotal, cartRestaurant } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchRestaurant();
    fetchReviews();
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const response = await api.get(`/api/restaurants/${id}`);
      setRestaurant(response.data.restaurant);
      setMenuItems(response.data.menuItems);
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/api/reviews/restaurant/${id}`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleAddToCart = (item) => {
    if (!user) {
      navigation.navigate('Auth');
      return;
    }
    addToCart(item, restaurant);
  };

  const getCartQuantity = (itemId) => {
    const item = cartItems.find(i => i._id === itemId);
    return item ? item.quantity : 0;
  };

  const isCartFromThisRestaurant = cartRestaurant && cartRestaurant._id === id;
  const showCartBar = cartCount > 0 && isCartFromThisRestaurant;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!restaurant) return null;

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          <Image
            source={{
              uri: restaurant.coverImage?.url || 'https://images.unsplash.com/photo-1770629681079-86c4d2adb83f?w=1200&h=600&fit=crop'
            }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay} />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color={theme.colors.text} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Restaurant Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoHeaderLeft}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <Text style={styles.restaurantDescription}>{restaurant.description}</Text>

              {/* Cuisine Badges */}
              <View style={styles.cuisineBadges}>
                {restaurant.cuisineType?.map((cuisine, i) => (
                  <View key={i} style={styles.cuisineBadge}>
                    <Text style={styles.cuisineBadgeText}>{cuisine}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.infoHeaderRight}>
              {/* Rating Badge */}
              <View style={styles.ratingBadge}>
                <Icon name="star" size={16} color={theme.colors.green[600]} />
                <Text style={styles.ratingText}>
                  {restaurant.rating?.toFixed(1)} 
                  <Text style={styles.ratingCount}>({restaurant.totalReviews})</Text>
                </Text>
              </View>

              {/* Meta Info */}
              <View style={styles.metaInfo}>
                <View style={styles.metaItem}>
                  <Icon name="clock-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="map-marker" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.metaText}>{restaurant.location}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.categoryFilter}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && styles.categoryChipActive
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat && styles.categoryChipTextActive
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            {filteredItems.map(item => {
              const qty = getCartQuantity(item._id);
              return (
                <View key={item._id} style={styles.menuItem}>
                  {/* Item Image */}
                  <Image
                    source={{
                      uri: item.image?.url || 'https://images.unsplash.com/photo-1617686578451-46fa5f114c9d?w=200&h=200&fit=crop'
                    }}
                    style={styles.menuItemImage}
                    resizeMode="cover"
                  />

                  {/* Item Info */}
                  <View style={styles.menuItemInfo}>
                    <View style={styles.menuItemHeader}>
                      {item.isVegetarian && (
                        <View style={styles.vegIconBorder}>
                          <View style={styles.vegIconDot} />
                        </View>
                      )}
                      <Text style={styles.menuItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>

                    <Text style={styles.menuItemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>

                    {item.rating > 0 && (
                      <View style={styles.menuItemRating}>
                        <Icon name="star" size={12} color="#EAB308" />
                        <Text style={styles.menuItemRatingText}>
                          {item.rating?.toFixed(1)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.menuItemFooter}>
                      <Text style={styles.menuItemPrice}>INR{item.price}</Text>

                      {qty > 0 ? (
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => updateQuantity(item._id, qty - 1)}
                          >
                            <Icon name="minus" size={14} color="white" />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{qty}</Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleAddToCart(item)}
                          >
                            <Icon name="plus" size={14} color="white" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => handleAddToCart(item)}
                        >
                          <Icon name="plus" size={14} color="white" />
                          <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Icon name="star" size={20} color="#EAB308" />
              <Text style={styles.reviewsTitle}>Ratings & Reviews</Text>
              {reviews.length > 0 && (
                <Text style={styles.reviewsCount}>({reviews.length})</Text>
              )}
            </View>

            {reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>
                No reviews yet. Be the first to review after your order!
              </Text>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map(review => (
                  <View key={review._id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatar}>
                        <Icon name="account" size={16} color={theme.colors.textSecondary} />
                      </View>
                      <View style={styles.reviewHeaderText}>
                        <Text style={styles.reviewCustomerName}>
                          {review.customer?.name || 'Customer'}
                        </Text>
                        <View style={styles.reviewRatingRow}>
                          {[...Array(5)].map((_, i) => (
                            <Icon
                              key={i}
                              name="star"
                              size={12}
                              color={i < review.rating ? '#EAB308' : theme.colors.muted}
                            />
                          ))}
                          <Text style={styles.reviewDate}>
                            {new Date(review.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {review.comment && (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: showCartBar ? 100 : 20 }} />
      </ScrollView>

      {/* Sticky Bottom Cart Bar */}
      {showCartBar && (
        <View style={styles.stickyCartBar}>
          <TouchableOpacity
            style={styles.cartBarButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <View style={styles.cartBarLeft}>
              <View style={styles.cartBarIcon}>
                <Icon name="cart" size={20} color="white" />
              </View>
              <View>
                <Text style={styles.cartBarMainText}>
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </Text>
                <Text style={styles.cartBarSubText}>from {restaurant.name}</Text>
              </View>
            </View>
            <View style={styles.cartBarRight}>
              <Text style={styles.cartBarPrice}>INR{cartTotal}</Text>
              <View style={styles.viewCartBadge}>
                <Text style={styles.viewCartText}>View Cart</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },

  // Cover Image
  coverImageContainer: {
    height: 250,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },

  // Info Card
  infoCard: {
    backgroundColor: 'white',
    marginTop: -48,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 8,
  },
  infoHeader: {
    marginBottom: 16,
  },
  infoHeaderLeft: {
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  restaurantDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  cuisineBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineBadge: {
    backgroundColor: theme.colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cuisineBadgeText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  infoHeaderRight: {
    alignItems: 'flex-start',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.green[50],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.green[700],
  },
  ratingCount: {
    fontSize: 12,
    fontWeight: '400',
  },
  metaInfo: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  // Category Filter
  categoryFilter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: 16,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: theme.colors.muted,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: 'white',
  },

  // Menu Items
  menuSection: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuItemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: theme.colors.muted,
  },
  menuItemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vegIconBorder: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: theme.colors.green[600],
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.green[600],
  },
  menuItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  menuItemDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  menuItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  menuItemRatingText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  menuItemPrice: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    paddingHorizontal: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'white',
  },

  // Reviews
  reviewsSection: {
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.text,
  },
  reviewsCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  noReviewsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    paddingVertical: 16,
  },
  reviewsList: {
    gap: 16,
  },
  reviewItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewCustomerName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 6,
  },
  reviewComment: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 44,
  },

  // Sticky Cart Bar
  stickyCartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cartBarButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartBarIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  cartBarMainText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  cartBarSubText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  cartBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartBarPrice: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  viewCartBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
});

export default RestaurantDetailScreen;
