import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || ''
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/auth/profile', formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8" data-testid="profile-page">
      <h1 className="text-2xl sm:text-3xl font-heading font-semibold mb-8">My Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-border/50 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-heading font-medium">Personal Info</h2>
          </div>
          <div>
            <Label>Full Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
              data-testid="profile-name-input"
            />
          </div>
          <div>
            <Label>Email</Label>
            <div className="flex items-center gap-2 mt-1 p-2 bg-muted rounded-xl text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              {user?.email}
            </div>
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1"
              data-testid="profile-phone-input"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-border/50 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-heading font-medium">Delivery Address</h2>
          </div>
          <div>
            <Label>Street</Label>
            <Input
              value={formData.address.street}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
              className="mt-1"
              data-testid="profile-street-input"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>City</Label>
              <Input
                value={formData.address.city}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                className="mt-1"
                data-testid="profile-city-input"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={formData.address.state}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input
                value={formData.address.pincode}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                className="mt-1"
                data-testid="profile-pincode-input"
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="rounded-full" disabled={loading} data-testid="save-profile-button">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
};

export default Profile;
