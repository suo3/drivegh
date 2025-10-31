import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Truck, Wrench, Battery, Key, Fuel, Settings, Phone, MapPin, CreditCard, Star, MapPinned } from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import heroTaxi from '@/assets/hero-taxi.png';

const Index = () => {
  const { loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const services = [
    { icon: Truck, title: 'Towing Services', desc: 'Vehicle towing for relocations, accidents, or mechanical issues. We\'ll get you off the road quickly.' },
    { icon: Wrench, title: 'Flat Tire Change', desc: 'Quick roadside tire change service. We\'ll replace your flat tire with a spare in no time.' },
    { icon: Battery, title: 'Battery Jump Start', desc: 'Dead battery? Our technicians will jump-start your vehicle and get you back on the road quickly.' },
    { icon: Key, title: 'Lockout Services', desc: 'Locked your keys in your car? We provide quick and damage-free vehicle entry services.' },
    { icon: Fuel, title: 'Fuel Delivery', desc: 'Run out of fuel? We deliver enough fuel to get you to the nearest fuel station.' },
    { icon: Settings, title: 'Minor Repairs', desc: 'On-the-spot minor maintenance to get you moving again without a trip to the workshop.' },
  ];

  const howItWorks = [
    { icon: Phone, title: 'Request Assistance', desc: 'Use our app or website to submit help. Provide your location and describe your emergency.' },
    { icon: MapPin, title: 'Track Your Rescue', desc: 'Monitor the arrival of your rescue team in real time. Know exactly when help will arrive.' },
    { icon: CreditCard, title: 'Pay with Mobile Money', desc: 'Once service is complete, easily pay using any Ghana mobile money provider (MTN, Vodafone, or AirtelTigo).' },
  ];

  const testimonials = [
    { name: 'Christine', city: 'Accra, Ghana', rating: 5, text: 'My car battery died and I was stuck on the road. The DRIVE Ghana team came in less than 30 minutes and got me back on the road quickly.' },
    { name: 'Kofi', city: 'Kumasi, Ghana', rating: 5, text: 'I had a flat tire on the Kumasi-Accra Highway. I used the app and help arrived within 40 minutes. The technician was professional and friendly.' },
    { name: 'Ama', city: 'Cape Coast, Ghana', rating: 5, text: 'I locked my keys in my car at the mall. The DRIVE Ghana team helped me out fast and my car had no damage. Fast and skilled service!' },
  ];

  const cities = [
    'Accra', 'Kumasi', 'Tamale', 'Tema', 'Takoradi', 'Obuasi', 
    'Cape Coast', 'Sunyani', 'Koforidua', 'Sekondi'
  ];

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />

      {/* Hero Section - Modern asymmetric design */}
      <section id="home" className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-br from-[hsl(217,91%,15%)] via-[hsl(217,91%,20%)] to-[hsl(217,91%,25%)]">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
            {/* Left content */}
            <div className="space-y-8 animate-fade-in-left">
              {/* Trust badge */}
              <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-white/90 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">24/7 Live Support • 30min Avg Response</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] text-white">
                <span className="block">Roadside Help</span>
                <span className="block bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
                  When You Need It
                </span>
              </h1>
              
              <p className="text-xl text-gray-200 max-w-xl leading-relaxed">
                Ghana's fastest emergency roadside assistance. Professional help arrives in 30 minutes or less, anywhere you are.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => navigate('/get-help')} 
                  size="lg" 
                  className="bg-gradient-to-r from-accent to-yellow-400 text-accent-foreground hover:shadow-[var(--shadow-glow)] transition-all duration-300 font-semibold text-lg px-8 pulse-glow"
                >
                  Request Help Now
                </Button>
                <Button 
                  onClick={() => navigate('/track-rescue')} 
                  size="lg" 
                  className="glass border-2 border-white/30 text-white hover:bg-white/20 font-semibold text-lg px-8 backdrop-blur-md"
                >
                  Track Rescue
                </Button>
              </div>
              
              {/* Stats row */}
              <div className="flex flex-wrap gap-8 pt-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold text-accent">4.5</div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-accent fill-accent" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">Customer Rating</p>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white">4,500+</div>
                  <p className="text-sm text-gray-300">Rescues This Year</p>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white">&lt;30min</div>
                  <p className="text-sm text-gray-300">Avg Response Time</p>
                </div>
              </div>
            </div>
            
            {/* Right content - Hero image with floating effect */}
            <div className="relative animate-fade-in-right">
              <div className="absolute -inset-4 bg-gradient-to-r from-accent/30 to-secondary/30 rounded-3xl blur-2xl"></div>
              <img 
                src={heroTaxi} 
                alt="Emergency Roadside Assistance Vehicle" 
                className="relative w-full max-w-lg mx-auto drop-shadow-2xl animate-float" 
              />
              
              {/* Floating info cards */}
              <div className="absolute top-8 -left-4 glass p-4 rounded-xl animate-scale-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 rounded-full p-2">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Live Tracking</p>
                    <p className="text-white/70 text-xs">Real-time updates</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-8 -right-4 glass p-4 rounded-xl animate-scale-in" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center gap-3">
                  <div className="bg-accent rounded-full p-2">
                    <Phone className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Mobile Money</p>
                    <p className="text-white/70 text-xs">Easy payment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Compact grid on mobile */}
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
            {services.map((service, index) => (
              <Card 
                key={index} 
                className="p-4 lg:p-8 hover-lift cursor-pointer group border-2 hover:border-primary/20 bg-gradient-to-br from-white to-gray-50/50 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-primary/10 rounded-xl lg:rounded-2xl w-10 h-10 lg:w-16 lg:h-16 flex items-center justify-center mb-3 lg:mb-6 group-hover:bg-primary/20 transition-colors group-hover:scale-110 transition-transform duration-300 mx-auto lg:mx-0">
                  <service.icon className="h-5 w-5 lg:h-8 lg:w-8 text-primary" />
                </div>
                <h3 className="text-sm lg:text-xl font-bold mb-2 lg:mb-3 group-hover:text-primary transition-colors text-center lg:text-left">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-xs lg:text-base hidden lg:block">{service.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Simplified on mobile */}
      <section id="how-it-works" className="py-12 lg:py-24 bg-gradient-to-b from-background to-[hsl(var(--section-bg))] relative overflow-hidden">
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
          <div className="text-center mb-8 lg:mb-16 animate-fade-in">
            <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-accent/10 text-accent-foreground rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
              Simple Process
            </div>
            <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm lg:text-lg px-4">
              Get help in three easy steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-12 max-w-6xl mx-auto relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center relative animate-scale-in" style={{ animationDelay: `${index * 0.2}s` }}>
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground rounded-full w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center text-xs lg:text-sm font-bold z-10">
                  {index + 1}
                </div>
                
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl lg:rounded-3xl w-16 h-16 lg:w-24 lg:h-24 flex items-center justify-center mx-auto mb-4 lg:mb-6 relative hover:scale-110 transition-transform duration-300 cursor-pointer group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-0 group-hover:opacity-10 rounded-2xl lg:rounded-3xl transition-opacity"></div>
                  <step.icon className="h-8 w-8 lg:h-12 lg:w-12 text-primary relative z-10" />
                </div>
                
                <h3 className="text-lg lg:text-2xl font-bold mb-2 lg:mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-xs lg:text-base px-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Money Section - Simplified on mobile */}
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
              <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8 max-w-md mx-auto lg:mx-0">
                {[
                  { name: 'MTN Money', color: 'bg-yellow-500' },
                  { name: 'Vodafone', color: 'bg-red-500' },
                  { name: 'AirtelTigo', color: 'bg-blue-500' }
                ].map((provider, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all cursor-pointer animate-fade-in-left group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`${provider.color} rounded-full p-2 lg:p-3 group-hover:scale-110 transition-transform`}>
                      <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full"></div>
                    </div>
                    <span className="text-accent-foreground font-semibold text-sm lg:text-base">{provider.name}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={() => navigate('/get-help')}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold lg:text-lg px-6 lg:px-8 shadow-xl w-full sm:w-auto"
              >
                Request Help Now
              </Button>
            </div>

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

      {/* Testimonials Section - Show only 1 on mobile, 3 on desktop */}
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
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className={cn(
                  "p-6 lg:p-8 hover-lift relative overflow-hidden group bg-gradient-to-br from-white to-gray-50/50 animate-scale-in",
                  index > 0 && "hidden md:block"
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
                
                <p className="text-muted-foreground mb-4 lg:mb-6 leading-relaxed relative z-10 italic text-sm lg:text-base">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center gap-3 lg:gap-4 pt-3 lg:pt-4 border-t">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center font-bold text-base lg:text-lg">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm lg:text-base">{testimonial.name}</p>
                    <p className="text-xs lg:text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonial.city}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-6 md:hidden">
            <Button variant="outline" size="sm" className="font-semibold border-2">
              View All Reviews
            </Button>
          </div>
        </div>
      </section>

      {/* Cities Section - Compact on mobile */}
      <section className="py-12 lg:py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 lg:mb-16 animate-fade-in">
            <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-secondary/10 text-secondary rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
              Coverage Area
            </div>
            <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-4">We're All Across Ghana</h2>
            <p className="text-muted-foreground text-sm lg:text-lg px-4">
              Reliable roadside assistance in major cities
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-4 max-w-6xl mx-auto mb-6 lg:mb-8">
            {cities.slice(0, 6).map((city, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 lg:gap-3 p-3 lg:p-5 border-2 rounded-xl lg:rounded-2xl hover:border-primary transition-all cursor-pointer group hover-lift bg-gradient-to-br from-white to-gray-50/50 animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <MapPinned className="h-4 w-4 lg:h-6 lg:w-6 text-primary group-hover:scale-125 transition-transform shrink-0" />
                <span className="font-semibold group-hover:text-primary transition-colors text-xs lg:text-base">{city}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" className="font-semibold border-2 hover:border-primary text-sm lg:text-base">
              +{cities.length - 6} More Cities
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - Compact on mobile */}
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

      <Footer />
    </div>
  );
};

export default Index;
