import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Clock, User, Phone } from 'lucide-react';
import { useState } from 'react';

const TrackRescue = () => {
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock tracking result for demo
    setTrackingResult({
      id: trackingId,
      status: 'en_route',
      provider: 'Kwame Auto Services',
      providerPhone: '+233 24 555 1234',
      estimatedArrival: '15 minutes',
      location: 'Accra-Tema Motorway, near Airport Junction',
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="bg-primary text-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Track Your Rescue</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            Monitor your rescue team in real-time and know exactly when help will arrive
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <form onSubmit={handleTrack} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trackingId">Enter Your Tracking ID</Label>
                  <Input
                    id="trackingId"
                    placeholder="e.g., DGH-2025-001234"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    You received this ID when you requested assistance
                  </p>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Track Rescue
                </Button>
              </form>
            </Card>

            {trackingResult && (
              <div className="space-y-4">
                <Card className="p-6 bg-accent/10 border-accent">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-accent rounded-full p-3">
                      <Clock className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Rescue Team En Route</h3>
                      <p className="text-sm text-muted-foreground">Estimated arrival: {trackingResult.estimatedArrival}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Rescue Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Your Location</p>
                        <p className="text-sm text-muted-foreground">{trackingResult.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Service Provider</p>
                        <p className="text-sm text-muted-foreground">{trackingResult.provider}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Contact Number</p>
                        <p className="text-sm text-muted-foreground">{trackingResult.providerPhone}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Tip:</strong> Keep your phone nearby. The provider may call if they need to confirm your exact location.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TrackRescue;
