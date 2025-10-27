import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProfileForm } from '@/components/ProfileForm';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <section className="bg-primary text-white pt-32 pb-16">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-4">Profile</h1>
            <p className="text-xl text-gray-200 max-w-3xl">
              Sign in to view and edit your profile
            </p>
          </div>
        </section>
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <Card className="p-12 max-w-2xl mx-auto text-center">
              <User className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to view and edit your profile
              </p>
              <Button onClick={() => navigate('/auth')} size="lg">
                Sign In to Continue
              </Button>
            </Card>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="bg-primary text-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')} 
            className="mb-4 text-white hover:text-accent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-5xl font-bold mb-4">My Profile</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            Manage your account information and preferences
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Profile;