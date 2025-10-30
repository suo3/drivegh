import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowLeft, Truck, Wrench, Battery, Key, Fuel, Settings, MapPin, Phone, Copy, Share2, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const serviceSchema = z.object({
  location: z.string().trim().min(3, 'Location is required').max(200, 'Location must be less than 200 characters'),
  description: z.string().trim().max(1000, 'Description must be less than 1000 characters'),
  serviceType: z.enum(['towing', 'tire_change', 'fuel_delivery', 'battery_jump', 'lockout_service', 'emergency_assistance']),
  vehicleMake: z.string().trim().min(1, 'Vehicle make is required').max(100, 'Vehicle make must be less than 100 characters'),
  vehicleModel: z.string().trim().min(1, 'Vehicle model is required').max(100, 'Vehicle model must be less than 100 characters'),
  vehicleYear: z.string().trim().optional(),
  vehiclePlate: z.string().trim().optional(),
  phoneNumber: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number must be less than 20 characters'),
});

const RequestService = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = serviceSchema.safeParse({
        location: location.trim(),
        description: description.trim(),
        serviceType,
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleYear: vehicleYear.trim(),
        vehiclePlate: vehiclePlate.trim(),
        phoneNumber: user ? '0000000000' : phoneNumber.trim(), // Skip validation if logged in
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('service_requests').insert([{
        customer_id: user?.id || null,
        phone_number: user ? null : phoneNumber.trim(),
        service_type: serviceType as 'towing' | 'tire_change' | 'fuel_delivery' | 'battery_jump' | 'lockout_service' | 'emergency_assistance',
        location: location.trim(),
        description: description.trim(),
        vehicle_make: vehicleMake.trim(),
        vehicle_model: vehicleModel.trim(),
        vehicle_year: vehicleYear.trim() || null,
        vehicle_plate: vehiclePlate.trim() || null,
        status: 'pending' as const,
      }]).select().single();

      if (error) {
        console.error('Error creating request:', error);
        toast.error('Failed to create service request. Please try again.');
      } else {
        setCreatedRequestId(data.id);
        setSuccessDialogOpen(true);
        toast.success('Service request submitted successfully!');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const services = [
    { value: 'towing', icon: Truck, label: 'Towing', desc: 'Vehicle towing service' },
    { value: 'tire_change', icon: Wrench, label: 'Tire Change', desc: 'Flat tire replacement' },
    { value: 'fuel_delivery', icon: Fuel, label: 'Fuel Delivery', desc: 'Emergency fuel service' },
    { value: 'battery_jump', icon: Battery, label: 'Battery Jump', desc: 'Jump start service' },
    { value: 'lockout_service', icon: Key, label: 'Lockout Service', desc: 'Vehicle unlock' },
    { value: 'emergency_assistance', icon: Settings, label: 'Emergency Help', desc: 'Other emergencies' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="bg-primary text-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          {user && (
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4 text-white hover:text-accent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          )}
          <h1 className="text-5xl font-bold mb-4">Request Roadside Assistance</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            {user ? 'Submit your request and we\'ll assign a professional service provider to help you' : 'Get help now - no account required'}
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 mb-8 bg-accent/10 border-accent">
              <div className="flex items-center gap-4">
                <Phone className="h-12 w-12 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">Emergency? Call Us Directly</h3>
                  <p className="text-2xl font-bold text-primary">+233 20 222 2244</p>
                  <p className="text-sm text-muted-foreground">Available 24/7</p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Request Form</CardTitle>
                <CardDescription>
                  Fill out the details below and we'll get help to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label>What service do you need? *</Label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {services.map((service) => (
                        <Card
                          key={service.value}
                          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                            serviceType === service.value ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => setServiceType(service.value)}
                        >
                          <div className="flex items-start gap-3">
                            <service.icon className={`h-6 w-6 mt-1 ${
                              serviceType === service.value ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                            <div>
                              <p className="font-semibold">{service.label}</p>
                              <p className="text-sm text-muted-foreground">{service.desc}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {!user && (
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Your Phone Number *
                      </Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g., 0244123456 or +233244123456"
                        required
                        maxLength={20}
                      />
                      <p className="text-sm text-muted-foreground">
                        We'll use this to contact you and you can track your request with it
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="location">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Your Current Location *
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Accra Mall, East Legon, Accra"
                      required
                      maxLength={200}
                    />
                    <p className="text-sm text-muted-foreground">
                      Be as specific as possible to help us find you quickly
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Vehicle Information *</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleMake">Make *</Label>
                        <Input
                          id="vehicleMake"
                          type="text"
                          value={vehicleMake}
                          onChange={(e) => setVehicleMake(e.target.value)}
                          placeholder="e.g., Toyota, Honda"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleModel">Model *</Label>
                        <Input
                          id="vehicleModel"
                          type="text"
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          placeholder="e.g., Camry, Accord"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleYear">Year (Optional)</Label>
                        <Input
                          id="vehicleYear"
                          type="text"
                          value={vehicleYear}
                          onChange={(e) => setVehicleYear(e.target.value)}
                          placeholder="e.g., 2020"
                          maxLength={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehiclePlate">License Plate (Optional)</Label>
                        <Input
                          id="vehiclePlate"
                          type="text"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          placeholder="e.g., GR 1234-20"
                          maxLength={20}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Additional Details (Optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell us more about your situation... e.g., 'Car won't start after shopping' or 'Flat tire on highway'"
                      maxLength={1000}
                      rows={4}
                    />
                    <p className="text-sm text-muted-foreground">
                      {description.length}/1000 characters
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      ℹ️ After submission, an admin will review and assign a service provider to your request. 
                      You'll be able to track the provider's status from your dashboard.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading || !serviceType}>
                    {loading ? 'Submitting Request...' : 'Submit Service Request'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Request Submitted Successfully! 🎉</DialogTitle>
            <DialogDescription>
              Save this link to track your service request anytime
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <Label className="text-sm font-semibold mb-2 block">Your Tracking Link:</Label>
              <p className="text-sm break-all text-muted-foreground font-mono">
                {window.location.origin}/request/{createdRequestId}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={async () => {
                  const url = `${window.location.origin}/request/${createdRequestId}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    toast.success('Link copied to clipboard!');
                  } catch (error) {
                    toast.error('Failed to copy link');
                  }
                }}
                variant="outline"
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>

              <Button
                onClick={async () => {
                  const url = `${window.location.origin}/request/${createdRequestId}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'Track My Service Request',
                        text: 'Track my roadside assistance request',
                        url: url,
                      });
                      toast.success('Link shared successfully!');
                    } catch (error) {
                      console.log('Share cancelled or failed');
                    }
                  } else {
                    try {
                      await navigator.clipboard.writeText(url);
                      toast.success('Link copied to clipboard!');
                    } catch (error) {
                      toast.error('Failed to copy link');
                    }
                  }
                }}
                variant="outline"
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </Button>

              <Button
                onClick={() => {
                  navigate(`/request/${createdRequestId}`);
                }}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Track My Request
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-900">
                💡 <strong>Tip:</strong> Bookmark this link or save it to your notes so you can check your request status anytime!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestService;
