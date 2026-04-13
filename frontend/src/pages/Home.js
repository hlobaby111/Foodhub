import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Search, Star, Clock, MapPin, ChevronLeft, ChevronRight,
  Navigation2, Check, X
} from 'lucide-react';

const RestaurantCard = ({ restaurant, onClick }) => (
  <div
    className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(26,26,26,0.08)] rounded-2xl overflow-hidden border border-border/50 bg-white"
    onClick={onClick}
    data-testid={`restaurant-card-${restaurant._id}`}
  >
    <div className="aspect-[16/10] overflow-hidden relative">
      <img
        src={restaurant.coverImage?.url || 'https://images.unsplash.com/photo-1767418238663-d79db1fb7f78?w=600&h=400&fit=crop'}
        alt={restaurant.name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {restaurant.deliveryTime && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {restaurant.deliveryTime}
        </div>
      )}
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between mb-1.5">
        <h3 className="font-heading font-semibold text-base sm:text-lg">{restaurant.name}</h3>
        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs sm:text-sm font-medium flex-shrink-0">
          <Star className="w-3 h-3 fill-current" />
          {restaurant.rating?.toFixed(1) || '0.0'}
        </div>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-1">{restaurant.description}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {restaurant.cuisineType?.slice(0, 3).map((cuisine, i) => (
          <Badge key={i} variant="secondary" className="rounded-full text-[10px] sm:text-xs font-normal px-2 py-0">{cuisine}</Badge>
        ))}
      </div>
      <div className="flex items-center text-xs text-muted-foreground">
        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
        <span className="truncate">{restaurant.location}</span>
      </div>
    </div>
  </div>
);

const Home = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [userLocation, setUserLocation] = useState('Mumbai, Maharashtra');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [tempLocation, setTempLocation] = useState('');
  const navigate = useNavigate();
  const bannerInterval = useRef(null);

  useEffect(() => {
    fetchRestaurants();
    fetchBanners();
  }, [page, locationFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (banners.length > 1) {
      bannerInterval.current = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % banners.length);
      }, 4000);
      return () => clearInterval(bannerInterval.current);
    }
  }, [banners.length]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (locationFilter) params.location = locationFilter;
      const response = await api.get('/api/restaurants', { params });
      setRestaurants(response.data.restaurants);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
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

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRestaurants();
  };

  const handleConfirmLocation = () => {
    if (tempLocation.trim()) {
      setUserLocation(tempLocation.trim());
    }
    setShowLocationDialog(false);
  };

  const locations = ['Bandra, Mumbai', 'Andheri, Mumbai', 'Juhu, Mumbai', 'Colaba, Mumbai'];

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">

      {/* Location Bar */}
      <div className="bg-white border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => { setTempLocation(userLocation); setShowLocationDialog(true); }}
            className="flex items-center gap-2 py-3 w-full sm:w-auto"
            data-testid="location-button"
          >
            <Navigation2 className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs text-muted-foreground leading-none">Deliver to</p>
              <p className="font-heading font-medium text-sm sm:text-base truncate max-w-[250px]">{userLocation}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />
          </button>
        </div>
      </div>

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set your delivery location</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input
              value={tempLocation}
              onChange={(e) => setTempLocation(e.target.value)}
              placeholder="Enter your location..."
              data-testid="location-input"
            />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Popular areas</p>
              {['Mumbai, Maharashtra', 'Bandra West, Mumbai', 'Andheri East, Mumbai', 'Powai, Mumbai', 'Juhu, Mumbai'].map(loc => (
                <button
                  key={loc}
                  className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-muted text-sm"
                  onClick={() => setTempLocation(loc)}
                  data-testid={`quick-location-${loc.split(',')[0].toLowerCase().replace(/\s/g, '-')}`}
                >
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  {loc}
                  {tempLocation === loc && <Check className="w-4 h-4 text-primary ml-auto" />}
                </button>
              ))}
            </div>
            <Button className="w-full rounded-full" onClick={handleConfirmLocation} data-testid="confirm-location-button">
              Confirm Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <form onSubmit={handleSearch} className="relative" data-testid="search-form">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for restaurant, cuisine or a dish"
            className="pl-12 h-12 sm:h-14 bg-white border-border rounded-2xl text-sm sm:text-base shadow-sm"
            data-testid="search-input"
          />
          {search && (
            <button type="button" className="absolute right-14 top-1/2 -translate-y-1/2" onClick={() => { setSearch(''); }}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm" data-testid="search-button">
            Search
          </Button>
        </form>
      </div>

      {/* Banner Carousel */}
      {banners.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6" data-testid="banner-carousel">
          <div className="relative rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[3/1]">
            {banners.map((banner, i) => (
              <div
                key={banner._id}
                className={`absolute inset-0 transition-opacity duration-700 ${i === currentBanner ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 text-white">
                  <h3 className="font-heading font-bold text-xl sm:text-3xl lg:text-4xl">{banner.title}</h3>
                  <p className="text-xs sm:text-sm lg:text-base text-white/80 mt-1">{banner.subtitle}</p>
                </div>
              </div>
            ))}
            {/* Dots */}
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBanner(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentBanner ? 'bg-white w-5' : 'bg-white/50'}`}
                  data-testid={`banner-dot-${i}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location Filter Chips */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          <Button
            variant={locationFilter === '' ? 'default' : 'secondary'}
            size="sm"
            className="rounded-full whitespace-nowrap text-xs sm:text-sm"
            onClick={() => { setLocationFilter(''); setPage(1); }}
            data-testid="filter-all"
          >
            All Areas
          </Button>
          {locations.map(loc => (
            <Button
              key={loc}
              variant={locationFilter === loc ? 'default' : 'secondary'}
              size="sm"
              className="rounded-full whitespace-nowrap text-xs sm:text-sm"
              onClick={() => { setLocationFilter(loc); setPage(1); }}
              data-testid={`filter-${loc.split(',')[0].toLowerCase()}`}
            >
              {loc.split(',')[0]}
            </Button>
          ))}
        </div>
      </section>

      {/* Restaurant Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-12 sm:pb-16">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-heading font-medium mb-5 sm:mb-6" data-testid="restaurants-heading">
          {locationFilter ? `Restaurants in ${locationFilter.split(',')[0]}` : 'All Restaurants'}
          <span className="text-xs sm:text-sm font-body font-normal text-muted-foreground ml-2">
            {pagination.total} places
          </span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse h-72" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16 sm:py-20" data-testid="no-restaurants">
            <p className="text-muted-foreground text-base sm:text-lg">No restaurants found</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">Try a different search or location</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" data-testid="restaurant-grid">
              {restaurants.map(restaurant => (
                <RestaurantCard
                  key={restaurant._id}
                  restaurant={restaurant}
                  onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 sm:gap-4 mt-10 sm:mt-12" data-testid="pagination">
                <Button variant="outline" size="sm" className="rounded-full text-xs sm:text-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="prev-page">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {page} / {pagination.pages}
                </span>
                <Button variant="outline" size="sm" className="rounded-full text-xs sm:text-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} data-testid="next-page">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 border-t border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <h3 className="font-heading font-semibold text-base sm:text-lg">FoodHub</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Your local food delivery partner</p>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Made with care for your city</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
