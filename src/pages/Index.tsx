import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Phone, MapPin, CreditCard, Star, MapPinned, Key } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import heroTaxi from '@/assets/hero-taxi.png';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [showAllCities, setShowAllCities] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [sections, setSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchServices();
    fetchCities();
    fetchTestimonials();
    fetchSections();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (data) setServices(data);
  };

  const fetchCities = async () => {
    const { data } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (data) setCities(data);
  };

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from('ratings')
      .select(`
        id,
        rating,
        review,
        created_at,
        customer_id,
        featured,
        profiles!ratings_customer_id_fkey(full_name),
        service_requests!inner(service_type, location)
      `)
      .eq('featured', true)
      .gte('rating', 4)
      .not('review', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (data) setTestimonials(data);
  };

  const fetchSections = async () => {
    const { data } = await supabase
      .from('homepage_sections')
      .select('name, is_active');
    
    if (data) {
      const sectionsMap: Record<string, boolean> = {};
      data.forEach(section => {
        sectionsMap[section.name] = section.is_active;
      });
      setSections(sectionsMap);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Settings;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const howItWorks = [
    { icon: Phone, title: 'Request Assistance', desc: 'Use our app or website to submit help. Provide your location and describe your emergency.' },
    { icon: MapPin, title: 'Track Your Rescue', desc: 'Monitor the arrival of your rescue team in real time. Know exactly when help will arrive.' },
    { icon: CreditCard, title: 'Pay with Mobile Money', desc: 'Once service is complete, easily pay using any Ghana mobile money provider (MTN, Vodafone, or AirtelTigo).' },
  ];

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />

      {/* Compact Banner */}
      <section className="bg-gradient-to-r from-primary to-primary/90 border-b border-primary/20 pt-16 relative overflow-hidden">
        {/* Animated Illustration Scene - Right Side */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 lg:w-1/3 pointer-events-none opacity-10 lg:opacity-20">
          {/* Road/Path */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
            <path 
              d="M 50 100 Q 150 50 250 100" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeDasharray="10 5"
              className="text-white/30 animate-road-line"
            />
          </svg>
          
          {/* Tow Truck Illustration */}
          <div className="absolute right-2 lg:right-10 top-1/2 -translate-y-1/2 animate-float-truck scale-50 lg:scale-100">
            <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
              {/* Truck Body */}
              <rect x="40" y="30" width="60" height="25" rx="3" fill="currentColor" className="text-white/80" />
              <rect x="20" y="35" width="25" height="20" rx="2" fill="currentColor" className="text-white/80" />
              
              {/* Tow Crane */}
              <line x1="95" y1="30" x2="110" y2="15" stroke="currentColor" strokeWidth="3" className="text-accent" />
              <line x1="110" y1="15" x2="110" y2="45" stroke="currentColor" strokeWidth="2" className="text-accent/60" strokeDasharray="2 2" />
              
              {/* Windows */}
              <rect x="22" y="37" width="8" height="8" rx="1" fill="currentColor" className="text-primary/40" />
              <rect x="32" y="37" width="10" height="8" rx="1" fill="currentColor" className="text-primary/40" />
              
              {/* Wheels */}
              <g className="animate-wheel-spin origin-center" style={{ transformBox: 'fill-box' }}>
                <circle cx="35" cy="58" r="8" fill="currentColor" className="text-white/60" />
                <circle cx="35" cy="58" r="4" fill="currentColor" className="text-white/90" />
              </g>
              <g className="animate-wheel-spin origin-center" style={{ transformBox: 'fill-box' }}>
                <circle cx="85" cy="58" r="8" fill="currentColor" className="text-white/60" />
                <circle cx="85" cy="58" r="4" fill="currentColor" className="text-white/90" />
              </g>
              
              {/* Lights */}
              <circle cx="102" cy="45" r="2" fill="currentColor" className="text-yellow-300 animate-pulse" />
            </svg>
          </div>
          
          {/* Floating Service Icons */}
          <div className="absolute left-2 lg:left-10 top-20 animate-float scale-75 lg:scale-100" style={{ animationDelay: '0s' }}>
            <Key className="w-6 lg:w-8 h-6 lg:h-8 text-white/40" />
          </div>
          <div className="absolute right-20 lg:right-32 bottom-20 animate-float scale-75 lg:scale-100" style={{ animationDelay: '1s' }}>
            <MapPin className="w-5 lg:w-6 h-5 lg:h-6 text-white/40" />
          </div>
        </div>
        
        {/* Animated Illustration Scene - Left Side */}
        <div className="absolute left-0 top-0 bottom-0 w-1/2 lg:w-1/3 pointer-events-none opacity-10 lg:opacity-20">
          {/* Road/Path */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
            <path 
              d="M 250 100 Q 150 150 50 100" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeDasharray="10 5"
              className="text-white/30 animate-road-line"
            />
          </svg>
          
          {/* Service Van Illustration */}
          <div className="absolute left-2 lg:left-10 top-1/2 -translate-y-1/2 animate-float scale-50 lg:scale-100" style={{ animationDelay: '0.5s' }}>
            <svg width="100" height="70" viewBox="0 0 100 70" fill="none">
              {/* Van Body */}
              <rect x="15" y="25" width="70" height="25" rx="3" fill="currentColor" className="text-white/80" />
              
              {/* Van Front */}
              <path d="M 15 35 L 10 40 L 10 48 L 15 50 Z" fill="currentColor" className="text-white/80" />
              
              {/* Windows */}
              <rect x="20" y="28" width="12" height="10" rx="1" fill="currentColor" className="text-primary/40" />
              <rect x="35" y="28" width="20" height="10" rx="1" fill="currentColor" className="text-primary/40" />
              <rect x="58" y="28" width="20" height="10" rx="1" fill="currentColor" className="text-primary/40" />
              
              {/* Service Icon/Logo */}
              <circle cx="65" cy="40" r="6" stroke="currentColor" strokeWidth="1.5" className="text-accent" fill="none" />
              <path d="M 62 40 L 68 40 M 65 37 L 65 43" stroke="currentColor" strokeWidth="1.5" className="text-accent" />
              
              {/* Wheels */}
              <g className="animate-wheel-spin origin-center" style={{ transformBox: 'fill-box' }}>
                <circle cx="30" cy="52" r="6" fill="currentColor" className="text-white/60" />
                <circle cx="30" cy="52" r="3" fill="currentColor" className="text-white/90" />
              </g>
              <g className="animate-wheel-spin origin-center" style={{ transformBox: 'fill-box' }}>
                <circle cx="70" cy="52" r="6" fill="currentColor" className="text-white/60" />
                <circle cx="70" cy="52" r="3" fill="currentColor" className="text-white/90" />
              </g>
              
              {/* Headlight */}
              <circle cx="8" cy="42" r="1.5" fill="currentColor" className="text-yellow-300 animate-pulse" />
            </svg>
          </div>
          
          {/* Floating Service Icons */}
          <div className="absolute right-2 lg:right-10 top-16 animate-float scale-75 lg:scale-100" style={{ animationDelay: '0.5s' }}>
            <LucideIcons.Wrench className="w-5 lg:w-7 h-5 lg:h-7 text-white/40" />
          </div>
          <div className="absolute left-20 lg:left-32 bottom-16 animate-float scale-75 lg:scale-100" style={{ animationDelay: '1.5s' }}>
            <LucideIcons.Zap className="w-5 lg:w-6 h-5 lg:h-6 text-white/40" />
          </div>
          <div className="absolute left-8 lg:left-20 top-1/3 animate-float scale-75 lg:scale-100" style={{ animationDelay: '2s' }}>
            <LucideIcons.Fuel className="w-4 lg:w-5 h-4 lg:h-5 text-white/40" />
          </div>
        </div>
        
        {/* Animated Elements - Center/Middle Area */}
        <div className="absolute inset-0 pointer-events-none opacity-10 lg:opacity-15">
          {/* Top center floating icons */}
          <div className="absolute left-1/2 -translate-x-1/2 top-12 animate-float scale-75 lg:scale-100" style={{ animationDelay: '0.3s' }}>
            <LucideIcons.CircleDot className="w-3 lg:w-4 h-3 lg:h-4 text-accent" />
          </div>
          <div className="absolute left-1/3 top-16 animate-float scale-75 lg:scale-100" style={{ animationDelay: '1.2s' }}>
            <LucideIcons.Gauge className="w-5 lg:w-6 h-5 lg:h-6 text-white/50" />
          </div>
          <div className="absolute right-1/3 top-20 animate-float scale-75 lg:scale-100" style={{ animationDelay: '2.1s' }}>
            <LucideIcons.Shield className="w-4 lg:w-5 h-4 lg:h-5 text-white/50" />
          </div>
          
          {/* Bottom center floating icons */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-8 animate-float scale-75 lg:scale-100" style={{ animationDelay: '1.8s' }}>
            <LucideIcons.Radio className="w-4 lg:w-5 h-4 lg:h-5 text-white/50" />
          </div>
          <div className="absolute left-1/3 bottom-12 animate-float scale-75 lg:scale-100" style={{ animationDelay: '0.9s' }}>
            <LucideIcons.Navigation className="w-3 lg:w-4 h-3 lg:h-4 text-accent/60" />
          </div>
          <div className="absolute right-1/3 bottom-16 animate-float scale-75 lg:scale-100" style={{ animationDelay: '1.5s' }}>
            <LucideIcons.Timer className="w-5 lg:w-6 h-5 lg:h-6 text-white/50" />
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Emergency Roadside Assistance
              </h1>
              
              {/* Animated Status Badges */}
              <div className="flex flex-wrap gap-2 md:gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {/* 24/7 Live Support Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all group cursor-default">
                  <div className="relative flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-xs md:text-sm font-medium whitespace-nowrap">24/7 Live Support</span>
                </div>

                {/* Response Time Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all group cursor-default animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:scale-125 transition-transform"></div>
                  <span className="text-xs md:text-sm font-medium whitespace-nowrap">30min Avg Response</span>
                </div>

                {/* Coverage Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all group cursor-default animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <MapPinned className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs md:text-sm font-medium whitespace-nowrap">Ghana-wide Coverage</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => navigate('/get-help')} 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Request Help Now
              </Button>
              <Button 
                onClick={() => navigate('/track-rescue')} 
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm hover:scale-105 transition-all"
              >
                Track Rescue
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Compact grid on mobile */}
      {sections.services && (
      <section id="services" className="py-12 lg:py-24 bg-[hsl(var(--section-bg))] relative">
        {/* Decorative elements - hidden on mobile */}
        <div className="hidden lg:block absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="hidden lg:block absolute bottom-10 right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-8 lg:mb-16 animate-fade-in">
            <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-primary/10 text-primary rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
              Our Services
            </div>
            <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-4">Complete Roadside Assistance</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm lg:text-lg px-4">
              Professional help for any roadside emergency. Ready 24/7 across Ghana.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
            {services.map((service, index) => {
              const Icon = getIconComponent(service.icon);
              return (
                <Card 
                  key={service.id} 
                  className="p-4 lg:p-8 hover-lift cursor-pointer group border-2 hover:border-primary/20 bg-gradient-to-br from-white to-gray-50/50 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/request-service?service=${service.slug}`)}
                >
                  <div className="bg-primary/10 rounded-xl lg:rounded-2xl w-10 h-10 lg:w-16 lg:h-16 flex items-center justify-center mb-3 lg:mb-6 group-hover:bg-primary/20 transition-colors group-hover:scale-110 transition-transform duration-300 mx-auto lg:mx-0">
                    <Icon className="h-5 w-5 lg:h-8 lg:w-8 text-primary" />
                  </div>
                  <h3 className="text-sm lg:text-xl font-bold mb-2 lg:mb-3 group-hover:text-primary transition-colors text-center lg:text-left">{service.name}</h3>
                  <p className="text-muted-foreground leading-relaxed text-xs lg:text-base hidden lg:block">{service.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* How It Works Section - Horizontal scroll on mobile */}
      {sections.how_it_works && (
      <section id="how-it-works" className="py-8 lg:py-24 bg-gradient-to-b from-background to-[hsl(var(--section-bg))] relative overflow-hidden">
        {/* Connection lines decoration - hidden on mobile */}
        <div className="absolute inset-0 opacity-10 hidden lg:block">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" className="text-primary" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-6 lg:mb-16 animate-fade-in">
            <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-accent/10 text-accent-foreground rounded-full text-xs lg:text-sm font-semibold mb-2 lg:mb-4">
              Simple Process
            </div>
            <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm lg:text-lg px-4">
              Get help in three easy steps.
            </p>
          </div>

          {/* Mobile: Two rows with last item centered */}
          <div className="grid grid-cols-2 md:hidden gap-x-4 gap-y-6 max-w-md mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className={cn(
                "text-center relative animate-scale-in",
                index === howItWorks.length - 1 && "col-span-2"
              )} style={{ animationDelay: `${index * 0.2}s` }}>
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
                  {index + 1}
                </div>
                
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-2 relative">
                  <step.icon className="h-6 w-6 text-primary relative z-10" />
                </div>
                
                <h3 className="text-sm font-bold mb-1">{step.title}</h3>
              </div>
            ))}
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-12 max-w-6xl mx-auto relative">
            {/* Connection lines for desktop */}
            <div className="absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center relative animate-scale-in" style={{ animationDelay: `${index * 0.2}s` }}>
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold z-10">
                  {index + 1}
                </div>
                
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-6 relative hover:scale-110 transition-transform duration-300 cursor-pointer group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity"></div>
                  <step.icon className="h-12 w-12 text-primary relative z-10" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-base px-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Mobile Money Section - Compact collapsible on mobile */}
      {sections.mobile_money && (
      <section className="py-12 lg:py-24 bg-gradient-to-br from-accent via-yellow-400 to-accent relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[length:32px_32px]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="animate-fade-in-left text-center lg:text-left">
              <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-white/20 backdrop-blur-sm text-accent-foreground rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
                Easy Payment
              </div>
              <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-4 lg:mb-6 text-accent-foreground">
                Pay with Ghana Mobile Money
              </h2>
              <p className="text-accent-foreground/90 mb-6 lg:mb-8 text-sm lg:text-lg leading-relaxed px-4 lg:px-0">
                We accept all major mobile money providers. Secure & instant payments.
              </p>
              
              {/* Mobile money providers - compact on mobile */}
              <div className="space-y-2 lg:space-y-4 mb-6 lg:mb-8 max-w-md mx-auto lg:mx-0">
                {[
                  { name: 'MTN Money', color: 'bg-yellow-500' },
                  { name: 'Vodafone', color: 'bg-red-500' },
                  { name: 'AirtelTigo', color: 'bg-blue-500' }
                ].map((provider, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 lg:gap-4 p-2.5 lg:p-4 bg-white/20 backdrop-blur-sm rounded-lg lg:rounded-xl hover:bg-white/30 transition-all cursor-pointer animate-fade-in-left group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`${provider.color} rounded-full p-1.5 lg:p-3 group-hover:scale-110 transition-transform`}>
                      <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full"></div>
                    </div>
                    <span className="text-accent-foreground font-semibold text-sm lg:text-base">{provider.name}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={() => navigate('/get-help')}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold lg:text-lg px-6 lg:px-8 shadow-xl w-full sm:w-auto mb-4 lg:mb-0"
              >
                Request Help Now
              </Button>
            </div>

            {/* Payment process - Desktop only */}
            <Card className="p-6 lg:p-10 bg-white shadow-2xl animate-fade-in-right hover-lift hidden lg:block">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-primary/10 rounded-full p-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Simple Payment Process</h3>
              </div>
              
              <div className="space-y-6">
                {[
                  { icon: Phone, text: 'Receive a payment prompt on your phone', delay: '0s' },
                  { icon: Key, text: 'Enter your PIN to confirm payment', delay: '0.1s' },
                  { icon: CreditCard, text: 'Get instant confirmation and receipt', delay: '0.2s' }
                ].map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl hover:bg-primary/10 transition-all cursor-pointer group animate-scale-in"
                    style={{ animationDelay: item.delay }}
                  >
                    <div className="bg-primary/10 rounded-xl p-3 group-hover:bg-primary group-hover:text-white transition-colors">
                      <item.icon className="h-5 w-5 text-primary group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold">Step {index + 1}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>
      )}

      {/* Testimonials Section - Show only 1 on mobile, 3 on desktop */}
      {sections.testimonials && testimonials.length > 0 && (
        <section className="py-12 lg:py-24 bg-gradient-to-b from-[hsl(var(--section-bg))] to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 lg:mb-16 animate-fade-in">
              <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-primary/10 text-primary rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
                Customer Stories
              </div>
              <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-4">What Our Customers Say</h2>
              <p className="text-muted-foreground text-sm lg:text-lg px-4">Real experiences from drivers across Ghana</p>
            </div>

          <div className="grid md:grid-cols-3 gap-4 lg:gap-8 max-w-6xl mx-auto">
            {testimonials.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground">No customer reviews yet</p>
              </div>
            ) : (
              testimonials.slice(0, 3).map((testimonial, index) => (
                <Card 
                  key={testimonial.id} 
                  className={cn(
                    "p-6 lg:p-8 hover-lift relative overflow-hidden group bg-gradient-to-br from-white to-gray-50/50 animate-scale-in",
                    index > 0 && !showAllReviews && "hidden md:block"
                  )}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Decorative quote mark */}
                  <div className="absolute top-4 right-4 text-6xl text-primary/5 font-serif group-hover:text-primary/10 transition-colors">"</div>
                  
                  <div className="flex gap-1 mb-4 lg:mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 lg:h-5 lg:w-5 text-accent fill-accent" />
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground mb-4 lg:mb-6 leading-relaxed relative z-10 italic text-sm lg:text-base line-clamp-4">
                    "{testimonial.review}"
                  </p>
                  
                  <div className="flex items-center gap-3 lg:gap-4 pt-3 lg:pt-4 border-t">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center font-bold text-base lg:text-lg">
                      {testimonial.profiles?.full_name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-sm lg:text-base">{testimonial.profiles?.full_name || 'Anonymous'}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {testimonial.service_requests?.location || 'Ghana'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
          
          <div className="text-center mt-6 md:hidden">
            <Button 
              variant="outline" 
              size="sm" 
              className="font-semibold border-2"
              onClick={() => setShowAllReviews(!showAllReviews)}
            >
              {showAllReviews ? 'Show Less' : 'View All Reviews'}
            </Button>
          </div>
        </div>
      </section>
      )}

      {/* Cities Section - Compact collapsible on mobile */}
      {sections.cities && (
      <section className="py-12 lg:py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 lg:mb-16 animate-fade-in">
            <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-secondary/10 text-secondary rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
              Coverage Area
            </div>
            <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-4">We're All Across Ghana</h2>
            <p className="text-muted-foreground text-sm lg:text-lg px-4">
              Available in {cities.length}+ cities nationwide
            </p>
          </div>

          {/* Mobile compact view */}
          <div className="lg:hidden space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {cities.slice(0, 6).map((city, index) => (
                <div 
                  key={city.id} 
                  onClick={() => navigate('/request-service')}
                  className="flex items-center gap-2 p-2.5 border-2 rounded-lg hover:border-primary transition-all cursor-pointer bg-white animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <MapPinned className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-sm">{city.name}</span>
                </div>
              ))}
            </div>
            
            {cities.length > 6 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowAllCities(!showAllCities)}
                  className="w-full text-sm font-semibold border-2 hover:border-primary"
                >
                  {showAllCities ? 'Show Less' : `View All ${cities.length} Cities`}
                </Button>
                
                {showAllCities && (
                  <div className="grid grid-cols-2 gap-2 animate-fade-in">
                    {cities.slice(6).map((city) => (
                      <div 
                        key={city.id} 
                        onClick={() => navigate('/request-service')}
                        className="flex items-center gap-2 p-2.5 border-2 rounded-lg hover:border-primary transition-all cursor-pointer bg-white"
                      >
                        <MapPinned className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-sm">{city.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Desktop grid view */}
          <div className="hidden lg:grid grid-cols-5 gap-4 max-w-6xl mx-auto">
            {cities.map((city, index) => (
              <div 
                key={city.id} 
                onClick={() => navigate('/request-service')}
                className="flex items-center gap-3 p-5 border-2 rounded-2xl hover:border-primary transition-all cursor-pointer group hover-lift bg-gradient-to-br from-white to-gray-50/50 animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <MapPinned className="h-6 w-6 text-primary group-hover:scale-125 transition-transform shrink-0" />
                <span className="font-semibold group-hover:text-primary transition-colors text-base">{city.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* CTA Section - Compact on mobile */}
      {sections.cta && (
      <section className="py-12 lg:py-24 bg-gradient-to-br from-primary via-[hsl(217,91%,25%)] to-secondary text-white relative overflow-hidden">
        {/* Animated gradient orbs - hidden on mobile */}
        <div className="hidden lg:block absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div className="hidden lg:block absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-4 lg:space-y-8 animate-fade-in">
            <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 glass text-white rounded-full text-xs lg:text-sm font-semibold mb-2 lg:mb-4">
              Get Started Today
            </div>
            
            <h2 className="text-2xl md:text-4xl lg:text-6xl font-bold leading-tight">
              Never Be Stranded<br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
                {' '}On The Road Again
              </span>
            </h2>
            
            <p className="text-sm lg:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed px-4">
              Join thousands of drivers who trust DRIVE Ghana for reliable roadside assistance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-6 justify-center pt-4 lg:pt-6 px-4">
              <Button 
                onClick={() => navigate('/get-help')} 
                size="lg" 
                className="bg-gradient-to-r from-accent to-yellow-400 text-accent-foreground hover:shadow-[var(--shadow-glow)] font-bold lg:text-lg px-8 lg:px-10 py-5 lg:py-6 h-auto pulse-glow w-full sm:w-auto"
              >
                Request Help Now
              </Button>
              <Button 
                onClick={() => navigate('/partnership')} 
                size="lg" 
                className="glass border-2 border-white/30 text-white hover:bg-white/20 font-bold lg:text-lg px-8 lg:px-10 py-5 lg:py-6 h-auto backdrop-blur-md w-full sm:w-auto"
              >
                Become a Partner
              </Button>
            </div>
            
            {/* Trust indicators - compact on mobile */}
            <div className="grid grid-cols-3 gap-4 lg:flex lg:flex-wrap lg:justify-center lg:gap-12 pt-8 lg:pt-12 text-xs lg:text-sm max-w-md lg:max-w-none mx-auto">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-accent mb-0.5 lg:mb-1">24/7</div>
                <div className="text-gray-300">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-accent mb-0.5 lg:mb-1">&lt;30min</div>
                <div className="text-gray-300">Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-accent mb-0.5 lg:mb-1">10+</div>
                <div className="text-gray-300">Cities</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
