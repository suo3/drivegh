import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Truck } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-white rounded-full p-2">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <span className="text-white font-bold text-lg">DRIVE Ghana</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm text-white">
          <a href="#home" className="hover:text-accent transition-colors">HOME</a>
          <a href="#about" className="hover:text-accent transition-colors">ABOUT US</a>
          <a href="#services" className="hover:text-accent transition-colors">SERVICES</a>
          <a href="#how-it-works" className="hover:text-accent transition-colors">HOW IT WORKS</a>
          <a href="#contact" className="hover:text-accent transition-colors">CONTACT</a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Button onClick={() => navigate('/')} variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
              Dashboard
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth')} variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
              Login
            </Button>
          )}
          <Button onClick={() => navigate('/auth')} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Get Help
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
