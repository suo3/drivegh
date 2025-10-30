import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  is_active: boolean;
  display_order: number;
}

const ServiceManager = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast.error('Failed to load services');
      console.error(error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingService) {
      const { error } = await supabase
        .from('services')
        .update(formData)
        .eq('id', editingService.id);

      if (error) {
        toast.error('Failed to update service');
        console.error(error);
      } else {
        toast.success('Service updated successfully');
        setDialogOpen(false);
        resetForm();
        fetchServices();
      }
    } else {
      const { error } = await supabase
        .from('services')
        .insert([formData]);

      if (error) {
        toast.error('Failed to create service');
        console.error(error);
      } else {
        toast.success('Service created successfully');
        setDialogOpen(false);
        resetForm();
        fetchServices();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete service');
      console.error(error);
    } else {
      toast.success('Service deleted successfully');
      fetchServices();
    }
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from('services')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update service status');
      console.error(error);
    } else {
      toast.success('Service status updated');
      fetchServices();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      is_active: true,
      display_order: 0,
    });
    setEditingService(null);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      slug: service.slug,
      description: service.description || '',
      icon: service.icon,
      is_active: service.is_active,
      display_order: service.display_order,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      display_order: services.length + 1,
    }));
    setDialogOpen(true);
  };

  if (loading) {
    return <div>Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Service Manager</h2>
          <p className="text-sm text-muted-foreground">
            Manage services displayed in navigation and request forms
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{service.name}</h3>
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Slug: {service.slug} | Icon: {service.icon} | Order: {service.display_order}
                    </p>
                    {service.description && (
                      <p className="text-sm mt-1">{service.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={service.is_active}
                    onCheckedChange={(checked) => handleToggleActive(service.id, checked)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(service)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Create Service'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Towing"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., towing"
                required
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs and database (lowercase, use underscores)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Lucide Icon Name *</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., Truck, Wrench, Battery"
                required
              />
              <p className="text-xs text-muted-foreground">
                Find icons at: lucide.dev
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description of the service"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                min={0}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingService ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceManager;
