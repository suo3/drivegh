import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Users, TrendingUp, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const Partnership = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    message: '',
  });

  const benefits = [
    { icon: DollarSign, title: 'Earn More Income', desc: 'Increase your revenue with consistent service requests' },
    { icon: Users, title: 'Access to Customers', desc: 'Connect with thousands of drivers across Ghana' },
    { icon: TrendingUp, title: 'Grow Your Business', desc: 'Expand your service area and customer base' },
    { icon: Clock, title: 'Flexible Schedule', desc: 'Accept jobs when you\'re available' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Thank you! We\'ll review your application and get back to you soon.');
    setFormData({
      businessName: '',
      contactPerson: '',
      email: '',
      phone: '',
      city: '',
      message: '',
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="bg-primary text-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Become a Partner</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            Join Ghana's largest roadside assistance network and grow your business
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Partner with DRIVE Ghana?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join our network of professional service providers and benefit from our platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <benefit.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[hsl(var(--section-bg))]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Apply to Become a Partner</h2>
              <p className="text-muted-foreground">
                Fill out the form below and our team will review your application
              </p>
            </div>

            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City/Location *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Tell us about your services</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={4}
                    placeholder="What services do you offer? How many years of experience do you have?"
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Submit Application
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partnership;
