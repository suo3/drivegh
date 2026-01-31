import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Wallet, CheckCircle, AlertTriangle, Building2, Smartphone } from 'lucide-react';
import { z } from 'zod';

interface Bank {
  id: number;
  name: string;
  code: string;
  type: string;
  is_mobile_money: boolean;
}

interface PayoutDetails {
  bank_code: string;
  account_number: string;
  account_name: string;
  account_type: string;
  subaccount_code: string;
  created_at: string;
}

interface PayoutSettingsProps {
  userId: string;
  onComplete?: () => void;
}

const accountSchema = z.object({
  accountNumber: z.string()
    .min(10, 'Account number must be at least 10 digits')
    .max(15, 'Account number must be less than 15 digits')
    .regex(/^\d+$/, 'Account number must contain only digits'),
  bankCode: z.string().min(1, 'Please select a bank or mobile money provider'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
});

const PayoutSettings = ({ userId, onComplete }: PayoutSettingsProps) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [existingPayout, setExistingPayout] = useState<PayoutDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [accountType, setAccountType] = useState<'mobile_money' | 'bank'>('mobile_money');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    fetchExistingPayout();
    fetchBanks();
  }, []);

  useEffect(() => {
    // Refetch banks when account type changes
    fetchBanks();
  }, [accountType]);

  const fetchExistingPayout = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('payout_details, full_name')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.payout_details && typeof data.payout_details === 'object' && !Array.isArray(data.payout_details)) {
        const payoutData = data.payout_details as Record<string, unknown>;
        if (payoutData.bank_code && payoutData.account_number) {
          setExistingPayout(payoutData as unknown as PayoutDetails);
        }
      }
      if (data?.full_name) {
        setBusinessName(data.full_name);
      }
    } catch (error) {
      console.error('Error fetching payout details:', error);
    }
  };

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-banks', {
        body: null,
      });

      if (error) throw error;

      if (data?.banks) {
        // Filter based on account type
        const filteredBanks = data.banks.filter((bank: Bank) => 
          accountType === 'mobile_money' ? bank.is_mobile_money : !bank.is_mobile_money
        );
        setBanks(filteredBanks);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      toast.error('Failed to load payment providers');
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = accountSchema.safeParse({
      accountNumber: accountNumber.trim(),
      bankCode,
      businessName: businessName.trim(),
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('paystack-create-subaccount', {
        body: {
          businessName: businessName.trim(),
          accountNumber: accountNumber.trim(),
          bankCode,
          accountType,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Account verified: ${data.account_name}`);
        setExistingPayout({
          bank_code: bankCode,
          account_number: accountNumber,
          account_name: data.account_name,
          account_type: accountType,
          subaccount_code: data.subaccount_code,
          created_at: new Date().toISOString(),
        });
        setShowForm(false);
        onComplete?.();
      } else {
        throw new Error(data?.error || 'Failed to set up payout account');
      }
    } catch (error: any) {
      console.error('Error setting up payout:', error);
      toast.error(error.message || 'Failed to set up payout account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBank = banks.find(b => b.code === bankCode);

  // Show existing payout info
  if (existingPayout && !showForm) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle>Payout Account Active</CardTitle>
            </div>
            <Badge className="bg-green-600 text-white">Verified</Badge>
          </div>
          <CardDescription>
            Your earnings will be transferred to this account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-background rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-3">
              {existingPayout.account_type === 'mobile_money' ? (
                <Smartphone className="h-5 w-5 text-primary" />
              ) : (
                <Building2 className="h-5 w-5 text-primary" />
              )}
              <span className="font-medium capitalize">
                {existingPayout.account_type?.replace('_', ' ') || 'Mobile Money'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Name</span>
                <span className="font-medium">{existingPayout.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-mono">
                  ****{existingPayout.account_number?.slice(-4)}
                </span>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            Update Payout Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show warning if no payout set up
  if (!existingPayout && !showForm) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle>Set Up Your Payout Account</CardTitle>
          </div>
          <CardDescription>
            You need to add your mobile money or bank account to receive payments for your services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Add Payout Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show the form
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <CardTitle>Payout Settings</CardTitle>
        </div>
        <CardDescription>
          Add your mobile money or bank account to receive earnings (85% of each job after platform fee)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Type Toggle */}
          <div className="space-y-2">
            <Label>Account Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={accountType === 'mobile_money' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setAccountType('mobile_money');
                  setBankCode('');
                }}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile Money
              </Button>
              <Button
                type="button"
                variant={accountType === 'bank' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setAccountType('bank');
                  setBankCode('');
                }}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Bank Account
              </Button>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">
              {accountType === 'mobile_money' ? 'Mobile Money Provider' : 'Bank'}
            </Label>
            {loadingBanks ? (
              <div className="flex items-center gap-2 text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading providers...
              </div>
            ) : (
              <Select value={bankCode} onValueChange={setBankCode}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${accountType === 'mobile_money' ? 'provider' : 'bank'}...`} />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">
              {accountType === 'mobile_money' ? 'Phone Number' : 'Account Number'}
            </Label>
            <Input
              id="accountNumber"
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder={accountType === 'mobile_money' ? '0XX XXX XXXX' : '00000000000'}
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground">
              {accountType === 'mobile_money' 
                ? 'Enter your mobile money number without country code' 
                : 'Enter your bank account number'}
            </p>
          </div>

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName">Business/Account Name</Label>
            <Input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your name or business name"
              maxLength={100}
            />
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              <strong>Note:</strong> Your account will be verified with Paystack. 
              Make sure the details match your registered {accountType === 'mobile_money' ? 'mobile money' : 'bank'} account.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {existingPayout && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting || !bankCode || !accountNumber}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying Account...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify & Save Account
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PayoutSettings;
