import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
  Users,
  Plus,
  Trash2,
  Building,
  Globe,
  Loader2,
  Search
} from 'lucide-react';

const BeneficiaryPage = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    account_number: '',
    iban: '',
    swift_bic: '',
    country: '',
    address: ''
  });

  const fetchBeneficiaries = async () => {
    try {
      const response = await api.get('/beneficiaries');
      setBeneficiaries(response.data);
    } catch (error) {
      toast.error('Failed to fetch beneficiaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      await api.post('/beneficiaries', formData);
      toast.success('Beneficiary added successfully');
      setFormData({
        name: '',
        bank_name: '',
        account_number: '',
        iban: '',
        swift_bic: '',
        country: '',
        address: ''
      });
      setDialogOpen(false);
      fetchBeneficiaries();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add beneficiary');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/beneficiaries/${id}`);
      toast.success('Beneficiary deleted');
      fetchBeneficiaries();
    } catch (error) {
      toast.error('Failed to delete beneficiary');
    }
  };

  const filteredBeneficiaries = beneficiaries.filter(ben => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      ben.name?.toLowerCase().includes(searchLower) ||
      ben.bank_name?.toLowerCase().includes(searchLower) ||
      ben.country?.toLowerCase().includes(searchLower) ||
      ben.swift_bic?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6" data-testid="beneficiary-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-white uppercase tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            Beneficiaries
          </h1>
          <p className="text-swiss-text-secondary mt-1">
            Manage your payment beneficiaries
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-swiss-red hover:bg-swiss-red-hover text-white font-medium uppercase tracking-wider rounded-sm"
              data-testid="add-beneficiary-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Beneficiary
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-swiss-bg-paper border-white/10 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl text-white">Add New Beneficiary</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                  Beneficiary Name
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-swiss-bg-subtle border-white/10 text-white rounded-sm"
                  placeholder="John Doe / Company Ltd"
                  data-testid="ben-name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                  Bank Name
                </Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="bg-swiss-bg-subtle border-white/10 text-white rounded-sm"
                  placeholder="Deutsche Bank AG"
                  data-testid="ben-bank"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                    Account Number
                  </Label>
                  <Input
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="bg-swiss-bg-subtle border-white/10 text-white font-mono rounded-sm"
                    placeholder="123456789"
                    data-testid="ben-account"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                    SWIFT/BIC
                  </Label>
                  <Input
                    value={formData.swift_bic}
                    onChange={(e) => setFormData({ ...formData, swift_bic: e.target.value.toUpperCase() })}
                    className="bg-swiss-bg-subtle border-white/10 text-white font-mono rounded-sm"
                    placeholder="DEUTDEFF"
                    data-testid="ben-swift"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                  IBAN
                </Label>
                <Input
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                  className="bg-swiss-bg-subtle border-white/10 text-white font-mono rounded-sm"
                  placeholder="DE89 3704 0044 0532 0130 00"
                  data-testid="ben-iban"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                    Country
                  </Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="bg-swiss-bg-subtle border-white/10 text-white rounded-sm"
                    placeholder="Germany"
                    data-testid="ben-country"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                    Address
                  </Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-swiss-bg-subtle border-white/10 text-white rounded-sm"
                    placeholder="123 Main St, Berlin"
                    data-testid="ben-address"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={creating}
                className="w-full h-11 bg-swiss-red hover:bg-swiss-red-hover text-white font-medium uppercase tracking-wider rounded-sm"
                data-testid="submit-beneficiary"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Beneficiary
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-swiss-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-swiss-bg-subtle border-white/10 text-white rounded-sm h-10"
              placeholder="Search beneficiaries..."
              data-testid="search-beneficiaries"
            />
          </div>
        </CardContent>
      </Card>

      {/* Beneficiaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-swiss-text-muted" />
          </div>
        ) : filteredBeneficiaries.length === 0 ? (
          <Card className="col-span-full bg-swiss-bg-paper border-white/10 rounded-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="w-12 h-12 text-swiss-text-muted mb-4" strokeWidth={1} />
              <p className="text-swiss-text-muted">
                {search ? 'No beneficiaries match your search' : 'No beneficiaries yet. Add one to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBeneficiaries.map((ben) => (
            <Card key={ben.id} className="bg-swiss-bg-paper border-white/10 rounded-sm swiss-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-swiss-bg-subtle flex items-center justify-center">
                      <Building className="w-5 h-5 text-swiss-text-muted" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{ben.name}</p>
                      <p className="text-xs text-swiss-text-muted">{ben.bank_name}</p>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-swiss-text-muted hover:text-swiss-red hover:bg-swiss-red/10"
                        data-testid={`delete-ben-${ben.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-swiss-bg-paper border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Beneficiary</AlertDialogTitle>
                        <AlertDialogDescription className="text-swiss-text-secondary">
                          Are you sure you want to delete {ben.name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-swiss-bg-subtle border-white/10 text-white hover:bg-white/10">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(ben.id)}
                          className="bg-swiss-red hover:bg-swiss-red-hover text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-swiss-text-muted" />
                    <span className="text-xs text-swiss-text-secondary">{ben.country}</span>
                  </div>
                  <div className="p-2 bg-swiss-bg-subtle rounded-sm">
                    <p className="text-xs text-swiss-text-muted mb-1">IBAN</p>
                    <p className="font-mono text-xs text-swiss-text-secondary break-all">{ben.iban}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-swiss-text-muted">SWIFT/BIC</p>
                      <p className="font-mono text-sm text-white">{ben.swift_bic}</p>
                    </div>
                    <Badge className="bg-swiss-status-success/20 text-swiss-status-success rounded-sm text-xs">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BeneficiaryPage;
