import { useState, useEffect, useCallback } from 'react';
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
import { Phone, MapPin, CheckCircle2, Car, Fuel, ArrowRight, ArrowLeft, Wrench } from 'lucide-react';
import { ProviderSelectionStep } from '@/components/ProviderSelectionStep';

const DesktopServiceRequest = () => {
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
  const [fuelType, setFuelType] = useState('');
  const [customFuelType, setCustomFuelType] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [autoAssignedProviderId, setAutoAssignedProviderId] = useState<string | null>(null);

  const totalSteps = 5;

  useEffect(() => {
    fetchServices();
    getCurrentLocation();
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
        if (serviceType === 'fuel_delivery') {
          if (!fuelType) {
            toast.error('Please select a fuel type');
            return false;
          }
          if (fuelType === 'other' && !customFuelType.trim()) {
            toast.error('Please enter a custom fuel type');
            return false;
          }
          if (!fuelAmount || parseFloat(fuelAmount) <= 0) {
            toast.error('Please enter a valid fuel amount');
            return false;
          }
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
      case 4:
        // Provider selection step - allow proceeding if provider selected, auto-assigned, or auto-assign mode active
        // When no nearby providers exist, we auto-assign in the background so user can proceed
        return true;
      default:
        return true;
    }
  };

  const handleAutoAssign = useCallback((providerId: string | null) => {
    setAutoAssignedProviderId(providerId);
  }, []);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getCurrentLocation = () => {
    if (gettingLocation) return;
    
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setCustomerLat(lat);
        setCustomerLng(lng);
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'RoadsideAssistance/1.0' } }
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || data.address?.road || '';
            if (address) setLocation(address);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
        }
        
        setGettingLocation(false);
      },
      () => setGettingLocation(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setLoading(true);

    const assignedProviderId = selectedProviderId || autoAssignedProviderId;

    try {
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
        customer_lat: customerLat,
        customer_lng: customerLng,
        fuel_type: serviceType === 'fuel_delivery' ? (fuelType === 'other' ? customFuelType : fuelType) : null,
        fuel_amount: serviceType === 'fuel_delivery' && fuelAmount ? parseFloat(fuelAmount) : null,
        status: assignedProviderId ? 'assigned' as const : 'pending' as const,
        provider_id: assignedProviderId || null,
        assigned_at: assignedProviderId ? new Date().toISOString() : null,
      }]).select().single();

      if (error) {
        toast.error('Failed to create service request. Please try again.');
      } else {
        // If no provider was assigned, auto-assign the closest one in the background
        if (!assignedProviderId && customerLat && customerLng) {
          supabase.rpc('find_closest_provider', {
            customer_lat: customerLat,
            customer_lng: customerLng,
          }).then(({ data: closestData }) => {
            if (closestData && closestData.length > 0) {
              supabase.from('service_requests').update({
                provider_id: closestData[0].provider_id,
                status: 'assigned',
                assigned_at: new Date().toISOString(),
              }).eq('id', data.id).then(() => {
                toast.success('A provider has been assigned to your request. Help is on the way!');
              });
            }
          });
        }
        
        setCreatedRequestId(data.tracking_code || data.id);
        setSuccessDialogOpen(true);
        toast.success('Service request submitted successfully!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdRequestId) {
      navigator.clipboard.writeText(createdRequestId);
      toast.success('Tracking code copied!');
    }
  };

  const stepData = [
    { id: 1, title: 'Service' },
    { id: 2, title: 'Location' },
    { id: 3, title: 'Vehicle' },
    { id: 4, title: 'Provider' },
    { id: 5, title: 'Review' },
  ];

  return (
    <section id="service-request" className="py-16 bg-gradient-to-b from-background to-[hsl(var(--section-bg))] relative">
      <div className="absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Request Assistance
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold mb-4">Get Help Now</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Fill out the form below and we'll dispatch help to your location immediately.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-2 overflow-hidden animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b-2">
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="bg-primary rounded-xl p-2">
                  <Car className="h-6 w-6 text-primary-foreground" />
                </div>
                Service Request
              </CardTitle>
              <CardDescription className="text-base">
                Step {currentStep} of {totalSteps}: {stepData[currentStep - 1]?.title}
              </CardDescription>
            </CardHeader>

            {/* Progress Indicator */}
            <div className="px-8 pt-6">
              <div className="flex items-center justify-between mb-6">
                {stepData.map((step) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                        currentStep >= step.id 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-muted-foreground/30 text-muted-foreground'
                      }`}>
                        {currentStep > step.id ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="font-semibold">{step.id}</span>
                        )}
                      </div>
                      <span className="text-xs mt-1 text-muted-foreground">{step.title}</span>
                    </div>
                    {step.id < 5 && (
                      <div className={`flex-1 h-1 mx-2 transition-all ${
                        currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/20'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <CardContent className="p-8 pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Service Selection */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <Label className="text-lg font-bold flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" />
                      What service do you need?
                    </Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      {services.map((service, index) => {
                        const Icon = getIconComponent(service.icon);
                        return (
                          <Card
                            key={service.id}
                            className={`p-5 cursor-pointer transition-all hover-lift border-2 animate-scale-in ${
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

                    {/* Fuel Details */}
                    {serviceType === 'fuel_delivery' && (
                      <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg animate-fade-in">
                        <Label className="text-base font-bold flex items-center gap-2">
                          <Fuel className="h-5 w-5 text-amber-600" />
                          Fuel Details
                        </Label>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Fuel Type *</Label>
                            <Select value={fuelType} onValueChange={setFuelType}>
                              <SelectTrigger className="h-12 bg-white">
                                <SelectValue placeholder="Select fuel type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="petrol">Petrol</SelectItem>
                                <SelectItem value="diesel">Diesel</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Amount (Liters) *</Label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={fuelAmount}
                              onChange={(e) => setFuelAmount(e.target.value)}
                              placeholder="e.g., 10"
                              className="h-12"
                            />
                          </div>
                        </div>
                        {fuelType === 'other' && (
                          <Input
                            type="text"
                            value={customFuelType}
                            onChange={(e) => setCustomFuelType(e.target.value)}
                            placeholder="Specify fuel type"
                            className="h-12"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Contact & Location */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    {!user && (
                      <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Label className="text-base font-bold flex items-center gap-2">
                          <Phone className="h-5 w-5 text-primary" />
                          Your Phone Number *
                        </Label>
                        <Input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g., 024 123 4567"
                          className="h-12"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-base font-bold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Your Location *
                      </Label>
                      <div className="flex gap-3">
                        <Input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g., Accra Mall, East Legon"
                          className="h-12 flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                          disabled={gettingLocation}
                          className="h-12 px-4"
                        >
                          {gettingLocation ? (
                            <LucideIcons.Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <LucideIcons.Navigation className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                      {customerLat && customerLng && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          GPS coordinates captured
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Vehicle Information */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <Label className="text-base font-bold flex items-center gap-2">
                      <Car className="h-5 w-5 text-primary" />
                      Vehicle Information
                    </Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Make *</Label>
                        <Input
                          type="text"
                          value={vehicleMake}
                          onChange={(e) => setVehicleMake(e.target.value)}
                          placeholder="e.g., Toyota"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Model *</Label>
                        <Input
                          type="text"
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          placeholder="e.g., Camry"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input
                          type="text"
                          value={vehicleYear}
                          onChange={(e) => setVehicleYear(e.target.value)}
                          placeholder="e.g., 2020"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>License Plate</Label>
                        <Input
                          type="text"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          placeholder="e.g., GR 1234-20"
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Provider Selection */}
                {currentStep === 4 && (
                  <ProviderSelectionStep
                    customerLat={customerLat}
                    customerLng={customerLng}
                    selectedProviderId={selectedProviderId}
                    onProviderSelect={setSelectedProviderId}
                    onAutoAssign={handleAutoAssign}
                  />
                )}

                {/* Step 5: Review & Submit */}
                {currentStep === 5 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl">
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        Review Your Request
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between p-3 bg-background rounded-lg">
                          <span className="text-muted-foreground">Service:</span>
                          <span className="font-semibold">{services.find(s => s.slug === serviceType)?.name}</span>
                        </div>
                        {!user && phoneNumber && (
                          <div className="flex justify-between p-3 bg-background rounded-lg">
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="font-semibold">{phoneNumber}</span>
                          </div>
                        )}
                        <div className="flex justify-between p-3 bg-background rounded-lg md:col-span-2">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-semibold truncate max-w-[300px]">{location}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-background rounded-lg">
                          <span className="text-muted-foreground">Vehicle:</span>
                          <span className="font-semibold">{vehicleMake} {vehicleModel} {vehicleYear}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-background rounded-lg">
                          <span className="text-muted-foreground">Provider:</span>
                          <span className="font-semibold text-primary">
                            {selectedProviderId ? 'Selected' : autoAssignedProviderId ? 'Auto-assigned' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-bold">Additional Details (Optional)</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Any additional information about your situation..."
                        rows={4}
                        className="resize-none"
                      />
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
                      className="flex-1 h-14 text-base"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back
                    </Button>
                  )}
                  
                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 h-14 text-base bg-primary hover:bg-primary/90"
                    >
                      Next
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-14 text-base bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                    >
                      {loading ? (
                        <>
                          <LucideIcons.Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Submit Request
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

      {/* Success Dialog */}
      <Dialog 
        open={successDialogOpen} 
        onOpenChange={(open) => {
          if (!open && createdRequestId) {
            navigate(`/track-rescue?code=${createdRequestId}`);
          }
          setSuccessDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl">Request Submitted!</DialogTitle>
            <DialogDescription className="text-center text-base">
              Your tracking code is:
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
            <code className="text-xl font-bold">{createdRequestId}</code>
            <Button variant="ghost" size="sm" onClick={handleCopyCode}>
              <LucideIcons.Copy className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <Button 
              onClick={() => navigate(`/track-rescue?code=${createdRequestId}`)}
              className="w-full h-12 text-base"
            >
              Track Your Request
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setSuccessDialogOpen(false);
                setCurrentStep(1);
                setServiceType('');
                setLocation('');
                setDescription('');
                setVehicleMake('');
                setVehicleModel('');
                setVehicleYear('');
                setVehiclePlate('');
                setPhoneNumber('');
                setFuelType('');
                setFuelAmount('');
                setSelectedProviderId(null);
                setAutoAssignedProviderId(null);
              }}
              className="w-full h-12 text-base"
            >
              Submit Another Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default DesktopServiceRequest;
