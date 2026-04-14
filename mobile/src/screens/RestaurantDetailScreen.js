import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ActivityIndicator, Button, Portal, Dialog } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';
import { theme } from '../utils/theme';

const MenuItem = ({ item, onAdd }) => {
  return (
    <View style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        <View
          style={[
            styles.vegIconSmall,
            { borderColor: item.isVeg ? theme.colors.green[600] : theme.colors.red[500] },
          ]}
        >
          <View
            style={[
              styles.vegDotSmall,
              { backgroundColor: item.isVeg ? theme.colors.green[600] : theme.colors.red[500] },
            ]}
          />
        </View>

        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemPrice}>₹{item.price}</Text>
          {item.description && (
            <Text style={styles.menuItemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>

      {item.image?.url && (
        <Image source={{ uri: item.image.url }} style={styles.menuItemImage} />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => onAdd(item)}
        disabled={!item.isAvailable}
      >
        <Text style={styles.addButtonText}>
          {item.isAvailable ? 'ADD' : 'UNAVAILABLE'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurantId } = route.params;
  const { addToCart, restaurant: cartRestaurant, clearCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);

  useEffect(() => {
    fetchRestaurantDetails();
    fetchMenu();
  }, [restaurantId]);

  const fetchRestaurantDetails = async () => {
    try {
      const response = await api.get(`/api/restaurants/${restaurantId}`);
      setRestaurant(response.data.restaurant);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      Alert.alert('Error', 'Failed to load restaurant details');
    }
  };

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/menu', { params: { restaurantId } });
      setMenu(response.data.menuItems || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    if (!restaurant) return;

    const result = addToCart(item, {
      _id: restaurant._id,
      name: restaurant.name,
    });

    if (!result.success && result.needsClear) {
      setPendingItem(item);
      setShowClearDialog(true);
    }
  };

  const handleClearAndAdd = () => {
    clearCart();
    if (pendingItem && restaurant) {
      addToCart(pendingItem, {
        _id: restaurant._id,
        name: restaurant.name,
      });
    }
    setShowClearDialog(false);
    setPendingItem(null);
  };

  if (!restaurant) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const photos = restaurant.photos?.length > 0
    ? restaurant.photos.map((p) => p.url)
    : [restaurant.coverImage?.url || 'https://images.unsplash.com/photo-1767418238663-d79db1fb7f78?w=600&h=400&fit=crop'];

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Restaurant Image */}
        <Image source={{ uri: photos[0] }} style={styles.coverImage} />

        {/* Restaurant Info */}
        <View style={styles.infoContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.name}>{restaurant.name}</Text>
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
            </View>
            <View style={styles.rating}>
              <Icon name="star" size={16} color={theme.colors.green[600]} />
              <Text style={styles.ratingText}>
                {restaurant.rating?.toFixed(1) || '0.0'}
              </Text>
            </View>
          </View>

          <Text style={styles.cuisines}>
            {restaurant.cuisineType?.join(', ')}
          </Text>

          <View style={styles.infoRow}>
            <Icon name="clock-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>{restaurant.deliveryTime || '30-40 min'}</Text>
            <Icon name="map-marker-outline" size={16} color={theme.colors.textSecondary} style={{ marginLeft: theme.spacing.md }} />
            <Text style={styles.infoText}>{restaurant.location}</Text>
          </View>

          {restaurant.description && (
            <Text style={styles.description}>{restaurant.description}</Text>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Menu</Text>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.lg }} />
          ) : menu.length === 0 ? (
            <Text style={styles.noMenu}>No menu items available</Text>
          ) : (
            menu.map((item) => (
              <MenuItem key={item._id} item={item} onAdd={handleAddToCart} />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Clear Cart Dialog */}
      <Portal>
        <Dialog visible={showClearDialog} onDismiss={() => setShowClearDialog(false)}>
          <Dialog.Title>Replace cart items?</Dialog.Title>
          <Dialog.Content>
            <Text>
              Your cart contains items from {cartRestaurant?.name}. Do you want to clear the cart and add items from {restaurant.name}?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowClearDialog(false)}>Cancel</Button>
            <Button onPress={handleClearAndAdd} textColor={theme.colors.primary}>
              Clear & Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
  infoContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderBottomWidth: 8,
    borderBottomColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  vegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vegIcon: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vegText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    marginLeft: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.green[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  ratingText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.green[600],
    marginLeft: 4,
  },
  cuisines: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  menuSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
  },
  menuTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  noMenu: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    padding: theme.spacing.lg,
  },
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
  },
  menuItemContent: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  vegIconSmall: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  vegDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  menuItemPrice: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  menuItemImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  addButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  addButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
});
