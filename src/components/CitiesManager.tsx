import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MapPinned, Edit, Trash2, Plus } from 'lucide-react';
import { z } from 'zod';

const citySchema = z.object({
  name: z.string().trim().min(1, { message: "City name is required" }).max(100, { message: "City name must be less than 100 characters" }),
  display_order: z.number().min(0, { message: "Display order must be a positive number" }).max(1000, { message: "Display order too large" })
});

const CitiesManager = () => {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) {
      toast.error('Failed to fetch cities');
    } else if (data) {
      setCities(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      citySchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (editingCity) {
      const { error } = await supabase
        .from('cities')
        .update(formData)
        .eq('id', editingCity.id);
      
      if (error) {
        toast.error('Failed to update city');
      } else {
        toast.success('City updated successfully');
        setDialogOpen(false);
        resetForm();
        fetchCities();
      }
    } else {
      const { error } = await supabase
        .from('cities')
        .insert([formData]);
      
      if (error) {
        toast.error('Failed to create city');
      } else {
        toast.success('City created successfully');
        setDialogOpen(false);
        resetForm();
        fetchCities();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this city?')) return;
    
    const { error } = await supabase
      .from('cities')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete city');
    } else {
      toast.success('City deleted successfully');
      fetchCities();
    }
  };

  const handleEdit = (city: any) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      display_order: city.display_order,
      is_active: city.is_active
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCity(null);
    setFormData({
      name: '',
      display_order: cities.length + 1,
      is_active: true
    });
  };

  const handleToggleActive = async (city: any) => {
    const { error } = await supabase
      .from('cities')
      .update({ is_active: !city.is_active })
      .eq('id', city.id);
    
    if (error) {
      toast.error('Failed to update city status');
    } else {
      toast.success(`City ${!city.is_active ? 'activated' : 'deactivated'}`);
      fetchCities();
    }
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <MapPinned className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Cities Manager</CardTitle>
              <CardDescription className="text-base mt-1">Manage coverage cities</CardDescription>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="shadow-md hover:shadow-lg transition-shadow">
                <Plus className="h-4 w-4 mr-2" />
                Add City
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background z-50">
              <DialogHeader>
                <DialogTitle>{editingCity ? 'Edit City' : 'Add New City'}</DialogTitle>
                <DialogDescription>
                  {editingCity ? 'Update city information' : 'Add a new city to your coverage area'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">City Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Accra"
                    maxLength={100}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="1000"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCity ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center py-8">Loading cities...</div>
        ) : cities.length === 0 ? (
          <div className="text-center py-12">
            <MapPinned className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No cities added yet</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add First City
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>City Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.display_order}</TableCell>
                  <TableCell className="font-semibold">{city.name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={city.is_active}
                      onCheckedChange={() => handleToggleActive(city)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(city)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(city.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CitiesManager;
