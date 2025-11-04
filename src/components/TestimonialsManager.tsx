import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Star, MessageSquare, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const TestimonialsManager = () => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        profiles!ratings_customer_id_fkey(full_name),
        service_requests!inner(service_type, location)
      `)
      .not('review', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch testimonials');
    } else if (data) {
      setTestimonials(data);
    }
    setLoading(false);
  };

  const handleToggleFeatured = async (testimonial: any) => {
    const { error } = await supabase
      .from('ratings')
      .update({ featured: !testimonial.featured })
      .eq('id', testimonial.id);
    
    if (error) {
      toast.error('Failed to update testimonial');
    } else {
      toast.success(`Testimonial ${!testimonial.featured ? 'featured' : 'unfeatured'} on homepage`);
      fetchTestimonials();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete review');
    } else {
      toast.success('Review deleted successfully');
      fetchTestimonials();
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Customer Testimonials</CardTitle>
              <CardDescription className="text-base mt-1">
                Manage which reviews appear on the homepage
              </CardDescription>
            </div>
          </div>
          
          <Badge variant="secondary" className="text-base px-4 py-2">
            {testimonials.filter(t => t.featured).length} Featured
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center py-8">Loading testimonials...</div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No customer reviews yet</p>
            <p className="text-sm text-muted-foreground">
              Reviews will appear here once customers complete services and leave ratings.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> Toggle the "Featured" switch to control which testimonials appear on the homepage. 
                Only featured testimonials with 4+ stars will be displayed to visitors.
              </p>
            </div>
            
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="border-2 hover:border-primary/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center font-bold">
                            {testimonial.profiles?.full_name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-bold">{testimonial.profiles?.full_name || 'Anonymous'}</p>
                            <p className="text-sm text-muted-foreground">
                              {testimonial.service_requests?.location || 'Ghana'} • {format(new Date(testimonial.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          {renderStars(testimonial.rating)}
                        </div>
                        
                        <p className="text-muted-foreground italic mb-2">
                          "{testimonial.review}"
                        </p>
                        
                        <Badge variant="outline" className="text-xs">
                          {testimonial.service_requests?.service_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3 ml-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Featured</span>
                          <Switch
                            checked={testimonial.featured}
                            onCheckedChange={() => handleToggleFeatured(testimonial)}
                          />
                        </div>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(testimonial.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TestimonialsManager;
