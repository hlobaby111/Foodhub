import { Link } from 'react-router-dom';
import { Store, TrendingUp, Users, Clock, ArrowRight, CheckCircle2, BarChart3, ChefHat } from 'lucide-react';

export default function LandingPage() {
  const stats = [
    { value: "50K+", label: "Partner Restaurants" },
    { value: "₹500Cr+", label: "Monthly Sales" },
    { value: "2M+", label: "Daily Orders" },
    { value: "98%", label: "Partner Satisfaction" },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      desc: "Reach millions of customers and increase your revenue by 3x with Foodhub.",
    },
    {
      icon: Users,
      title: "Expand Customer Base",
      desc: "Tap into a loyal community of food lovers in your city.",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      desc: "Track orders, revenue, and customer insights from one dashboard.",
    },
    {
      icon: Clock,
      title: "Quick Onboarding",
      desc: "Go live on Foodhub within 48 hours of registration.",
    },
  ];

  const steps = [
    { num: "01", title: "Register", desc: "Sign up with your restaurant details in 2 minutes" },
    { num: "02", title: "Upload Menu", desc: "Add dishes, prices, and mouth-watering photos" },
    { num: "03", title: "Start Receiving Orders", desc: "Go live and start earning instantly" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <ChefHat className="text-white" size={22} />
            </div>
            <span className="text-2xl font-bold text-dark">Foodhub <span className="text-primary">Partner</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-dark font-medium hover:text-primary transition-colors">
              Login
            </Link>
            <Link to="/register" className="btn-primary">
              Register Restaurant
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light via-white to-white" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-4 py-1.5 bg-primary-light text-primary rounded-full text-sm font-semibold mb-4">
              🚀 Trusted by 50,000+ restaurants
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-dark leading-tight mb-6">
              Grow your restaurant with <span className="text-primary">Foodhub</span>
            </h1>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Join India's fastest growing food delivery network. Reach millions of customers, increase sales, and manage everything from one powerful dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="btn-primary flex items-center justify-center gap-2">
                Register Your Restaurant <ArrowRight size={20} />
              </Link>
              <a href="#benefits" className="btn-outline text-center">
                Learn More
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6">
              {["✓ Zero setup fee", "✓ 0% commission for 30 days", "✓ 24/7 support"].map((t) => (
                <span key={t} className="text-sm font-medium text-gray-700">{t}</span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-8 -right-8 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <img
              src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800"
              alt="Restaurant"
              className="relative rounded-2xl shadow-2xl w-full"
            />
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-hover p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg. Revenue Growth</p>
                <p className="text-lg font-bold text-dark">+287%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-dark">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold text-primary mb-2">{s.value}</p>
              <p className="text-gray-300 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="benefits" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-dark mb-4">
            Why partner with <span className="text-primary">Foodhub?</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Everything you need to run a successful online food business
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div key={b.title} className="card hover:shadow-hover transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                <b.icon className="text-primary" size={28} />
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">{b.title}</h3>
              <p className="text-gray-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-dark mb-4">
              Get started in <span className="text-primary">3 simple steps</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="relative">
                <div className="card text-center">
                  <span className="text-6xl font-extrabold text-primary/20 block mb-4">{s.num}</span>
                  <h3 className="text-2xl font-bold text-dark mb-3">{s.title}</h3>
                  <p className="text-gray-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-dark mb-6">
              Documents you'll need
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Keep these ready to complete your registration in under 10 minutes.
            </p>
            <ul className="space-y-4">
              {[
                "FSSAI License (Food Safety Registration)",
                "GST Number (if applicable)",
                "Bank Account Details for Payouts",
                "Restaurant PAN Card",
                "Menu with Photos & Prices",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="text-primary mt-0.5 flex-shrink-0" size={22} />
                  <span className="text-gray-800 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <img
            src="https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800"
            alt="Documents"
            className="rounded-2xl shadow-hover"
          />
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Store className="mx-auto text-white mb-6" size={56} />
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to grow with Foodhub?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Join 50,000+ restaurant partners already succeeding on our platform.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-4 rounded-lg hover:scale-105 transition-transform shadow-hover">
            Register Your Restaurant <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <footer className="bg-dark text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Foodhub Partner. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
