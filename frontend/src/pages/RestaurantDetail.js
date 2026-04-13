import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Star, Clock, MapPin, Plus, Minus, ArrowLeft } from 'lucide-react';

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, cartItems, updateQuantity } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchRestaurant();
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const response = await api.get(`/api/restaurants/${id}`);
      setRestaurant(response.data.restaurant);
      setMenuItems(response.data.menuItems);
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
      toast.error('Restaurant not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    addToCart(item, restaurant);
    toast.success(`${item.name} added to cart`);
  };

  const getCartQuantity = (itemId) => {
    const item = cartItems.find(i => i._id === itemId);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) return null;

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen" data-testid="restaurant-detail-page">
      {/* Cover Image */}
      <div className="relative h-[40vh] max-h-[60vh] overflow-hidden">
        <img
          src={restaurant.coverImage?.url || 'https://images.unsplash.com/photo-1770629681079-86c4d2adb83f?w=1200&h=600&fit=crop'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      {/* Restaurant Info */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-10">
        <div className="bg-white rounded-t-3xl p-8 shadow-[0_-8px_32px_rgba(26,26,26,0.06)]" data-testid="restaurant-info">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-semibold" data-testid="restaurant-name">{restaurant.name}</h1>
              <p className="text-muted-foreground mt-2">{restaurant.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {restaurant.cuisineType?.map((cuisine, i) => (
                  <Badge key={i} variant="secondary" className="rounded-full">{cuisine}</Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                <Star className="w-4 h-4 fill-current" />
                {restaurant.rating?.toFixed(1)} <span className="font-normal text-xs">({restaurant.totalReviews})</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{restaurant.deliveryTime}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{restaurant.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white px-8 py-4 border-t border-border/50">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'secondary'}
                className="rounded-full whitespace-nowrap capitalize"
                onClick={() => setSelectedCategory(cat)}
                data-testid={`category-${cat}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white px-8 pb-8 rounded-b-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6" data-testid="menu-items-grid">
            {filteredItems.map(item => {
              const qty = getCartQuantity(item._id);
              return (
                <div
                  key={item._id}
                  className="flex gap-4 p-4 rounded-xl border border-border/50 transition-all duration-300 hover:shadow-sm"
                  data-testid={`menu-item-${item._id}`}
                >
                  <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.image?.url || 'https://images.unsplash.com/photo-1617686578451-46fa5f114c9d?w=200&h=200&fit=crop'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {item.isVegetarian && (
                          <span className="w-4 h-4 border-2 border-green-600 rounded-sm flex items-center justify-center">
                            <span className="w-2 h-2 bg-green-600 rounded-full" />
                          </span>
                        )}
                        <h3 className="font-heading font-medium">{item.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-lg">&#8377;{item.price}</span>
                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-primary/10 rounded-full px-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateQuantity(item._id, qty - 1)}
                            data-testid={`decrease-${item._id}`}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-medium text-sm w-6 text-center">{qty}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleAddToCart(item)}
                            data-testid={`increase-${item._id}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleAddToCart(item)}
                          data-testid={`add-to-cart-${item._id}`}
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
};

export default RestaurantDetail;
