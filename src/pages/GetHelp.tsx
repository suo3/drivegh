import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Truck, Wrench, Battery, Key, Fuel, Settings, Phone, Clock, MapPin } from 'lucide-react';

const GetHelp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();


  const services = [
    { icon: Truck, title: 'Towing Services', desc: 'Vehicle towing for any situation' },
    { icon: Wrench, title: 'Flat Tire Change', desc: 'Quick tire replacement service' },
    { icon: Battery, title: 'Battery Jump Start', desc: 'Get your battery charged' },
    { icon: Key, title: 'Lockout Service', desc: 'Locked out? We can help' },
    { icon: Fuel, title: 'Fuel Delivery', desc: 'Emergency fuel delivery' },
    { icon: Settings, title: 'Minor Repairs', desc: 'On-the-spot fixes' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="bg-gradient-to-r from-primary to-primary/90 border-b border-primary/20 pt-16">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Get Emergency Help</h1>
          <p className="text-white/80 text-sm">Fast, reliable roadside assistance across Ghana</p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 mb-12 bg-accent/10 border-accent">
              <div className="text-center space-y-4">
                <Phone className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-3xl font-bold">Emergency Hotline</h2>
                <p className="text-2xl font-bold text-primary">+233 20 222 2244</p>
                <p className="text-muted-foreground">Available 24/7 for immediate assistance</p>
              </div>
            </Card>

            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Request Service Online</h2>
              <p className="text-muted-foreground mb-6">
                Submit a service request and track your rescue team - no account required
              </p>
              <Button onClick={() => navigate('/')} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Request Service Now
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="p-6">
                <Clock className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Fast Response Time</h3>
                <p className="text-sm text-muted-foreground">
                  Average response time of 30 minutes or less in major cities
                </p>
              </Card>

              <Card className="p-6">
                <MapPin className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Track Your Rescue</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your service provider's location in real-time
                </p>
              </Card>
            </div>

            <div className="space-y-4 mb-12">
              <h3 className="text-2xl font-bold text-center">Available Services</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {services.map((service, index) => (
                  <Card key={index} className="p-4 text-center hover:shadow-lg transition-shadow">
                    <service.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold text-sm mb-1">{service.title}</h4>
                    <p className="text-xs text-muted-foreground">{service.desc}</p>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="p-8 bg-primary text-white text-center">
              <h3 className="text-2xl font-bold mb-4">Need Help Right Now?</h3>
              <p className="mb-6">Call our 24/7 emergency hotline or request service online</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => window.location.href = 'tel:+233202222244'} size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-100">
                  Call Now
                </Button>
                <Button onClick={() => navigate('/')} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Request Service
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GetHelp;
