import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Layout, Eye, EyeOff } from 'lucide-react';

const HomepageSectionsManager = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) {
      toast.error('Failed to fetch sections');
    } else if (data) {
      setSections(data);
    }
    setLoading(false);
  };

  const handleToggleActive = async (section: any) => {
    const { error } = await supabase
      .from('homepage_sections')
      .update({ is_active: !section.is_active })
      .eq('id', section.id);
    
    if (error) {
      toast.error('Failed to update section');
    } else {
      toast.success(`${section.label} ${!section.is_active ? 'enabled' : 'disabled'}`);
      fetchSections();
    }
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Layout className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Homepage Sections</CardTitle>
            <CardDescription className="text-base mt-1">Control which sections appear on the homepage</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center py-8">Loading sections...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Visible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">{section.display_order}</TableCell>
                  <TableCell className="font-semibold">{section.label}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {section.is_active ? (
                        <>
                          <Eye className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Hidden</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={section.is_active}
                      onCheckedChange={() => handleToggleActive(section)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Disabling a section will hide it from the homepage for all visitors. 
            Changes take effect immediately.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HomepageSectionsManager;
