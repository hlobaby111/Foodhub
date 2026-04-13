import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, Star, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const RestaurantCard = ({ restaurant, onClick }) => (
  <div
    className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(26,26,26,0.08)] rounded-2xl overflow-hidden border border-border/50 bg-white"
    onClick={onClick}
    data-testid={`restaurant-card-${restaurant._id}`}
  >
    <div className="aspect-[4/3] overflow-hidden relative">
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
    <div className="p-5">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-heading font-semibold text-lg">{restaurant.name}</h3>
        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-sm font-medium">
          <Star className="w-3.5 h-3.5 fill-current" />
          {restaurant.rating?.toFixed(1) || '0.0'}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{restaurant.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {restaurant.cuisineType?.slice(0, 3).map((cuisine, i) => (
          <Badge key={i} variant="secondary" className="rounded-full text-xs font-normal">{cuisine}</Badge>
        ))}
      </div>
      <div className="flex items-center text-xs text-muted-foreground">
        <MapPin className="w-3.5 h-3.5 mr-1" />
        {restaurant.location}
      </div>
    </div>
  </div>
);

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, [page, locationFilter]);

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

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRestaurants();
  };

  const locations = ['Bandra, Mumbai', 'Andheri, Mumbai', 'Juhu, Mumbai', 'Colaba, Mumbai'];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-[50vh] sm:h-[60vh] min-h-[350px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://static.prod-images.emergentagent.com/jobs/d81d7df0-2199-4d49-83c7-9882eb41f4a9/images/f5de0719646ef8441a5fee6af7d92ce172b8983e58d0c2daf2381f8828c8b271.png"
            alt="Food"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-semibold text-white tracking-tight mb-3 sm:mb-4" data-testid="hero-title">
            Discover Local Flavors
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/80 mb-6 sm:mb-8">
            Order from the best restaurants in your city, delivered to your door
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurants or dishes..."
                className="pl-10 h-12 bg-white/95 backdrop-blur-sm border-0 rounded-full text-sm"
                data-testid="search-input"
              />
            </div>
            <Button type="submit" className="h-12 px-6 rounded-full" data-testid="search-button">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Location Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          <Button
            variant={locationFilter === '' ? 'default' : 'secondary'}
            className="rounded-full whitespace-nowrap"
            onClick={() => { setLocationFilter(''); setPage(1); }}
            data-testid="filter-all"
          >
            All Areas
          </Button>
          {locations.map(loc => (
            <Button
              key={loc}
              variant={locationFilter === loc ? 'default' : 'secondary'}
              className="rounded-full whitespace-nowrap"
              onClick={() => { setLocationFilter(loc); setPage(1); }}
              data-testid={`filter-${loc.split(',')[0].toLowerCase()}`}
            >
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {loc}
            </Button>
          ))}
        </div>
      </section>

      {/* Restaurant Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-medium mb-6 sm:mb-8" data-testid="restaurants-heading">
          {locationFilter ? `Restaurants in ${locationFilter}` : 'All Restaurants'}
          <span className="text-sm font-body font-normal text-muted-foreground ml-3">
            {pagination.total} found
          </span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse h-80" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20" data-testid="no-restaurants">
            <p className="text-muted-foreground text-lg">No restaurants found</p>
            <p className="text-sm text-muted-foreground mt-2">Try a different search or location</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" data-testid="restaurant-grid">
              {restaurants.map(restaurant => (
                <RestaurantCard
                  key={restaurant._id}
                  restaurant={restaurant}
                  onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12" data-testid="pagination">
                <Button
                  variant="outline"
                  className="rounded-full"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  data-testid="prev-page"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  className="rounded-full"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(p => p + 1)}
                  data-testid="next-page"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border" style={{ backgroundImage: 'url(https://static.prod-images.emergentagent.com/jobs/d81d7df0-2199-4d49-83c7-9882eb41f4a9/images/156a3ff87eee489a1a81f7635e44d4b57a948af45f6828b682b44c3277a9d018.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-semibold text-lg">FoodHub</h3>
                <p className="text-sm text-muted-foreground">Your local food delivery partner</p>
              </div>
              <p className="text-xs text-muted-foreground">Made with care for your city</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
