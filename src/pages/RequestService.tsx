import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
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
import { ArrowLeft, Truck, Wrench, Battery, Key, Fuel, Settings, MapPin, Phone, Copy, Share2, ExternalLink, CheckCircle2, AlertCircle, Car } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
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

  const totalSteps = 4;

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const serviceParam = searchParams.get('service');
    if (serviceParam) {
      setServiceType(serviceParam);
    }
  }, [searchParams]);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (data) setServices(data);
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Settings;
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!serviceType) {
          toast.error('Please select a service type');
          return false;
        }
        return true;
      case 2:
        if (!user && phoneNumber.trim().length < 10) {
          toast.error('Please enter a valid phone number');
          return false;
        }
        if (location.trim().length < 3) {
          toast.error('Please enter your location');
          return false;
        }
        return true;
      case 3:
        if (!vehicleMake.trim() || !vehicleModel.trim()) {
          toast.error('Please enter vehicle make and model');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
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
        phoneNumber: user ? '0000000000' : phoneNumber.trim(),
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
        setCreatedRequestId(data.tracking_code || data.id);
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


  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Compact Banner */}
      <section className="bg-gradient-to-r from-primary to-primary/90 border-b border-primary/20 pt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Request Roadside Assistance</h1>
              
              {/* Emergency Call Badge */}
              <a 
                href="tel:+233202222244"
                className="inline-flex items-center gap-3 px-4 py-2 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-full text-white hover:bg-red-500/30 transition-all group animate-fade-in"
              >
                <div className="relative flex items-center justify-center">
                  <Phone className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-red-200">Emergency? Call Now</span>
                  <span className="text-sm font-bold">+233 20 222 2244</span>
                </div>
                <div className="relative flex items-center justify-center ml-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <div className="absolute w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
                </div>
              </a>
            </div>
            
            {user && (
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')} 
                className="text-white hover:bg-white/20 self-start md:self-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-background to-[hsl(var(--section-bg))] relative">
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-2xl border-2 overflow-hidden animate-fade-in">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b-2">
                <CardTitle className="text-3xl flex items-center gap-3">
                  <div className="bg-primary rounded-xl p-2">
                    <Car className="h-6 w-6 text-primary-foreground" />
                  </div>
                  Service Request Form
                </CardTitle>
                <CardDescription className="text-base">
                  Step {currentStep} of {totalSteps}: {
                    currentStep === 1 ? 'Select Service' :
                    currentStep === 2 ? 'Contact & Location' :
                    currentStep === 3 ? 'Vehicle Information' :
                    'Additional Details & Review'
                  }
                </CardDescription>
              </CardHeader>

              {/* Progress Indicator */}
              <div className="px-8 pt-6">
                <div className="flex items-center justify-between mb-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                        currentStep >= step 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-muted-foreground/30 text-muted-foreground'
                      }`}>
                        {currentStep > step ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="font-semibold">{step}</span>
                        )}
                      </div>
                      {step < 4 && (
                        <div className={`flex-1 h-1 mx-2 transition-all ${
                          currentStep > step ? 'bg-primary' : 'bg-muted-foreground/20'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mb-6">
                  <span>Service</span>
                  <span>Location</span>
                  <span>Vehicle</span>
                  <span>Review</span>
                </div>
              </div>

              <CardContent className="p-8 pt-0">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Step 1: Service Type Selection */}
                  {currentStep === 1 && (
                    <div className="space-y-4 animate-fade-in">
                      <Label className="text-lg font-bold flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-primary" />
                        What service do you need? *
                      </Label>
                      <div className="grid md:grid-cols-2 gap-4">
                        {services.map((service, index) => {
                          const Icon = getIconComponent(service.icon);
                          return (
                            <Card
                              key={service.id}
                              className={`p-6 cursor-pointer transition-all hover-lift border-2 animate-scale-in ${
                                serviceType === service.slug 
                                  ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg' 
                                  : 'hover:border-primary/30'
                              }`}
                              style={{ animationDelay: `${index * 0.05}s` }}
                              onClick={() => setServiceType(service.slug)}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`rounded-xl p-3 ${
                                  serviceType === service.slug 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-primary/10 text-primary'
                                }`}>
                                  <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-lg mb-1">{service.name}</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Contact & Location */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                      {!user && (
                        <div className="space-y-3 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                          <Label htmlFor="phoneNumber" className="text-base font-bold flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            Your Phone Number *
                          </Label>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g., 024 123 4567 or +233 24 123 4567"
                            maxLength={20}
                            className="h-14 text-lg"
                          />
                          <p className="text-sm text-blue-900 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            We'll use this to contact you and you can track your request with it later
                          </p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label htmlFor="location" className="text-base font-bold flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          Your Current Location *
                        </Label>
                        <Input
                          id="location"
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g., Accra Mall, East Legon, Accra"
                          maxLength={200}
                          className="h-14 text-lg"
                        />
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          Be as specific as possible to help us find you quickly (landmarks, street names, etc.)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Vehicle Information */}
                  {currentStep === 3 && (
                    <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 rounded-xl animate-fade-in">
                      <Label className="text-lg font-bold flex items-center gap-2">
                        <Car className="h-5 w-5 text-primary" />
                        Vehicle Information *
                      </Label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vehicleMake" className="font-semibold">Make *</Label>
                          <Input
                            id="vehicleMake"
                            type="text"
                            value={vehicleMake}
                            onChange={(e) => setVehicleMake(e.target.value)}
                            placeholder="e.g., Toyota, Honda"
                            maxLength={100}
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicleModel" className="font-semibold">Model *</Label>
                          <Input
                            id="vehicleModel"
                            type="text"
                            value={vehicleModel}
                            onChange={(e) => setVehicleModel(e.target.value)}
                            placeholder="e.g., Camry, Accord"
                            maxLength={100}
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicleYear" className="font-semibold">Year (Optional)</Label>
                          <Input
                            id="vehicleYear"
                            type="text"
                            value={vehicleYear}
                            onChange={(e) => setVehicleYear(e.target.value)}
                            placeholder="e.g., 2020"
                            maxLength={4}
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehiclePlate" className="font-semibold">License Plate (Optional)</Label>
                          <Input
                            id="vehiclePlate"
                            type="text"
                            value={vehiclePlate}
                            onChange={(e) => setVehiclePlate(e.target.value)}
                            placeholder="e.g., GR 1234-20"
                            maxLength={20}
                            className="h-12"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Review & Additional Details */}
                  {currentStep === 4 && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Review Summary */}
                      <div className="space-y-4 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20 rounded-xl">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          Review Your Request
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service:</span>
                            <span className="font-semibold">{services.find(s => s.slug === serviceType)?.name}</span>
                          </div>
                          {!user && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Phone:</span>
                              <span className="font-semibold">{phoneNumber}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Location:</span>
                            <span className="font-semibold">{location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vehicle:</span>
                            <span className="font-semibold">{vehicleMake} {vehicleModel} {vehicleYear}</span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="space-y-3">
                        <Label htmlFor="description" className="text-base font-bold">Additional Details (Optional)</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Tell us more about your situation... e.g., 'Car won't start after shopping' or 'Flat tire on highway near toll booth'"
                          maxLength={1000}
                          rows={5}
                          className="resize-none"
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            More details help us prepare better equipment
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {description.length}/1000
                          </p>
                        </div>
                      </div>

                      {/* Info Banner */}
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-blue-200 rounded-full p-2 flex-shrink-0">
                            <AlertCircle className="h-6 w-6 text-blue-700" />
                          </div>
                          <div>
                            <h4 className="font-bold text-blue-900 mb-2">What happens next?</h4>
                            <ul className="space-y-2 text-sm text-blue-900">
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Admin reviews and assigns a qualified service provider</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>You'll receive updates via SMS/call</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Track your request status anytime using your tracking code</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-4 pt-4">
                    {currentStep > 1 && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="flex-1 h-12"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                    )}
                    
                    {currentStep < totalSteps ? (
                      <Button 
                        type="button"
                        onClick={handleNext}
                        className={`h-12 font-semibold ${currentStep === 1 ? 'w-full' : 'flex-1'}`}
                      >
                        Continue
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="flex-1 h-12 font-bold shadow-xl hover-lift"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Request
                            <CheckCircle2 className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />

      {/* Success Dialog - Enhanced */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-3xl text-center">Request Submitted! 🎉</DialogTitle>
            <DialogDescription className="text-center text-base">
              Your service request has been created successfully. Save this tracking code to monitor your request status anytime.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-2xl border-2 border-primary/20">
              <p className="text-sm font-semibold mb-3 text-center text-muted-foreground">Tracking Code</p>
              <p className="text-4xl font-bold text-center py-3 tracking-wider text-primary">
                {createdRequestId}
              </p>
            </div>
            
            <div className="bg-muted p-5 rounded-xl">
              <p className="text-sm font-semibold mb-2">Tracking Link</p>
              <p className="text-sm break-all text-muted-foreground font-mono">
                {window.location.origin}/track/{createdRequestId}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={async () => {
                  const url = `${window.location.origin}/track/${createdRequestId}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    toast.success('Link copied to clipboard!');
                  } catch (error) {
                    toast.error('Failed to copy link');
                  }
                }}
                variant="outline"
                className="w-full h-12 font-semibold"
              >
                <Copy className="h-5 w-5 mr-2" />
                Copy Link
              </Button>

              <Button
                onClick={async () => {
                  const url = `${window.location.origin}/track/${createdRequestId}`;
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
                className="w-full h-12 font-semibold"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share Link
              </Button>

              <Button
                onClick={() => {
                  navigate(`/track/${createdRequestId}`);
                }}
                className="w-full h-12 font-bold bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Track My Request
              </Button>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-900 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600" />
                <span>
                  <strong>Tip:</strong> Bookmark this link or screenshot this page so you can check your request status anytime!
                </span>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestService;
