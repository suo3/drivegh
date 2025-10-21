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
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
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
            <div className="bg-primary/10 p-8 rounded-lg">
              <div className="space-y-6">
                <div>
                  <h3 className="text-4xl font-bold text-primary mb-2">4,500+</h3>
                  <p className="text-muted-foreground">Rescues completed this year</p>
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-primary mb-2">50+</h3>
                  <p className="text-muted-foreground">Professional service providers</p>
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-primary mb-2">10+</h3>
                  <p className="text-muted-foreground">Cities covered nationwide</p>
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-primary mb-2">4.8/5</h3>
                  <p className="text-muted-foreground">Average customer rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[hsl(var(--section-bg))]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <value.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
