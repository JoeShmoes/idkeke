'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function DeleteAccountPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [confirmation, setConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (confirmation !== 'DELETE') {
            toast({
                variant: 'destructive',
                title: 'Confirmation Failed',
                description: 'Please type DELETE to confirm.',
            });
            return;
        }

        setAuthOpen(true);
    };
    
    const handleConfirmAuth = async () => {
        setAuthLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password: authPassword
            });
            if (error) throw error;
            if (!data.user) throw new Error('Authentication failed');
            
            const { error: deleteError } = await supabase.rpc('delete_user');
            if (deleteError) throw deleteError;
            
            await supabase.auth.signOut();
            
            toast({
                title: 'Account Deleted',
                description: 'Your account has been permanently deleted.',
            });
            router.push('/login');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Authentication Failed',
                description: error.message || 'Could not verify credentials. Account was not deleted.',
            });
        } finally {
            setAuthLoading(false);
            setAuthOpen(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-destructive/50">
                <CardHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertTriangle className="h-6 w-6" />
                        <span className="font-bold text-lg">Danger Zone</span>
                    </div>
                    <CardTitle>Delete Account</CardTitle>
                    <CardDescription>
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleDeleteAccount}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="confirmation">
                                To confirm, type <span className="font-mono font-bold text-destructive">DELETE</span> below
                            </Label>
                            <Input
                                id="confirmation"
                                type="text"
                                value={confirmation}
                                onChange={(e) => setConfirmation(e.target.value)}
                                placeholder="DELETE"
                                required
                                className="border-destructive/30 focus-visible:ring-destructive/30"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            variant="destructive" 
                            disabled={loading || confirmation !== 'DELETE'}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete Account
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            
            <Dialog open={authOpen} onOpenChange={setAuthOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>Please sign in to confirm you own this account.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAuthOpen(false)} disabled={authLoading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmAuth} disabled={authLoading || !authEmail || !authPassword}>
                            {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm & Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
