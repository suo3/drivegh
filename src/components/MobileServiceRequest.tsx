import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Phone, MapPin, CheckCircle2, Car, ArrowLeft, Camera, Image as ImageIcon, MapPinned, Navigation, ChevronDown } from 'lucide-react';
import { geocodeAddress } from '@/lib/geocode';
import { calculateDistance } from '@/lib/distance';
import { ProviderSelectionMap } from '@/components/ProviderSelectionMap';
import { useNearbyProviders } from '@/hooks/useNearbyProviders';
import { ProviderCard } from '@/components/ProviderCard';

const MobileServiceRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('phone_number')
          .eq('id', user.id)
          .single();

        if (data?.phone_number) {
          setPhoneNumber(data.phone_number);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [serviceType, setServiceType] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [isCustomFuel, setIsCustomFuel] = useState(false);
  const [fuelAmount, setFuelAmount] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  // Vehicle Photo State
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(null);

  // Map & Location State
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // UI State
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Provider State
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [autoAssignedProviderId, setAutoAssignedProviderId] = useState<string | null>(null);

  // Fetch nearby providers hook
  const { providers, closestProvider, hasNearbyProviders, loading: providersLoading } = useNearbyProviders({
    customerLat,
    customerLng,
    radiusKm: 10,
    enabled: customerLat !== null && customerLng !== null && currentStep >= 4,
  });

  useEffect(() => {
    fetchServices();
    getCurrentLocation();
  }, []);

  // Auto-select closest provider if none selected
  useEffect(() => {
    if (currentStep === 4 && !selectedProviderId && closestProvider) {
      // Optional: Auto-select closest? Or just let user choose.
      // For now, let's just keep track of it for potential auto-assignment on submit
    }
  }, [currentStep, closestProvider, selectedProviderId]);

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVehiclePhoto(file);
      const objectUrl = URL.createObjectURL(file);
      setVehiclePhotoPreview(objectUrl);
    }
  };

  const uploadPhoto = async (requestId: string): Promise<string | null> => {
    if (!vehiclePhoto) return null;
    try {
      const fileExt = vehiclePhoto.name.split('.').pop();
      const fileName = `${requestId}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('service-request-images')
        .upload(fileName, vehiclePhoto);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-request-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload vehicle photo');
      return null;
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!serviceType) {
          toast.error('Please select a service type');
          return false;
        }
        if (serviceType === 'fuel_delivery' && !fuelType) {
          toast.error('Please select a fuel type');
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
        if (!vehiclePhoto) {
          toast.error('Please take a photo of your vehicle');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      // Geocode address if moving from Location step and no GPS coordinates
      if (currentStep === 2 && !customerLat && !customerLng && location.trim()) {
        setGettingLocation(true);
        const coords = await geocodeAddress(location.trim());
        if (coords) {
          setCustomerLat(coords.lat);
          setCustomerLng(coords.lng);
          toast.success('Location coordinates found');
        }
        setGettingLocation(false);
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setLoading(true);

    const assignedProviderId = selectedProviderId || (closestProvider?.provider_id) || null;

    try {
      // 1. Create the request first
      const { data, error } = await supabase.from('service_requests').insert([{
        customer_id: user?.id || null,
        phone_number: phoneNumber.trim(),
        service_type: serviceType as any,
        fuel_type: serviceType === 'fuel_delivery' ? fuelType : null,
        fuel_amount: serviceType === 'fuel_delivery' && fuelAmount ? parseFloat(fuelAmount) : null,
        location: location.trim(),
        description: description.trim(),
        customer_lat: customerLat,
        customer_lng: customerLng,
        status: assignedProviderId ? 'assigned' : 'pending',
        provider_id: assignedProviderId,
        assigned_at: assignedProviderId ? new Date().toISOString() : null,
        // Default text fields to indicate photo is used
        vehicle_make: 'See Photo',
        vehicle_model: 'See Photo',
      }]).select().single();

      if (error) throw error;

      // 2. Upload photo and update request
      if (vehiclePhoto) {
        const publicUrl = await uploadPhoto(data.id);
        if (publicUrl) {
          await supabase.from('service_requests')
            .update({ vehicle_image_url: publicUrl })
            .eq('id', data.id);
        }
      }

      // 3. Robust Auto-assign fallback logic
      if (!assignedProviderId && customerLat && customerLng) {
        console.log("Attempting auto-assignment...");
        let foundProviderId: string | null = null;

        // 3a. Try RPC first (server-side, efficient)
        try {
          const { data: closestData } = await supabase.rpc('find_closest_provider', {
            customer_lat: customerLat,
            customer_lng: customerLng,
          });

          if (closestData && closestData.length > 0) {
            foundProviderId = closestData[0].provider_id;
            console.log("Found provider via RPC:", foundProviderId);
          }
        } catch (rpcError) {
          console.error("RPC Auto-assign failed:", rpcError);
        }

        // 3b. Client-side Fallback (if RPC failed to find anyone, e.g. due to strict radius)
        if (!foundProviderId) {
          console.log("RPC returned no providers. Trying global fallback...");
          try {
            const { data: allProviders, error: providerError } = await supabase
              .from('profiles')
              .select('id, current_lat, current_lng, user_roles!inner(role)')
              .eq('user_roles.role', 'provider')
              .eq('is_available', true);

            if (!providerError && allProviders && allProviders.length > 0) {
              // Calculate distances and sort
              const sortedProviders = allProviders
                .filter(p => p.current_lat !== null && p.current_lng !== null) // Ensure coords exist
                .map(p => ({
                  id: p.id,
                  distance: calculateDistance(customerLat, customerLng, p.current_lat as number, p.current_lng as number)
                })).sort((a, b) => a.distance - b.distance);

              if (sortedProviders.length > 0) {
                foundProviderId = sortedProviders[0].id;
                console.log("Found provider via Global Fallback:", foundProviderId, "Distance:", sortedProviders[0].distance);
              }
            }
          } catch (fbError) {
            console.error("Global fallback failed:", fbError);
          }
        }

        // 3c. Update if we found someone
        if (foundProviderId) {
          await supabase.from('service_requests').update({
            provider_id: foundProviderId,
            status: 'assigned',
            assigned_at: new Date().toISOString(),
          }).eq('id', data.id);
          console.log("Auto-assigned provider:", foundProviderId);
        }
      }

      setCreatedRequestId(data.tracking_code || data.id);
      setSuccessDialogOpen(true);
      toast.success('Service request submitted successfully!');

    } catch (error) {
      console.error(error);
      toast.error('Failed to create service request');
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

  // Bottom Sheet Height & Content based on step
  const getSheetContent = () => {
    switch (currentStep) {
      case 1: // Service Selection
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">What help do you need?</h3>
            <div className="grid grid-cols-2 gap-3">
              {services.map((service) => {
                const Icon = getIconComponent(service.icon);
                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      setServiceType(service.slug);
                      if (service.slug !== 'fuel_delivery') {
                        setFuelType('');
                        setFuelAmount('');
                        setIsCustomFuel(false);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${serviceType === service.slug
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                      }`}
                  >
                    <Icon className={`w-8 h-8 mb-2 ${serviceType === service.slug ? 'text-primary' : 'text-gray-500'}`} />
                    <span className={`text-sm font-medium ${serviceType === service.slug ? 'text-primary' : 'text-gray-700'}`}>
                      {service.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {serviceType === 'fuel_delivery' && (
              <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-300">
                <hr className="border-gray-200" />
                <Label className="text-base">Select Fuel Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['Petrol', 'Diesel', 'Other'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        if (type === 'Other') {
                          setIsCustomFuel(true);
                          setFuelType('');
                        } else {
                          setIsCustomFuel(false);
                          setFuelType(type);
                        }
                      }}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all font-medium text-sm ${(type === 'Other' ? isCustomFuel : (!isCustomFuel && fuelType === type))
                        ? 'border-primary bg-primary text-white'
                        : 'border-muted hover:border-primary/50 text-gray-700 bg-white'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {isCustomFuel && (
                  <div className="space-y-2 pt-1 animate-in slide-in-from-top-2 duration-200">
                    <Label>Specify Fuel Type</Label>
                    <Input
                      placeholder="e.g. Premium, V-Power"
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="h-12"
                    />
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Label>Amount (GHS) - Optional</Label>
                  <Input
                    type="number"
                    placeholder="E.g. 200"
                    value={fuelAmount}
                    onChange={(e) => setFuelAmount(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            )}

            <Button className="w-full h-12 text-base" onClick={handleNext} disabled={!serviceType || (serviceType === 'fuel_delivery' && !fuelType)}>
              Continue
            </Button>
          </div>
        );

      case 2: // Location & Contact
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Where are you?</h3>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="024 123 4567"
                  className="pl-10 h-12"
                  type="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Search landmark..."
                    className="pl-10 h-12"
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-12 w-12 p-0"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                >
                  <Navigation className={`h-5 w-5 ${gettingLocation ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            <Button className="w-full h-12 text-base" onClick={handleNext}>
              Confirm Location
            </Button>
          </div>
        );

      case 3: // Vehicle Photo
        return (
          <div className="space-y-6 text-center">
            <h3 className="text-lg font-bold">Vehicle Details</h3>
            <p className="text-muted-foreground text-sm">
              Please take a clear photo of your vehicle so our driver can identify you.
            </p>

            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {vehiclePhotoPreview ? (
                <img
                  src={vehiclePhotoPreview}
                  alt="Vehicle Preview"
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
              ) : (
                <>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-primary">Tap to take or upload photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
              />
            </div>

            <Button className="w-full h-12 text-base" onClick={handleNext} disabled={!vehiclePhoto}>
              Continue
            </Button>
          </div>
        );

      case 4: // Provider Selection
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Select a Provider</h3>
              <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                {providers.length} nearby
              </span>
            </div>

            {providersLoading ? (
              <div className="py-8 text-center text-muted-foreground">Finding nearby drivers...</div>
            ) : providers.length === 0 ? (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm mb-4">
                No drivers nearby. Don't worry, we'll connect you with the closest available driver automatically.
              </div>
            ) : (
              <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                {providers.map(provider => (
                  <ProviderCard
                    key={provider.provider_id}
                    provider={provider}
                    isSelected={selectedProviderId === provider.provider_id}
                    onSelect={setSelectedProviderId}
                  />
                ))}
              </div>
            )}

            <Button className="w-full h-12 text-base" onClick={handleNext}>
              {selectedProviderId ? 'Select Driver' : 'Auto-Assign Driver'}
            </Button>
          </div>
        );

      case 5: // Review
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Review Request</h3>

            <Card className="p-4 space-y-3 bg-muted/50 border-0">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Service</span>
                <span className="font-semibold">{services.find(s => s.slug === serviceType)?.name}</span>
              </div>
              {serviceType === 'fuel_delivery' && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Fuel</span>
                  <span className="font-semibold">{fuelType} {fuelAmount ? `(GHS ${fuelAmount})` : ''}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Location</span>
                <span className="font-semibold truncate max-w-[200px]">{location}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-semibold flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Photo Attached
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-semibold text-primary">
                  {selectedProviderId ? 'Selected' : 'Auto-assign'}
                </span>
              </div>
            </Card>

            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue..."
                className="resize-none"
                rows={2}
              />
            </div>

            <Button className="w-full h-14 text-lg bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Confirm Request'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-100 flex flex-col md:block">
      {/* Full Screen Map Background */}
      <div className="absolute inset-0 z-0">
        <ProviderSelectionMap
          customerLat={customerLat || 0}
          customerLng={customerLng || 0}
          providers={currentStep >= 4 ? providers : []}
          selectedProviderId={selectedProviderId}
          onProviderSelect={setSelectedProviderId}
          className="w-full h-full rounded-none border-0"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
      </div>

      {/* Mobile Top Navigation Overlay */}
      <div className="relative z-10 p-4 flex items-center justify-between md:hidden">
        {currentStep > 1 ? (
          <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 shadow-lg bg-white/90 backdrop-blur text-foreground border border-gray-200" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div />
        )}
        <div className="px-3 py-1 bg-white/90 backdrop-blur rounded-full shadow-lg text-xs font-bold font-mono">
          STEP {currentStep}/5
        </div>
      </div>

      {/* Spacer to push content down on mobile */}
      <div className="flex-1 md:hidden" />

      {/* Main Content Container: Bottom Sheet (Mobile) vs Floating Card (Desktop) */}
      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.15)] 
                      md:absolute md:top-6 md:left-6 md:bottom-6 md:w-[480px] md:rounded-2xl md:shadow-2xl md:flex md:flex-col
                      animate-in slide-in-from-bottom md:slide-in-from-left duration-300 border border-white/20">

        {/* Desktop Header (Inside Card) */}
        <div className="hidden md:flex items-center justify-between p-6 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button size="icon" variant="ghost" onClick={handleBack} className="-ml-3 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <span className="font-bold text-lg">
              {currentStep === 1 && 'Select Service'}
              {currentStep === 2 && 'Location'}
              {currentStep === 3 && 'Vehicle Info'}
              {currentStep === 4 && 'Choose Provider'}
              {currentStep === 5 && 'Review'}
            </span>
          </div>
          <div className="text-xs font-bold text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
            STEP {currentStep}/5
          </div>
        </div>

        {/* Mobile Drag Handle / Collapse Toggle */}
        <div
          className="md:hidden w-full flex flex-col items-center justify-center pt-3 pb-1 cursor-pointer touch-none active:opacity-70"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-1" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium animate-pulse">
            {isCollapsed ? 'Tap to expand' : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          className={`px-6 pb-8 overflow-y-auto custom-scrollbar flex-1 transition-all duration-300 ease-in-out md:max-h-full md:opacity-100
             ${isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[70vh] opacity-100 pt-2'}`}
        >
          {getSheetContent()}
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
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl">Help is on the way!</DialogTitle>
            <DialogDescription className="text-center">
              Share this code with your driver:
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-xl border-dashed border-2">
            <code className="text-2xl font-bold tracking-wider">{createdRequestId}</code>
            <Button variant="ghost" size="icon" onClick={handleCopyCode}>
              <LucideIcons.Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid gap-3 pt-4">
            <Button
              onClick={() => navigate(`/track-rescue?code=${createdRequestId}`)}
              className="w-full h-12 text-base"
            >
              Track Driver
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSuccessDialogOpen(false);
                // Reset state
                setCurrentStep(1);
                setVehiclePhoto(null);
                setVehiclePhotoPreview(null);
                setSelectedProviderId(null);
                setServiceType('');
                setFuelType('');
                setFuelAmount('');
                setIsCustomFuel(false);
              }}
              className="w-full"
            >
              New Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileServiceRequest;
