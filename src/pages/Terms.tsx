import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Loader2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
        setLastUpdated(new Date(data.last_updated).toLocaleDateString());
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      setContent('# Terms & Conditions\n\nUnable to load terms and conditions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="bg-primary text-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <FileText className="h-12 w-12" />
            <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
          </div>
          {lastUpdated && (
            <p className="text-xl text-gray-200">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
      </section>

      <section className="py-16 bg-background flex-1">
        <div className="container mx-auto px-4 max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
