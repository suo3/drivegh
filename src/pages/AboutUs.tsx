import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Users, Target, Award, Clock, Heart, Shield, Zap, TrendingUp, CheckCircle2, Sparkles } from 'lucide-react';

const AboutUs = () => {
  const values = [
    { icon: Clock, title: 'Available 24/7', desc: 'Round-the-clock service to ensure you\'re never stranded', color: 'from-blue-500 to-blue-600' },
    { icon: Users, title: 'Professional Team', desc: 'Trained and certified technicians across Ghana', color: 'from-purple-500 to-purple-600' },
    { icon: Target, title: 'Customer First', desc: 'Your safety and satisfaction is our priority', color: 'from-green-500 to-green-600' },
    { icon: Award, title: 'Quality Service', desc: 'Consistently delivering excellence in every rescue', color: 'from-accent to-yellow-500' },
  ];

  const stats = [
    { icon: Users, value: '4,500+', label: 'Happy Customers' },
    { icon: Clock, value: '<30min', label: 'Avg Response Time' },
    { icon: Award, value: '10+', label: 'Cities Covered' },
    { icon: TrendingUp, value: '99%', label: 'Satisfaction Rate' },
  ];

  const milestones = [
    { year: '2020', title: 'Founded', desc: 'Started in Accra with a vision to transform roadside assistance' },
    { year: '2021', title: 'Expansion', desc: 'Expanded to Kumasi and Tema, serving 1000+ customers' },
    { year: '2022', title: 'Growth', desc: 'Reached 10 cities with 50+ service providers nationwide' },
    { year: '2023', title: 'Innovation', desc: 'Launched mobile app and real-time tracking features' },
    { year: '2024', title: 'Leadership', desc: 'Ghana\'s #1 roadside assistance with 4,500+ rescues' },
  ];

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      
      {/* Compact Banner */}
      <section className="bg-gradient-to-r from-primary to-primary/90 border-b border-primary/20 pt-16">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">About Us</h1>
          <p className="text-white/80 text-sm">Your trusted partner for emergency roadside services</p>
        </div>
      </section>

      {/* Our Story Section - Simplified on mobile */}
      <section className="py-12 lg:py-24 bg-gradient-to-b from-background to-[hsl(var(--section-bg))] relative">
        <div className="hidden lg:block absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="hidden lg:block absolute bottom-10 left-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16 items-start max-w-6xl mx-auto">
            {/* Left: Story content */}
            <div className="space-y-6 lg:space-y-8 animate-fade-in-left">
              <div>
                <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-primary/10 text-primary rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
                  Our Journey
                </div>
                <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-4 lg:mb-6">The Story Behind DRIVE Ghana</h2>
              </div>
              
              <div className="space-y-4 lg:space-y-6 text-sm lg:text-lg text-muted-foreground leading-relaxed">
                <p className="flex items-start gap-2 lg:gap-3">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-primary flex-shrink-0 mt-0.5 lg:mt-1" />
                  <span>
                    Founded in 2020, DRIVE Ghana was born from a simple observation: drivers across Ghana needed reliable, 
                    professional roadside assistance they could trust.
                  </span>
                </p>
                
                <p className="flex items-start gap-2 lg:gap-3">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-primary flex-shrink-0 mt-0.5 lg:mt-1" />
                  <span>
                    What started as a small team in Accra has grown into a nationwide network of professional service providers 
                    covering 10+ major cities across Ghana.
                  </span>
                </p>
                
                <p className="flex items-start gap-2 lg:gap-3 lg:block hidden">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span>
                    Today, we serve thousands of customers, providing emergency roadside assistance 24/7. Our commitment to 
                    fast response times and professional service has made us Ghana's leading provider.
                  </span>
                </p>
              </div>

              {/* Mission statement card */}
              <Card className="p-5 lg:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20">
                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="bg-primary rounded-lg lg:rounded-xl p-2 lg:p-3">
                    <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg lg:text-xl font-bold mb-1 lg:mb-2">Our Mission</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm lg:text-base">
                      To ensure no driver is left stranded on Ghana's roads by providing fast, reliable, and professional 
                      roadside assistance whenever and wherever it's needed.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Right: Values cards - show only 2 on mobile */}
            <div className="space-y-4 lg:space-y-6 animate-fade-in-right">
              <div>
                <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-accent/10 text-accent-foreground rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
                  Core Values
                </div>
                <h3 className="text-xl lg:text-3xl font-bold mb-4 lg:mb-6">What Drives Us</h3>
              </div>
              
              <div className="space-y-3 lg:space-y-4">
                {values.map((value, index) => (
                  <Card 
                    key={index} 
                    className={`p-5 lg:p-6 hover-lift cursor-pointer group border-2 hover:border-primary/30 bg-gradient-to-br from-white to-gray-50/50 animate-scale-in ${index > 1 ? 'hidden lg:block' : ''}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start gap-3 lg:gap-4">
                      <div className={`bg-gradient-to-br ${value.color} rounded-lg lg:rounded-xl p-2 lg:p-3 group-hover:scale-110 transition-transform shrink-0`}>
                        <value.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base lg:text-xl font-bold mb-1 lg:mb-2 group-hover:text-primary transition-colors">{value.title}</h4>
                        <p className="text-muted-foreground leading-relaxed text-sm lg:text-base">{value.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section - Simplified on mobile */}
      <section className="py-12 lg:py-24 bg-[hsl(var(--section-bg))] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 hidden lg:block">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="timeline-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" className="text-primary" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#timeline-dots)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-8 lg:mb-16 animate-fade-in">
            <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-secondary/10 text-secondary rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
              Our Journey
            </div>
            <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-4">Milestones That Matter</h2>
            <p className="text-muted-foreground text-sm lg:text-lg max-w-2xl mx-auto px-4">
              Five years of growth, innovation, and commitment
            </p>
          </div>

          <div className="max-w-5xl mx-auto relative">
            {/* Timeline line - hidden on mobile */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-accent -translate-x-1/2"></div>
            
            <div className="space-y-6 lg:space-y-12">
              {milestones.slice(0, 3).map((milestone, index) => (
                <div 
                  key={index} 
                  className={`relative animate-fade-in ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className={`md:grid md:grid-cols-2 gap-8 items-center ${index % 2 === 0 ? '' : 'md:grid-flow-dense'}`}>
                    {/* Timeline dot - hidden on mobile */}
                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full border-4 border-white shadow-lg items-center justify-center z-10">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* Content card */}
                    <Card className={`p-5 lg:p-8 hover-lift bg-gradient-to-br from-white to-gray-50/50 border-2 hover:border-primary/30 ${index % 2 === 0 ? 'md:col-start-1' : 'md:col-start-2'}`}>
                      <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                        <div className="bg-gradient-to-br from-accent to-yellow-500 text-accent-foreground rounded-full px-3 py-0.5 lg:px-4 lg:py-1 text-xs lg:text-sm font-bold">
                          {milestone.year}
                        </div>
                        <h3 className="text-lg lg:text-2xl font-bold">{milestone.title}</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-sm lg:text-lg">{milestone.desc}</p>
                    </Card>
                    
                    {/* Empty space for alternating layout */}
                    <div className={`hidden md:block ${index % 2 === 0 ? 'md:col-start-2' : 'md:col-start-1'}`}></div>
                  </div>
                </div>
              ))}
              
              {/* Show all on desktop */}
              {milestones.slice(3).map((milestone, index) => {
                const actualIndex = index + 3;
                return (
                  <div 
                    key={actualIndex} 
                    className={`hidden lg:block relative animate-fade-in ${actualIndex % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}
                    style={{ animationDelay: `${actualIndex * 0.15}s` }}
                  >
                    <div className={`md:grid md:grid-cols-2 gap-8 items-center ${actualIndex % 2 === 0 ? '' : 'md:grid-flow-dense'}`}>
                      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full border-4 border-white shadow-lg items-center justify-center z-10">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      
                      <Card className={`p-8 hover-lift bg-gradient-to-br from-white to-gray-50/50 border-2 hover:border-primary/30 ${actualIndex % 2 === 0 ? 'md:col-start-1' : 'md:col-start-2'}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-br from-accent to-yellow-500 text-accent-foreground rounded-full px-4 py-1 text-sm font-bold">
                            {milestone.year}
                          </div>
                          <h3 className="text-2xl font-bold">{milestone.title}</h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-lg">{milestone.desc}</p>
                      </Card>
                      
                      <div className={`hidden md:block ${actualIndex % 2 === 0 ? 'md:col-start-2' : 'md:col-start-1'}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Compact on mobile */}
      <section className="py-12 lg:py-24 bg-gradient-to-br from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 lg:mb-16 animate-fade-in">
            <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-primary/10 text-primary rounded-full text-xs lg:text-sm font-semibold mb-3 lg:mb-4">
              Why Choose DRIVE
            </div>
            <h2 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-4">What Sets Us Apart</h2>
            <p className="text-muted-foreground text-sm lg:text-lg max-w-2xl mx-auto px-4">
              We're not just another roadside assistance service.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 lg:gap-8 max-w-6xl mx-auto">
            {[
              { 
                icon: Zap, 
                title: 'Lightning Fast', 
                desc: 'Average response time under 30 minutes. We get to you quickly when every second counts.',
                gradient: 'from-yellow-500 to-orange-500'
              },
              { 
                icon: Shield, 
                title: 'Fully Vetted Pros', 
                desc: 'All technicians are certified, background-checked, and trained to deliver excellent service.',
                gradient: 'from-blue-500 to-purple-500'
              },
              { 
                icon: Heart, 
                title: 'Customer Care', 
                desc: 'We treat every customer like family. Your safety and satisfaction come first, always.',
                gradient: 'from-pink-500 to-red-500'
              },
            ].map((feature, index) => (
              <Card 
                key={index}
                className="p-6 lg:p-8 text-center hover-lift bg-gradient-to-br from-white to-gray-50/50 border-2 hover:border-primary/30 animate-scale-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`bg-gradient-to-br ${feature.gradient} rounded-xl lg:rounded-2xl w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-lg`}>
                  <feature.icon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-lg lg:text-2xl font-bold mb-2 lg:mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm lg:text-base">{feature.desc}</p>
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
