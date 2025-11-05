import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Footer = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (data) setServices(data);
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <footer className="bg-[#0a1628] text-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Mobile: Collapsible Sections */}
        <div className="md:hidden space-y-2">
          <Collapsible open={openSections.includes('company')}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('company')}
              className="flex items-center justify-between w-full py-3 text-left font-bold text-lg border-b border-gray-700"
            >
              COMPANY SERVICES
              <ChevronDown className={`h-5 w-5 transition-transform ${openSections.includes('company') ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 pb-2 space-y-2 text-sm text-gray-400">
              <Link to="/about" className="block py-1.5 hover:text-white transition-colors">About Us</Link>
              <Link to="/billing" className="block py-1.5 hover:text-white transition-colors">Billing</Link>
              <Link to="/track-rescue" className="block py-1.5 hover:text-white transition-colors">Track</Link>
              <Link to="/partnership" className="block py-1.5 hover:text-white transition-colors">Partnership</Link>
              <Link to="/contact" className="block py-1.5 hover:text-white transition-colors">Contact Us</Link>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections.includes('services')}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('services')}
              className="flex items-center justify-between w-full py-3 text-left font-bold text-lg border-b border-gray-700"
            >
              SERVICES
              <ChevronDown className={`h-5 w-5 transition-transform ${openSections.includes('services') ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 pb-2 space-y-2 text-sm text-gray-400">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => navigate(`/request-service?service=${service.slug}`)}
                  className="block py-1.5 hover:text-white transition-colors text-left w-full"
                >
                  {service.name}
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections.includes('cities')}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('cities')}
              className="flex items-center justify-between w-full py-3 text-left font-bold text-lg border-b border-gray-700"
            >
              POPULAR CITIES
              <ChevronDown className={`h-5 w-5 transition-transform ${openSections.includes('cities') ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 pb-2 space-y-2 text-sm text-gray-400">
              {['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast'].map((city) => (
                <button 
                  key={city}
                  onClick={() => navigate('/request-service')} 
                  className="block py-1.5 hover:text-white transition-colors text-left w-full"
                >
                  {city}
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Contact Section - Always Visible on Mobile */}
          <div className="pt-4 border-t border-gray-700">
            <h3 className="font-bold text-lg mb-3">CONTACT</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a href="tel:+233202222244" className="hover:text-white">+233 20 222 2244</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:support@drivegh.com" className="hover:text-white">support@drivegh.com</a>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Follow Us</p>
              <div className="flex gap-3">
                <a href="#" className="bg-blue-600 p-2 rounded hover:bg-blue-700 transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="bg-blue-400 p-2 rounded hover:bg-blue-500 transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="bg-pink-600 p-2 rounded hover:bg-pink-700 transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="bg-blue-700 p-2 rounded hover:bg-blue-800 transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">COMPANY SERVICES</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/billing" className="hover:text-white transition-colors">Billing</Link></li>
              <li><Link to="/track-rescue" className="hover:text-white transition-colors">Track</Link></li>
              <li><Link to="/partnership" className="hover:text-white transition-colors">Partnership</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">SERVICES</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {services.map((service) => (
                <li key={service.id}>
                  <button
                    onClick={() => navigate(`/request-service?service=${service.slug}`)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {service.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">POPULAR CITIES</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={() => navigate('/request-service')} className="hover:text-white transition-colors text-left">
                  Accra
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/request-service')} className="hover:text-white transition-colors text-left">
                  Kumasi
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/request-service')} className="hover:text-white transition-colors text-left">
                  Tamale
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/request-service')} className="hover:text-white transition-colors text-left">
                  Takoradi
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/request-service')} className="hover:text-white transition-colors text-left">
                  Cape Coast
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">CONTACT</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                <span>123 Independence Ave, Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+233 20 222 2244</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>support@drivegh.com</span>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Follow Us</p>
              <div className="flex gap-3">
                <a href="#" className="bg-blue-600 p-2 rounded hover:bg-blue-700 transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="bg-blue-400 p-2 rounded hover:bg-blue-500 transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="bg-pink-600 p-2 rounded hover:bg-pink-700 transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="bg-blue-700 p-2 rounded hover:bg-blue-800 transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 md:mt-8 pt-4 md:pt-6 text-center text-xs md:text-sm text-gray-400">
          <p>
            © 2025 DRIVE Ghana • All rights reserved • 
            <Link to="/terms" className="hover:text-white transition-colors ml-1">Terms & Conditions</Link> | 
            <Link to="/privacy" className="hover:text-white transition-colors ml-1">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
