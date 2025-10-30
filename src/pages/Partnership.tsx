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
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const partnershipSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required').max(100),
  contactPerson: z.string().trim().min(1, 'Contact person is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  phone: z.string().trim().min(1, 'Phone number is required').max(20),
  city: z.string().trim().min(1, 'City is required').max(100),
  message: z.string().max(1000).optional(),
});

const Partnership = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = partnershipSchema.safeParse(formData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('partnership_applications')
        .insert([{
          business_name: formData.businessName,
          contact_person: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          message: formData.message || null,
        }]);

      if (error) {
        toast.error('Failed to submit application. Please try again.');
        console.error('Error submitting application:', error);
      } else {
        toast.success('Thank you! We\'ll review your application and get back to you soon.');
        setFormData({
          businessName: '',
          contactPerson: '',
          email: '',
          phone: '',
          city: '',
          message: '',
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error('Unexpected error:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            <h2 className="text-4xl font-bold mb-4">Partner with DRIVE Ghana</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join our network and start growing your business today
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
            {/* Benefits Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-6">Why Partner with Us?</h3>
              </div>
              {benefits.map((benefit, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex gap-4">
                    <benefit.icon className="h-12 w-12 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{benefit.title}</h4>
                      <p className="text-muted-foreground text-sm">{benefit.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Form Column */}
            <div className="lg:sticky lg:top-8">
              <Card className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Apply Now</h3>
                  <p className="text-muted-foreground text-sm">
                    Fill out the form and we'll review your application
                  </p>
                </div>
                
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

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partnership;
