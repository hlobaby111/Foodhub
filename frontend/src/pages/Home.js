import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import LocationModal from '../components/LocationModal';
import {
  Search, Star, Clock, MapPin, ChevronLeft, ChevronRight,
  Navigation2, Check, X, ShoppingCart, Leaf, Plus
} from 'lucide-react';

const RestaurantCard = ({ restaurant, onClick }) => {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = restaurant.photos?.length > 0
    ? restaurant.photos.map(p => p.url)
    : [restaurant.coverImage?.url || 'https://images.unsplash.com/photo-1767418238663-d79db1fb7f78?w=600&h=400&fit=crop'];

  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => setPhotoIdx(i => (i + 1) % photos.length), 4000);
    return () => clearInterval(t);
  }, [photos.length]);

  return (
    <div
      className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(26,26,26,0.08)] rounded-2xl overflow-hidden border border-border/50 bg-white"
      onClick={onClick}
      data-testid={`restaurant-card-${restaurant._id}`}
    >
      {/* Photo carousel */}
      <div className="aspect-[16/10] overflow-hidden relative">
        {photos.map((url, i) => (
          <img key={`${restaurant._id}-img-${i}`} src={url} alt={restaurant.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === photoIdx ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        {photos.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {photos.map((_, i) => (
              <span key={`${restaurant._id}-dot-${i}`} className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIdx ? 'bg-white w-3' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
        {restaurant.deliveryTime && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {restaurant.deliveryTime}
          </div>
        )}
      </div>
      {/* Details */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-heading font-semibold text-base sm:text-lg leading-tight">{restaurant.name}</h3>
          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2">
            <Star className="w-3 h-3 fill-current" />
            {restaurant.rating?.toFixed(1) || '0.0'}
          </div>
        </div>
        {/* Delivery estimate */}
        <p className="text-xs text-green-600 font-medium mb-1.5">{restaurant.avgPrepTime || 25}-{(restaurant.avgPrepTime || 25) + 15} min</p>
        {/* Dotted separator */}
        <div className="border-t border-dotted border-border/40 my-2" />
        {/* Veg/Non-veg + cuisines */}
        <div className="flex items-center gap-2 text-xs">
          {restaurant.isVeg ? (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <span className="w-3.5 h-3.5 border-2 border-green-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full" /></span>
              Pure Veg
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-500 font-medium">
              <span className="w-3.5 h-3.5 border-2 border-red-500 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" /></span>
              Non-Veg
            </span>
          )}
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground truncate">{restaurant.cuisineType?.slice(0, 2).join(', ')}</span>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const { cartCount, cartTotal, cartRestaurant, clearCart } = useCart();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [userLocation, setUserLocation] = useState('Mumbai, Maharashtra');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const navigate = useNavigate();
  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchRestaurants();
    fetchBanners();
  }, [page, locationFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (banners.length > 1) {
      const t = setInterval(() => setCurrentBanner(p => (p + 1) % banners.length), 4000);
      return () => clearInterval(t);
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
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchBanners = async () => {
    try { const r = await api.get('/api/banners'); setBanners(r.data.banners || []); } catch (e) {}
  };

  // Instant search with debounce
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim()) { setSearchResults(null); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const r = await api.get('/api/search', { params: { q: value } });
        setSearchResults(r.data);
      } catch (e) { setSearchResults(null); }
    }, 500);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      setSearchResults(null);
      setPage(1);
      fetchRestaurants();
    }
  };

  const handleLocationSelect = (location) => {
    const label = location.city ? `${location.address}, ${location.city}` : location.address;
    if (label) {
      setUserLocation(label);
    }
    setShowLocationModal(false);
  };

  const locations = ['Bandra, Mumbai', 'Andheri, Mumbai', 'Juhu, Mumbai', 'Colaba, Mumbai'];

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      {/* Location Bar */}
      <div className="bg-white border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <button onClick={() => setShowLocationModal(true)} className="flex items-center gap-2 py-3 w-full sm:w-auto" data-testid="location-button">
            <Navigation2 className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-left">
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-none">Deliver to</p>
              <p className="font-heading font-medium text-sm truncate max-w-[250px]">{userLocation}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />
          </button>
        </div>
      </div>

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
      />

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 relative">
        <form onSubmit={handleSearchSubmit} className="relative" data-testid="search-form">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search for restaurant, cuisine or a dish" className="pl-12 h-12 sm:h-14 bg-white border-border rounded-2xl text-sm sm:text-base shadow-sm" data-testid="search-input" />
          {search && <button type="button" className="absolute right-14 top-1/2 -translate-y-1/2" onClick={() => { setSearch(''); setSearchResults(null); }}><X className="w-4 h-4 text-muted-foreground" /></button>}
          <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-9 sm:h-10 px-4 text-xs sm:text-sm" data-testid="search-button">Search</Button>
        </form>

        {/* Instant search dropdown */}
        {searchResults && (
          <div className="absolute left-4 right-4 sm:left-6 sm:right-6 top-full mt-1 bg-white rounded-2xl border border-border shadow-lg z-40 max-h-[60vh] overflow-y-auto" data-testid="search-results-dropdown">
            {searchResults.restaurants?.length > 0 && (
              <div className="p-3">
                <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Restaurants</p>
                {searchResults.restaurants.map(r => (
                  <button key={r._id} className="flex items-center gap-3 w-full text-left p-2.5 rounded-xl hover:bg-muted transition-colors" onClick={() => { setSearchResults(null); setSearch(''); navigate(`/restaurant/${r._id}`); }} data-testid={`search-result-${r._id}`}>
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img src={r.photos?.[0]?.url || r.coverImage?.url || 'https://images.unsplash.com/photo-1767418238663-d79db1fb7f78?w=100&h=100&fit=crop'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0"><p className="font-medium text-sm truncate">{r.name}</p><p className="text-xs text-muted-foreground truncate">{r.cuisineType?.join(', ')}</p></div>
                    <div className="ml-auto flex items-center gap-1 text-xs text-green-700"><Star className="w-3 h-3 fill-current" />{r.rating?.toFixed(1)}</div>
                  </button>
                ))}
              </div>
            )}
            {searchResults.dishMatches?.length > 0 && (
              <div className="p-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Dishes</p>
                {searchResults.dishMatches.map((r, i) => (
                  <button key={i} className="flex items-center gap-3 w-full text-left p-2.5 rounded-xl hover:bg-muted" onClick={() => { setSearchResults(null); setSearch(''); navigate(`/restaurant/${r._id}`); }}>
                    <div className="min-w-0"><p className="font-medium text-sm">{r.matchedDish}</p><p className="text-xs text-muted-foreground">{r.name}</p></div>
                  </button>
                ))}
              </div>
            )}
            {(!searchResults.restaurants?.length && !searchResults.dishMatches?.length) && (
              <div className="p-6 text-center text-sm text-muted-foreground">No results found</div>
            )}
          </div>
        )}
      </div>

      {/* Banner Carousel */}
      {banners.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5" data-testid="banner-carousel">
          <div className="relative rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[3/1]">
            {banners.map((b, i) => (
              <div key={b._id} className={`absolute inset-0 transition-opacity duration-700 ${i === currentBanner ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 text-white">
                  <h3 className="font-heading font-bold text-xl sm:text-3xl">{b.title}</h3>
                  <p className="text-xs sm:text-sm text-white/80 mt-1">{b.subtitle}</p>
                </div>
              </div>
            ))}
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {banners.map((_, i) => (<button key={i} onClick={() => setCurrentBanner(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentBanner ? 'bg-white w-5' : 'bg-white/50'}`} />))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          <Button variant={!locationFilter ? 'default' : 'secondary'} size="sm" className="rounded-full whitespace-nowrap text-xs" onClick={() => { setLocationFilter(''); setPage(1); }} data-testid="filter-all">All</Button>
          {locations.map(loc => (<Button key={loc} variant={locationFilter === loc ? 'default' : 'secondary'} size="sm" className="rounded-full whitespace-nowrap text-xs" onClick={() => { setLocationFilter(loc); setPage(1); }} data-testid={`filter-${loc.split(',')[0].toLowerCase()}`}>{loc.split(',')[0]}</Button>))}
        </div>
      </section>

      {/* Restaurant Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-32">
        <h2 className="text-lg sm:text-xl font-heading font-medium mb-5" data-testid="restaurants-heading">
          {locationFilter ? `In ${locationFilter.split(',')[0]}` : 'All Restaurants'}
          <span className="text-xs font-body font-normal text-muted-foreground ml-2">{pagination.total} places</span>
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">{[...Array(6)].map((_, i) => (<div key={i} className="rounded-2xl bg-muted animate-pulse h-72" />))}</div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16" data-testid="no-restaurants"><p className="text-muted-foreground">No restaurants found</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" data-testid="restaurant-grid">
              {restaurants.map(r => (<RestaurantCard key={r._id} restaurant={r} onClick={() => navigate(`/restaurant/${r._id}`)} />))}
            </div>
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10" data-testid="pagination">
                <Button variant="outline" size="sm" className="rounded-full text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="text-xs text-muted-foreground">{page}/{pagination.pages}</span>
                <Button variant="outline" size="sm" className="rounded-full text-xs" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Persistent Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3" data-testid="home-cart-bar">
          <div className="max-w-7xl mx-auto">
            <div className="bg-primary text-primary-foreground rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-[0_-4px_24px_rgba(224,93,54,0.3)]">
              <button onClick={() => navigate('/cart')} className="flex items-center gap-3 flex-1" data-testid="home-view-cart">
                <div className="bg-white/20 rounded-full p-2"><ShoppingCart className="w-5 h-5" /></div>
                <div className="text-left">
                  <p className="font-semibold text-sm">{cartCount} item{cartCount > 1 ? 's' : ''} | &#8377;{cartTotal}</p>
                  <p className="text-[11px] opacity-80">{cartRestaurant?.name}</p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/cart')} className="bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium" data-testid="home-view-cart-btn">View Cart</button>
                <button onClick={clearCart} className="bg-white/20 rounded-full p-1.5 hover:bg-white/30 transition-colors" data-testid="home-clear-cart"><X className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left"><h3 className="font-heading font-semibold">FoodHub</h3><p className="text-xs text-muted-foreground">Your local food delivery partner</p></div>
          <p className="text-[10px] text-muted-foreground">Made with care for your city</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
