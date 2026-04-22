import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, MapPin, DollarSign, Clock, TrendingUp, Shield, ArrowRight, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: DollarSign,
      title: 'Earn More',
      description: 'Flexible hours, competitive pay per delivery',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Clock,
      title: 'Flexible Schedule',
      description: 'Work when you want, as much as you want',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: MapPin,
      title: 'Local Deliveries',
      description: 'Deliver in your area, routes you know',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Shield,
      title: 'Insurance Covered',
      description: 'Full insurance coverage during deliveries',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  const stats = [
    { value: '50,000+', label: 'Active Partners' },
    { value: '₹25,000', label: 'Avg. Monthly Earnings' },
    { value: '4.8/5', label: 'Partner Rating' },
    { value: '24/7', label: 'Support Available' }
  ];

  const steps = [
    { step: '1', title: 'Sign Up', desc: 'Register with your details' },
    { step: '2', title: 'Get Verified', desc: 'Upload required documents' },
    { step: '3', title: 'Start Earning', desc: 'Accept deliveries and earn' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FoodHub Delivery</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Partner Login
            </button>
          </div>
        </div>
      </nav>

      <section className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4" />
                Join 50,000+ Delivery Partners
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Earn Money on
                <span className="text-green-600"> Your Schedule</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Become a delivery partner and earn up to ₹25,000/month. Flexible hours, instant payouts, and full support.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:scale-105"
                >
                  Start Earning Today
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl border-2 border-gray-200 transition-all"
                >
                  Partner Login
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {stats.slice(0, 2).map((stat, i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                    <p className="text-3xl font-bold text-green-600 mb-1">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:block hidden">
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&h=600&fit=crop"
                  alt="Delivery Partner"
                  className="rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-6 animate-float">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Today's Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">₹1,240</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Partner With Us?
            </h2>
            <p className="text-xl text-gray-600">
              Join India's fastest-growing delivery network
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Easy Steps
            </h2>
            <p className="text-xl text-gray-600">
              Start earning within 24 hours
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-green-200 transition-all hover:shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.desc}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-green-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl lg:text-5xl font-bold mb-2">{stat.value}</p>
                <p className="text-green-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                What You Need
              </h2>
              <div className="space-y-4">
                {[
                  "Valid Driver's License",
                  'Own Vehicle (Bike/Scooter)',
                  'Smartphone with GPS',
                  'Aadhaar & PAN Card',
                  'Age 18+ years',
                  'Basic English/Hindi'
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{req}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Start?
              </h3>
              <p className="text-gray-600 mb-6">
                Join thousands of delivery partners earning great money on their own schedule.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Apply Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FoodHub Delivery</span>
            </div>
            <p className="text-sm">© 2024 FoodHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
