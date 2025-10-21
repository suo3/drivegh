import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Truck, Wrench, Battery, Key, Fuel, Settings, Phone, MapPin, CreditCard, Star, MapPinned } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import heroTaxi from '@/assets/hero-taxi.png';

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user && userRole) {
        if (userRole === 'customer') {
          navigate('/customer');
        } else if (userRole === 'provider') {
          navigate('/provider');
        } else if (userRole === 'admin') {
          navigate('/admin');
        }
      }
    }
  }, [user, userRole, loading, navigate]);

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
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="bg-[hsl(var(--hero-bg))] text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Roadside Assistance<br />Across Ghana
              </h1>
              <p className="text-lg text-gray-200">
                Help is just a click away. Get immediate assistance for vehicle breakdowns, flat tires, battery issues, and more.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => navigate('/auth')} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Request Help Now
                </Button>
                <Button onClick={() => navigate('/auth')} size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-semibold">
                  Track Rescue
                </Button>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-semibold text-sm">4.5</div>
                  <Star className="w-6 h-6 text-accent fill-accent" />
                </div>
                <p className="text-sm text-gray-300">4,500+ rescues completed this year</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <img src={heroTaxi} alt="Emergency Assistance Vehicle" className="w-full max-w-md drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-[hsl(var(--section-bg))]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Roadside Assistance Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We offer comprehensive roadside assistance services across Ghana. Our professional team is ready to help you 24/7.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <service.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-muted-foreground text-sm">{service.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Getting help is simple and fast. Follow these simple steps to request immediate assistance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Money Section */}
      <section className="py-20 bg-accent">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-accent-foreground">Pay with Ghana Mobile Money</h2>
              <p className="text-accent-foreground/80 mb-6">
                We accept all major mobile money providers in Ghana for easy, secure payments.
              </p>
              <div className="space-y-3 text-accent-foreground/90">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-full p-1.5">
                    <div className="w-2 h-2 bg-accent rounded-full" />
                  </div>
                  <span>MTN Mobile Money</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-full p-1.5">
                    <div className="w-2 h-2 bg-accent rounded-full" />
                  </div>
                  <span>Vodafone Cash</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-full p-1.5">
                    <div className="w-2 h-2 bg-accent rounded-full" />
                  </div>
                  <span>AirtelTigo Money</span>
                </div>
              </div>
              <Button className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
                Request Help Now
              </Button>
            </div>

            <Card className="p-8 bg-white">
              <h3 className="text-xl font-bold mb-6">Simple Mobile Money Payment</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <span>Receive a payment prompt on your phone</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Key className="h-4 w-4 text-primary" />
                  </div>
                  <span>Enter your PIN to confirm payment</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-primary/10 rounded-full p-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <span>Get instant confirmation and receipt</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-[hsl(var(--section-bg))]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-muted-foreground">Hear what our customers are saying about us</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-sm mb-4 text-muted-foreground">{testimonial.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.city}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Popular Cities We Serve</h2>
            <p className="text-muted-foreground">
              Our reliable roadside assistance services are available in major cities across Ghana
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {cities.map((city, index) => (
              <div key={index} className="flex items-center gap-2 p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                <MapPinned className="h-5 w-5 text-primary" />
                <span className="font-medium">{city}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline">View All Cities</Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready for Roadside Assistance?</h2>
          <p className="text-lg mb-8 text-gray-200 max-w-2xl mx-auto">
            Don't wait until you're stranded. Get the DRIVE Ghana app today and have peace of mind on the road.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button onClick={() => navigate('/auth')} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              Request Help Now
            </Button>
            <Button onClick={() => navigate('/auth')} size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-semibold">
              Become a Partner
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
