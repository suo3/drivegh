import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#0a1628] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
              <li><a href="#" className="hover:text-white transition-colors">Towing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tyre</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Jump Start</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Lockout</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Out of Fuel</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">POPULAR CITIES</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Accra</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kumasi</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tamale</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Takoradi</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cape Coast</a></li>
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

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>© 2025 DRIVE Ghana • All rights reserved • Terms & Conditions | Privacy Policy</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
