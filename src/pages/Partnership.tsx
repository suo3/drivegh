import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Users, TrendingUp, Clock, CheckCircle2, Handshake, Rocket, Shield, Star } from 'lucide-react';
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
    { icon: DollarSign, title: 'Earn More Income', desc: 'Increase your revenue with consistent service requests', gradient: 'from-green-500 to-emerald-600' },
    { icon: Users, title: 'Access to Customers', desc: 'Connect with thousands of drivers across Ghana', gradient: 'from-blue-500 to-cyan-600' },
    { icon: TrendingUp, title: 'Grow Your Business', desc: 'Expand your service area and customer base', gradient: 'from-purple-500 to-pink-600' },
    { icon: Clock, title: 'Flexible Schedule', desc: 'Accept jobs when you\'re available', gradient: 'from-orange-500 to-red-600' },
  ];

  const steps = [
    { number: 1, title: 'Apply', desc: 'Fill out our partnership application form' },
    { number: 2, title: 'Review', desc: 'We review your application within 48 hours' },
    { number: 3, title: 'Onboard', desc: 'Complete training and verification process' },
    { number: 4, title: 'Start Earning', desc: 'Begin accepting service requests immediately' },
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
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      
      {/* Compact Banner */}
      <section className="bg-gradient-to-r from-primary to-primary/90 border-b border-primary/20 pt-16">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Partner With Us</h1>
          <p className="text-white/80 text-sm">Join Ghana's largest roadside assistance network</p>
        </div>
      </section>

      {/* Benefits Section - Simplified on mobile */}
      <section className="py-12 lg:py-24 bg-gradient-to-b from-background to-[hsl(var(--section-bg))] relative">
        <div className="hidden lg:block absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="hidden lg:block absolute bottom-10 left-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-8 lg:mb-16 animate-fade-in">
            <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-primary/10 text-primary rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
              Partner Benefits
            </div>
            <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-4">Why Partner with DRIVE Ghana?</h2>
            <p className="text-muted-foreground text-sm lg:text-lg max-w-2xl mx-auto px-4">
              Join our network and unlock new opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 lg:gap-6 max-w-5xl mx-auto mb-8 lg:mb-16">
            {benefits.map((benefit, index) => (
              <Card 
                key={index} 
                className="p-5 lg:p-8 hover-lift cursor-pointer group border-2 hover:border-primary/30 bg-gradient-to-br from-white to-gray-50/50 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex gap-4 lg:gap-6">
                  <div className={`bg-gradient-to-br ${benefit.gradient} rounded-xl lg:rounded-2xl p-3 lg:p-4 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <benefit.icon className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base lg:text-xl font-bold mb-2 lg:mb-3 group-hover:text-primary transition-colors">{benefit.title}</h4>
                    <p className="text-muted-foreground leading-relaxed text-sm lg:text-base">{benefit.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {[
              { icon: Shield, title: 'Verified Partners', desc: 'All partners are thoroughly vetted and certified' },
              { icon: Rocket, title: 'Quick Onboarding', desc: 'Get started within 48 hours of approval' },
              { icon: Star, title: 'Top Support', desc: '24/7 partner support and dedicated account manager' },
            ].map((item, index) => (
              <div 
                key={index}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className="bg-primary/10 rounded-xl lg:rounded-2xl w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center mx-auto mb-3 lg:mb-4">
                  <item.icon className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                </div>
                <h4 className="font-bold mb-1 lg:mb-2 text-sm lg:text-base">{item.title}</h4>
                <p className="text-xs lg:text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section - Simplified on mobile */}
      <section className="py-12 lg:py-24 bg-[hsl(var(--section-bg))] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 hidden lg:block">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="process-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" className="text-primary" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#process-dots)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-8 lg:mb-16 animate-fade-in">
            <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-accent/10 text-accent-foreground rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
              How It Works
            </div>
            <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-4">Simple 4-Step Process</h2>
            <p className="text-muted-foreground text-sm lg:text-lg max-w-2xl mx-auto px-4">
              From application to earning, we make it easy
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 max-w-6xl mx-auto relative">
            {/* Connection line for desktop */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
            
            {steps.map((step, index) => (
              <div 
                key={index}
                className="text-center relative animate-scale-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="relative mb-4 lg:mb-6">
                  <div className="bg-gradient-to-br from-primary to-secondary rounded-xl lg:rounded-2xl w-16 h-16 lg:w-24 lg:h-24 flex items-center justify-center mx-auto relative z-10 hover:scale-110 transition-transform cursor-pointer">
                    <div className="text-2xl lg:text-4xl font-bold text-white">{step.number}</div>
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl lg:rounded-2xl blur-xl"></div>
                </div>
                
                <h3 className="text-sm lg:text-xl font-bold mb-1 lg:mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-xs lg:text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section - Compact on mobile */}
      <section id="application-form" className="py-12 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto items-start">
            {/* Left: Additional info */}
            <div className="space-y-6 lg:space-y-8 animate-fade-in-left">
              <div>
                <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-primary/10 text-primary rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
                  Application Form
                </div>
                <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-4 lg:mb-6">Ready to Join?</h2>
                <p className="text-muted-foreground text-sm lg:text-lg leading-relaxed">
                  Fill out the application form and we'll review your submission within 48 hours.
                </p>
              </div>

              <Card className="p-5 lg:p-8 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-2 border-accent/20">
                <h3 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4">What Happens Next?</h3>
                <div className="space-y-3 lg:space-y-4">
                  {[
                    'We review your application within 48 hours',
                    'Our team contacts you for an interview',
                    'Complete verification and training',
                    'Start receiving service requests',
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-2 lg:gap-3">
                      <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-sm lg:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 lg:p-6 bg-primary/5 border-primary/20">
                <p className="text-xs lg:text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> All partners must have valid business registration, 
                  insurance, and necessary certifications.
                </p>
              </Card>
            </div>

            {/* Right: Application form */}
            <div className="lg:sticky lg:top-8 animate-fade-in-right">
              <Card className="p-6 lg:p-8 shadow-2xl border-2">
                <div className="mb-6 lg:mb-8">
                  <h3 className="text-xl lg:text-2xl font-bold mb-1 lg:mb-2">Partner Application</h3>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Complete the form below to get started
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      placeholder="Your Business Name"
                      required
                      className="h-10 lg:h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="text-sm">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                      placeholder="Your Full Name"
                      required
                      className="h-10 lg:h-12"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="you@example.com"
                        required
                        className="h-10 lg:h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="024 000 0000"
                        required
                        className="h-10 lg:h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm">City/Location *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="e.g., Accra, Kumasi, Tamale"
                      required
                      className="h-10 lg:h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm">Tell Us About Your Services</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      rows={3}
                      placeholder="What services do you offer? How many years of experience?"
                      className="resize-none text-sm"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg font-bold" 
                    size="lg" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    By submitting this form, you agree to our terms and conditions
                  </p>
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
