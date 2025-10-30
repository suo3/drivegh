import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Users, Target, Award, Clock } from 'lucide-react';

const AboutUs = () => {
  const values = [
    { icon: Clock, title: 'Available 24/7', desc: 'Round-the-clock service to ensure you\'re never stranded' },
    { icon: Users, title: 'Professional Team', desc: 'Trained and certified technicians across Ghana' },
    { icon: Target, title: 'Customer First', desc: 'Your safety and satisfaction is our priority' },
    { icon: Award, title: 'Quality Service', desc: 'Consistently delivering excellence in every rescue' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="bg-primary text-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">About DRIVE Ghana</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            Ghana's most trusted roadside assistance service, helping thousands of drivers every year
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl font-bold mb-6">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                Founded in 2020, DRIVE Ghana was born from a simple observation: drivers across Ghana needed reliable, 
                professional roadside assistance they could trust. What started as a small team in Accra has grown into 
                a nationwide network of professional service providers.
              </p>
              <p className="text-muted-foreground mb-4">
                Today, we serve thousands of customers across Ghana, providing emergency roadside assistance 24/7. 
                Our commitment to fast response times, professional service, and customer satisfaction has made us 
                the leading roadside assistance provider in Ghana.
              </p>
              <p className="text-muted-foreground">
                Whether you're dealing with a flat tire, dead battery, or need emergency towing, our team is ready 
                to help you get back on the road safely.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6">Our Values</h3>
              <div className="grid gap-4">
                {values.map((value, index) => (
                  <Card key={index} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <value.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold mb-1">{value.title}</h4>
                        <p className="text-muted-foreground text-sm">{value.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
