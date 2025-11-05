import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Loader2, FileText, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';

const Terms = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Terms & Conditions');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchDocument();
  }, []);

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('document_type', 'terms')
        .eq('is_published', true)
        .single();

      if (error) throw error;

      if (data) {
        setContent(data.content);
        setTitle(data.title);
        setLastUpdated(new Date(data.last_updated).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }));
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      setContent('# Terms & Conditions\n\nUnable to load terms and conditions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Navbar />
      
      <section className="bg-gradient-to-r from-primary via-primary to-primary/90 text-white pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm mb-4">
              <FileText className="h-12 w-12" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">{title}</h1>
            {lastUpdated && (
              <div className="flex items-center justify-center gap-2 text-white/90">
                <Calendar className="h-5 w-5" />
                <p className="text-lg">Last updated: {lastUpdated}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 flex-1">
        <div className="container mx-auto px-4 max-w-4xl">
          {loading ? (
            <Card className="p-20">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading document...</p>
              </div>
            </Card>
          ) : (
            <Card className="p-8 md:p-12 shadow-lg">
              <div className="prose prose-lg prose-slate max-w-none
                dark:prose-invert
                prose-headings:font-bold prose-headings:text-foreground
                prose-h1:text-4xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-primary
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6
                prose-ul:my-6 prose-ul:space-y-2
                prose-li:text-muted-foreground prose-li:leading-relaxed
                prose-strong:text-foreground prose-strong:font-semibold
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
