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

      {/* Minimal Hero Banner */}
      <section className="bg-primary border-b pt-16">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="max-w-4xl">
            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Emergency Roadside Assistance
            </h1>
            
            <div className="flex flex-wrap gap-4 text-sm lg:text-base text-white/90 mb-6">
              <span>24/7 Available</span>
              <span>•</span>
              <span>30min Response</span>
              <span>•</span>
              <span>Ghana-wide Coverage</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => navigate('/get-help')} 
                className="bg-white text-primary hover:bg-white/90 font-semibold"
              >
                Request Help Now
              </Button>
              <Button 
                onClick={() => navigate('/track-rescue')} 
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Track Rescue
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Minimal */}
      {sections.services && (
      <section id="services" className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 lg:mb-16">
            <p className="text-sm font-semibold text-primary mb-3">Our Services</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Complete Roadside Assistance</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional help for any roadside emergency
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
            {services.map((service) => {
              const Icon = getIconComponent(service.icon);
              return (
                <Card 
                  key={service.id} 
                  className="p-6 lg:p-8 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => navigate(`/request-service?service=${service.slug}`)}
                >
                  <Icon className="h-8 w-8 lg:h-10 lg:w-10 text-primary mb-4" />
                  <h3 className="text-base lg:text-lg font-bold mb-2">{service.name}</h3>
                  <p className="text-sm text-muted-foreground hidden lg:block">{service.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* How It Works Section - Minimal */}
      {sections.how_it_works && (
      <section id="how-it-works" className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 lg:mb-16">
            <p className="text-sm font-semibold text-primary mb-3">Simple Process</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Get help in three easy steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-primary/10 mb-6">
                  <step.icon className="h-8 w-8 lg:h-10 lg:w-10 text-primary" />
                </div>
                
                <div className="mb-3 text-sm font-semibold text-primary">Step {index + 1}</div>
                <h3 className="text-lg lg:text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Mobile Money Section - Minimal */}
      {sections.mobile_money && (
      <section className="py-16 lg:py-24 bg-accent">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center lg:text-left mb-8 lg:mb-12">
              <p className="text-sm font-semibold text-accent-foreground/80 mb-3">Easy Payment</p>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-accent-foreground">
                Pay with Mobile Money
              </h2>
              <p className="text-accent-foreground/90">
                We accept all major mobile money providers in Ghana
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-4 mb-8">
              {[
                { name: 'MTN Money', color: 'bg-yellow-500' },
                { name: 'Vodafone Cash', color: 'bg-red-500' },
                { name: 'AirtelTigo Money', color: 'bg-blue-500' }
              ].map((provider, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 bg-white/20 backdrop-blur-sm rounded-lg"
                >
                  <div className={`${provider.color} rounded-full p-2`}>
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-accent-foreground font-semibold">{provider.name}</span>
                </div>
              ))}
            </div>
            
            <div className="text-center lg:text-left">
              <Button 
                onClick={() => navigate('/get-help')}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                Request Help Now
              </Button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Testimonials Section - Minimal */}
      {sections.testimonials && testimonials.length > 0 && (
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 lg:mb-16">
              <p className="text-sm font-semibold text-primary mb-3">Customer Stories</p>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Our Customers Say</h2>
              <p className="text-muted-foreground">Real experiences from drivers across Ghana</p>
            </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                No testimonials yet
              </div>
            ) : (
              <>
                {testimonials.slice(0, 3).map((testimonial) => (
                  <Card key={testimonial.id} className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "h-4 w-4",
                            i < testimonial.rating ? "fill-primary text-primary" : "text-muted"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm mb-4 line-clamp-3">{testimonial.review}</p>
                    <div className="text-sm">
                      <p className="font-semibold">{testimonial.profiles?.full_name}</p>
                      <p className="text-muted-foreground capitalize text-xs">
                        {testimonial.service_requests?.service_type?.replace('_', ' ')}
                      </p>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Coverage Area Section - Minimal */}
      {sections.cities && (
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 lg:mb-16">
            <p className="text-sm font-semibold text-primary mb-3">Coverage Area</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Available Across Ghana</h2>
            <p className="text-muted-foreground">{cities.length}+ cities nationwide</p>
          </div>

          {/* Mobile view */}
          <div className="lg:hidden space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {cities.slice(0, 6).map((city) => (
                <div 
                  key={city.id} 
                  onClick={() => navigate('/request-service')}
                  className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <MapPinned className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium text-sm">{city.name}</span>
                </div>
              ))}
            </div>
            
            {cities.length > 6 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowAllCities(!showAllCities)}
                  className="w-full"
                >
                  {showAllCities ? 'Show Less' : `View All ${cities.length} Cities`}
                </Button>
                
                {showAllCities && (
                  <div className="grid grid-cols-2 gap-3">
                    {cities.slice(6).map((city) => (
                      <div 
                        key={city.id} 
                        onClick={() => navigate('/request-service')}
                        className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                      >
                        <MapPinned className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-sm">{city.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Desktop view */}
          <div className="hidden lg:grid grid-cols-5 gap-4 max-w-5xl mx-auto">
            {cities.map((city) => (
              <div 
                key={city.id} 
                onClick={() => navigate('/request-service')}
                className="flex items-center gap-2 p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                <MapPinned className="h-5 w-5 text-primary shrink-0" />
                <span className="font-semibold text-sm">{city.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* CTA Section - Minimal */}
      {sections.cta && (
      <section className="py-16 lg:py-24 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6 lg:space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Never Be Stranded On The Road
            </h2>
            
            <p className="text-lg lg:text-xl text-white/90">
              24/7 emergency roadside assistance across Ghana
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => navigate('/get-help')}
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold"
              >
                Request Help Now
              </Button>
              <Button 
                onClick={() => navigate('/partnership')}
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Become a Partner
              </Button>
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
