import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user && userRole) {
        if (userRole === 'customer') {
          navigate('/customer');
        } else if (userRole === 'provider') {
          navigate('/provider');
        } else if (userRole === 'admin') {
          navigate('/admin');
        }
      }
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">DriveGH</h1>
          <p className="text-xl text-muted-foreground">
            Ghana's Premier Roadside Assistance Platform
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-lg">
            Get help when you need it most. Our network of professional service providers
            is ready to assist with towing, tire changes, fuel delivery, and more.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-8">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Towing</h3>
            <p className="text-sm text-muted-foreground">24/7 towing services</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Tire Change</h3>
            <p className="text-sm text-muted-foreground">Quick tire replacement</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Fuel Delivery</h3>
            <p className="text-sm text-muted-foreground">Emergency fuel service</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Battery Jump</h3>
            <p className="text-sm text-muted-foreground">Get back on the road</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Lockout Service</h3>
            <p className="text-sm text-muted-foreground">Vehicle unlock assistance</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Emergency Help</h3>
            <p className="text-sm text-muted-foreground">All roadside emergencies</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
