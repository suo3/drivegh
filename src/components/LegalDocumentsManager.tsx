import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Shield, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const LegalDocumentsManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  const [termsDoc, setTermsDoc] = useState<any>(null);
  const [privacyDoc, setPrivacyDoc] = useState<any>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .in('document_type', ['terms', 'privacy']);

      if (error) throw error;

      const terms = data?.find(d => d.document_type === 'terms');
      const privacy = data?.find(d => d.document_type === 'privacy');

      setTermsDoc(terms || { document_type: 'terms', title: '', content: '', is_published: true });
      setPrivacyDoc(privacy || { document_type: 'privacy', title: '', content: '', is_published: true });
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (documentType: 'terms' | 'privacy') => {
    setSaving(documentType);
    const doc = documentType === 'terms' ? termsDoc : privacyDoc;

    try {
      const dataToSave = {
        document_type: documentType,
        title: doc.title,
        content: doc.content,
        is_published: doc.is_published,
        last_updated: new Date().toISOString(),
        updated_by: user?.id,
      };

      if (doc.id) {
        // Update existing
        const { error } = await supabase
          .from('legal_documents')
          .update(dataToSave)
          .eq('id', doc.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('legal_documents')
          .insert(dataToSave);

        if (error) throw error;
      }

      toast.success(`${doc.title} saved successfully`);
      fetchDocuments(); // Refresh to get the updated data
    } catch (error: any) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Legal Documents
        </CardTitle>
        <CardDescription>Manage Terms & Conditions and Privacy Policy</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Terms & Conditions
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy Policy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="terms-title">Title</Label>
              <Input
                id="terms-title"
                value={termsDoc?.title || ''}
                onChange={(e) => setTermsDoc({ ...termsDoc, title: e.target.value })}
                placeholder="Terms & Conditions"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms-content">Content (Markdown supported)</Label>
              <Textarea
                id="terms-content"
                value={termsDoc?.content || ''}
                onChange={(e) => setTermsDoc({ ...termsDoc, content: e.target.value })}
                placeholder="Enter terms and conditions content..."
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use Markdown formatting: # for headings, ## for subheadings, - for lists
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="terms-published"
                checked={termsDoc?.is_published || false}
                onCheckedChange={(checked) => setTermsDoc({ ...termsDoc, is_published: checked })}
              />
              <Label htmlFor="terms-published">Published (visible to users)</Label>
            </div>

            <Button
              onClick={() => handleSave('terms')}
              disabled={saving === 'terms'}
              className="w-full"
            >
              {saving === 'terms' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Terms & Conditions
            </Button>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="privacy-title">Title</Label>
              <Input
                id="privacy-title"
                value={privacyDoc?.title || ''}
                onChange={(e) => setPrivacyDoc({ ...privacyDoc, title: e.target.value })}
                placeholder="Privacy Policy"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacy-content">Content (Markdown supported)</Label>
              <Textarea
                id="privacy-content"
                value={privacyDoc?.content || ''}
                onChange={(e) => setPrivacyDoc({ ...privacyDoc, content: e.target.value })}
                placeholder="Enter privacy policy content..."
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use Markdown formatting: # for headings, ## for subheadings, - for lists
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="privacy-published"
                checked={privacyDoc?.is_published || false}
                onCheckedChange={(checked) => setPrivacyDoc({ ...privacyDoc, is_published: checked })}
              />
              <Label htmlFor="privacy-published">Published (visible to users)</Label>
            </div>

            <Button
              onClick={() => handleSave('privacy')}
              disabled={saving === 'privacy'}
              className="w-full"
            >
              {saving === 'privacy' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Privacy Policy
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LegalDocumentsManager;
