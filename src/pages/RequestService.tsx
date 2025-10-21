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
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';

const serviceSchema = z.object({
  location: z.string().min(3, 'Location is required').max(200),
  description: z.string().max(1000, 'Description must be less than 1000 characters'),
  serviceType: z.enum(['towing', 'tire_change', 'fuel_delivery', 'battery_jump', 'lockout_service', 'emergency_assistance']),
});

const RequestService = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = serviceSchema.safeParse({
        location,
        description,
        serviceType,
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('service_requests').insert([{
        customer_id: user?.id,
        service_type: serviceType as 'towing' | 'tire_change' | 'fuel_delivery' | 'battery_jump' | 'lockout_service' | 'emergency_assistance',
        location,
        description,
        status: 'pending' as const,
      }]);

      if (error) {
        toast.error('Failed to create service request');
      } else {
        toast.success('Service request created successfully!');
        navigate('/customer');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/customer')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Request Roadside Assistance</CardTitle>
            <CardDescription>
              Fill out the form below and we'll assign a service provider to help you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="towing">Towing</SelectItem>
                    <SelectItem value="tire_change">Tire Change</SelectItem>
                    <SelectItem value="fuel_delivery">Fuel Delivery</SelectItem>
                    <SelectItem value="battery_jump">Battery Jump</SelectItem>
                    <SelectItem value="lockout_service">Lockout Service</SelectItem>
                    <SelectItem value="emergency_assistance">Emergency Assistance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Your Location</Label>
                <Input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Accra Mall, East Legon"
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details about your situation..."
                  maxLength={1000}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Request Service'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestService;
