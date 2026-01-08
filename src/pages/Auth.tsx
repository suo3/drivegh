import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { toast } from 'sonner';
import { z } from 'zod';
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required').max(100),
  phoneNumber: z.string().min(10, 'Phone number is required').max(20),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, user, userRole } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Logged in successfully');
          navigate('/dashboard');
        }
      } else {
        const validation = authSchema.safeParse({ email, password, fullName, phoneNumber });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName, phoneNumber, 'customer');
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created successfully! Please check your email to verify.');
          // Switch to login mode after successful signup
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTEydi0xMmgxMnYxMnptMTItMTJoLTEyVjZoMTJ2MTJ6TTEyIDQySDBoLTEydjEyaDEyVjQyem0yNCAxMkgyNHYtMTJoMTJ2MTJ6TTM2IDZIMjRWLTZoMTJWNnpNMTIgMThoMTJWNkgxMnYxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="relative z-10 animate-fade-in">
          <h1 className="text-5xl font-bold text-white mb-4">DriveGH</h1>
          <p className="text-xl text-white/90">Ghana's Premier Auto Rescue Service</p>
        </div>

        <div className="relative z-10 space-y-6 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">24/7 Emergency Support</h3>
              <p className="text-white/80">Round-the-clock assistance when you need it most</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Verified Professionals</h3>
              <p className="text-white/80">Trusted and certified service providers</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Quick Response Time</h3>
              <p className="text-white/80">Fast dispatch to your location</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © 2025 DriveGH. All rights reserved.
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md shadow-2xl border-primary/10 animate-scale-in">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              {isLogin 
                ? 'Sign in to access your dashboard' 
                : 'Create your account to get started'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        maxLength={100}
                        className="pl-10"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        maxLength={20}
                        className="pl-10"
                        placeholder="+233 XX XXX XXXX"
                      />
                    </div>
                  </div>
                  
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                    className="pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium hover-scale group" 
                disabled={loading}
              >
                {loading ? (
                  'Please wait...'
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors story-link"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
