import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Star, Clock, MapPin, Plus, Minus, ArrowLeft, ShoppingCart, User } from 'lucide-react';

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const isCartFromThisRestaurant = cartRestaurant && cartRestaurant._id === id;
  const showCartBar = cartCount > 0 && isCartFromThisRestaurant;

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
    <div className="min-h-screen pb-24" data-testid="restaurant-detail-page">
      {/* Cover Image */}
      <div className="relative h-[30vh] sm:h-[40vh] max-h-[60vh] overflow-hidden">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-10">
        <div className="bg-white rounded-t-3xl p-5 sm:p-8 shadow-[0_-8px_32px_rgba(26,26,26,0.06)]" data-testid="restaurant-info">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-semibold" data-testid="restaurant-name">{restaurant.name}</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">{restaurant.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {restaurant.cuisineType?.map((cuisine, i) => (
                  <Badge key={i} variant="secondary" className="rounded-full text-xs">{cuisine}</Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-row md:flex-col items-start md:items-end gap-2">
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                <Star className="w-4 h-4 fill-current" />
                {restaurant.rating?.toFixed(1)} <span className="font-normal text-xs">({restaurant.totalReviews})</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{restaurant.deliveryTime}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{restaurant.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white px-4 sm:px-8 py-4 border-t border-border/50">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'secondary'}
                size="sm"
                className="rounded-full whitespace-nowrap capitalize text-xs sm:text-sm"
                onClick={() => setSelectedCategory(cat)}
                data-testid={`category-${cat}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white px-4 sm:px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-6" data-testid="menu-items-grid">
            {filteredItems.map(item => {
              const qty = getCartQuantity(item._id);
              return (
                <div
                  key={item._id}
                  className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border/50 transition-all duration-300 hover:shadow-sm"
                  data-testid={`menu-item-${item._id}`}
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.image?.url || 'https://images.unsplash.com/photo-1617686578451-46fa5f114c9d?w=200&h=200&fit=crop'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2">
                        {item.isVegetarian && (
                          <span className="w-4 h-4 border-2 border-green-600 rounded-sm flex items-center justify-center flex-shrink-0">
                            <span className="w-2 h-2 bg-green-600 rounded-full" />
                          </span>
                        )}
                        <h3 className="font-heading font-medium text-sm sm:text-base truncate">{item.name}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                      {item.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-muted-foreground">{item.rating?.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-base sm:text-lg">&#8377;{item.price}</span>
                      {qty > 0 ? (
                        <div className="flex items-center gap-1 sm:gap-2 bg-primary text-primary-foreground rounded-full px-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full text-primary-foreground hover:text-primary-foreground hover:bg-white/20"
                            onClick={() => updateQuantity(item._id, qty - 1)}
                            data-testid={`decrease-${item._id}`}
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <span className="font-medium text-sm w-5 sm:w-6 text-center">{qty}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full text-primary-foreground hover:text-primary-foreground hover:bg-white/20"
                            onClick={() => handleAddToCart(item)}
                            data-testid={`increase-${item._id}`}
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="rounded-full text-xs sm:text-sm"
                          onClick={() => handleAddToCart(item)}
                          data-testid={`add-to-cart-${item._id}`}
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white px-4 sm:px-8 py-8 rounded-b-3xl border-t border-border/50" data-testid="reviews-section">
          <h2 className="font-heading font-medium text-lg sm:text-xl mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Ratings & Reviews
            {reviews.length > 0 && <span className="text-sm font-body font-normal text-muted-foreground">({reviews.length})</span>}
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No reviews yet. Be the first to review after your order!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review._id} className="border-b border-border/50 pb-4 last:border-0" data-testid={`review-${review._id}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{review.customer?.name || 'Customer'}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-muted'}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground ml-11">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Cart Bar */}
      {showCartBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4" data-testid="sticky-cart-bar">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate('/cart')}
              className="w-full bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-between shadow-[0_-4px_24px_rgba(224,93,54,0.3)] transition-all duration-300 hover:shadow-[0_-4px_32px_rgba(224,93,54,0.4)]"
              data-testid="view-cart-button"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm sm:text-base">{cartCount} {cartCount === 1 ? 'item' : 'items'}</p>
                  <p className="text-xs opacity-80">from {restaurant.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base sm:text-lg">&#8377;{cartTotal}</span>
                <span className="bg-white/20 rounded-full px-3 py-1 text-sm font-medium">View Cart</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;
