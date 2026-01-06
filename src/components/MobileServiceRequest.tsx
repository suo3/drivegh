import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Phone, MapPin, CheckCircle2, AlertCircle, Car, Fuel, ArrowRight, ArrowLeft } from 'lucide-react';
import { ProviderSelectionStep } from '@/components/ProviderSelectionStep';

const MobileServiceRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const totalSteps = 5; // Added provider selection step

  useEffect(() => {
    fetchServices();
    getCurrentLocation();
  }, []);

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
              }).eq('id', data.id);
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
    <section className="py-8 bg-gradient-to-b from-background to-[hsl(var(--section-bg))]">
      <div className="container mx-auto px-4">

        <Card className="shadow-xl border-2 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="bg-primary rounded-lg p-1.5">
                <Car className="h-4 w-4 text-primary-foreground" />
              </div>
              Service Request
            </CardTitle>
            <CardDescription className="text-sm">
              Step {currentStep} of {totalSteps}: {stepData[currentStep - 1]?.title}
            </CardDescription>
          </CardHeader>

          {/* Progress Indicator */}
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              {stepData.map((step) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all text-xs ${
                    currentStep >= step.id 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="font-semibold">{step.id}</span>
                    )}
                  </div>
                  {step.id < 5 && (
                    <div className={`flex-1 h-1 mx-1 transition-all ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <CardContent className="p-4 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Service Selection */}
              {currentStep === 1 && (
                <div className="space-y-3 animate-fade-in">
                  <Label className="text-sm font-bold">What service do you need?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {services.map((service) => {
                      const Icon = getIconComponent(service.icon);
                      return (
                        <Card
                          key={service.id}
                          className={`p-3 cursor-pointer transition-all border-2 ${
                            serviceType === service.slug 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-primary/30'
                          }`}
                          onClick={() => setServiceType(service.slug)}
                        >
                          <div className="flex flex-col items-center text-center gap-2">
                            <div className={`rounded-lg p-2 ${
                              serviceType === service.slug 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-primary/10 text-primary'
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <p className="font-semibold text-xs">{service.name}</p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Fuel Details */}
                  {serviceType === 'fuel_delivery' && (
                    <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-fade-in">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-amber-600" />
                        Fuel Details
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Fuel Type</Label>
                          <Select value={fuelType} onValueChange={setFuelType}>
                            <SelectTrigger className="h-10 bg-white text-sm">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="petrol">Petrol</SelectItem>
                              <SelectItem value="diesel">Diesel</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Amount (L)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={fuelAmount}
                            onChange={(e) => setFuelAmount(e.target.value)}
                            placeholder="e.g., 10"
                            className="h-10 text-sm"
                          />
                        </div>
                      </div>
                      {fuelType === 'other' && (
                        <Input
                          type="text"
                          value={customFuelType}
                          onChange={(e) => setCustomFuelType(e.target.value)}
                          placeholder="Specify fuel type"
                          className="h-10 text-sm"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Contact & Location */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  {!user && (
                    <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Your Phone Number
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
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Your Location
                    </Label>
                    <div className="flex gap-2">
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
                        className="h-12 px-3"
                      >
                        {gettingLocation ? (
                          <LucideIcons.Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <LucideIcons.Navigation className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    {customerLat && customerLng && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        GPS captured
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Vehicle Information */}
              {currentStep === 3 && (
                <div className="space-y-3 animate-fade-in">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    Vehicle Information
                  </Label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Make *</Label>
                      <Input
                        type="text"
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                        placeholder="e.g., Toyota"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Model *</Label>
                      <Input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="e.g., Camry"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Year</Label>
                      <Input
                        type="text"
                        value={vehicleYear}
                        onChange={(e) => setVehicleYear(e.target.value)}
                        placeholder="e.g., 2020"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Plate</Label>
                      <Input
                        type="text"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        placeholder="e.g., GR 1234"
                        className="h-10"
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
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Review Your Request
                    </h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service:</span>
                        <span className="font-semibold">{services.find(s => s.slug === serviceType)?.name}</span>
                      </div>
                      {!user && phoneNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-semibold">{phoneNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-semibold truncate max-w-[150px]">{location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vehicle:</span>
                        <span className="font-semibold">{vehicleMake} {vehicleModel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-semibold text-primary">
                          {selectedProviderId ? 'Selected' : autoAssignedProviderId ? 'Auto-assigned' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Additional Details (Optional)</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Any additional information..."
                      rows={3}
                      className="resize-none text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-2 pt-2">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-12"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {loading ? (
                      <>
                        <LucideIcons.Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
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

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl">Request Submitted!</DialogTitle>
            <DialogDescription className="text-center">
              Your tracking code is:
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
            <code className="text-lg font-bold">{createdRequestId}</code>
            <Button variant="ghost" size="sm" onClick={handleCopyCode}>
              <LucideIcons.Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate(`/track-rescue?code=${createdRequestId}`)}
              className="w-full"
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
              className="w-full"
            >
              Submit Another Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default MobileServiceRequest;
