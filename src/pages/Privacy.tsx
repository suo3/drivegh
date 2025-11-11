import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Loader2, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Privacy = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Privacy Policy');
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
        .eq('document_type', 'privacy')
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
      console.error('Error fetching privacy policy:', error);
      setContent('# Privacy Policy\n\nUnable to load privacy policy. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Minimal Hero */}
      <section className="border-b pt-24 pb-8 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{title}</h1>
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <p>Last updated: {lastUpdated}</p>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4 max-w-4xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading document...</p>
            </div>
          ) : (
            <article className="privacy-content 
              prose prose-base md:prose-lg max-w-none
              prose-headings:scroll-mt-20
              prose-h1:text-3xl prose-h1:font-extrabold prose-h1:text-foreground prose-h1:mb-8 prose-h1:mt-12 prose-h1:border-b prose-h1:pb-6
              prose-h2:text-2xl prose-h2:font-bold prose-h2:text-foreground prose-h2:mb-6 prose-h2:mt-12
              prose-h3:text-xl prose-h3:font-bold prose-h3:text-foreground prose-h3:mb-5 prose-h3:mt-10
              prose-p:text-base prose-p:text-foreground/80 prose-p:leading-8 prose-p:mb-6
              prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-3
              prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-3
              prose-li:text-base prose-li:text-foreground/80 prose-li:leading-8
              prose-strong:text-foreground prose-strong:font-bold
              prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              dark:prose-invert
            ">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Privacy;
