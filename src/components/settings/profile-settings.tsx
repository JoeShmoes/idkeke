

'use client'

import { useState, useEffect } from 'react';
import { useApp } from '../layout/app-provider';
import { useDebounce } from '@/hooks/use-debounce';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border rounded-lg">
        <h2 className="text-xl font-semibold p-6">{title}</h2>
        <div className="p-6 border-t">
            {children}
        </div>
    </div>
);

export default function ProfileSettings() {
    const { userProfile, setUserProfile } = useApp();
    const [localProfile, setLocalProfile] = useState(userProfile);
    const debouncedProfile = useDebounce(localProfile, 500);
    const { toast } = useToast();
    const router = useRouter();
    const [resetLoading, setResetLoading] = useState(false);
    const [changeLoading, setChangeLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    useEffect(() => {
        // Fetch initials on mount to ensure we have the real email/metadata
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const metadata = user.user_metadata || {};
                const hydratedProfile = {
                    ...userProfile, // base it off existing to keep non-auth fields like hasCompletedSetup
                    email: user.email || userProfile.email,
                    phoneNumber: metadata.phone_number || user.phone || userProfile.phoneNumber,
                    firstName: metadata.first_name || userProfile.firstName,
                    lastName: metadata.last_name || userProfile.lastName,
                    name: metadata.full_name || userProfile.name,
                };
                
                // Update both local and global state to prevent the global state effect from overwriting this on mount
                setLocalProfile(hydratedProfile);
                setUserProfile(hydratedProfile);
            }
        };
        fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // This effect syncs the debounced local state back to the global context.
        if (JSON.stringify(debouncedProfile) !== JSON.stringify(userProfile)) {
            setUserProfile(debouncedProfile);
            
            // Sync to Supabase Auth Metadata for persistence across sessions/devices
            const syncToSupabase = async () => {
                const updates: any = {
                    data: {
                        first_name: debouncedProfile.firstName,
                        last_name: debouncedProfile.lastName,
                        full_name: debouncedProfile.name,
                        phone_number: debouncedProfile.phoneNumber,
                    }
                };
                // Only send email update if it actually changed and isn't empty, to prevent unnecessary confirmation emails
                if (debouncedProfile.email && debouncedProfile.email !== userProfile.email) {
                    updates.email = debouncedProfile.email;
                }

                const { error } = await supabase.auth.updateUser(updates);
                if (error) {
                    console.error('Failed to sync profile to Supabase:', error);
                }
            };
            syncToSupabase();
        }
    }, [debouncedProfile, userProfile, setUserProfile]);

    useEffect(() => {
        // This effect ensures that if the global profile changes (e.g., from an external source),
        // the local state is updated to reflect it, unless we are currently typing (prevent overwrite).
        if (JSON.stringify(userProfile) !== JSON.stringify(localProfile) && JSON.stringify(userProfile) !== JSON.stringify(debouncedProfile)) {
            setLocalProfile(userProfile);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalProfile(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'firstName' || name === 'lastName') {
                updated.name = `${updated.firstName || ''} ${updated.lastName || ''}`.trim();
            }
            return updated;
        });
    };

    const handlePasswordReset = async () => {
        if (!userProfile.email) return;
        
        setResetLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(userProfile.email, {
                redirectTo: `${window.location.origin}/reset`,
            });

            if (error) throw error;

            toast({
                title: 'Reset Email Sent',
                description: `A password reset link has been sent to ${userProfile.email}.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message,
            });
        } finally {
            setResetLoading(false);
        }
    };
    
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { session } } = await supabase.auth.getSession();
        const currentEmail = session?.user?.email || userProfile.email;

        if (!currentEmail) {
            toast({ variant: 'destructive', title: 'Error', description: 'Email is required.' });
            return;
        }
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Fill all password fields.' });
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast({ variant: 'destructive', title: 'Password Mismatch', description: 'New passwords do not match.' });
            return;
        }
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            toast({ variant: 'destructive', title: 'Weak Password', description: 'Must be 8+ chars, 1 uppercase, 1 special.' });
            return;
        }
        setChangeLoading(true);
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: currentEmail,
                password: currentPassword,
            });
            if (authError) throw authError;
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setChangeLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you absolutely sure you want to permanently delete your account? This action cannot be undone.")) return;
        
        try {
            const { error } = await supabase.rpc('delete_user');
            if (error) throw error;
            
            await supabase.auth.signOut();
            window.location.href = '/login';
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };
    
    return (
        <div className="space-y-6">
        <Card title="User Profile">
            <p className="text-sm text-muted-foreground mb-4">Your changes are saved automatically after you stop typing.</p>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" name="firstName" value={localProfile.firstName || ''} onChange={handleProfileChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" name="lastName" value={localProfile.lastName || ''} onChange={handleProfileChange} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={localProfile.email} onChange={handleProfileChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" name="phoneNumber" type="tel" value={localProfile.phoneNumber || ''} onChange={handleProfileChange} />
                </div>
            </div>
        </Card>

        <Card title="Security">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-base">Password Reset</Label>
                    <p className="text-sm text-muted-foreground">Receive an email to reset your password.</p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={handlePasswordReset}
                    disabled={resetLoading}
                >
                    <Lock className="w-4 h-4 mr-2" />
                    {resetLoading ? 'Sending...' : 'Send Reset Email'}
                </Button>
            </div>
            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                        <Input
                            id="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={changeLoading}
                            className="pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            disabled={changeLoading}
                        >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                        <Input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={changeLoading}
                            className="pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            disabled={changeLoading}
                        >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <div className="relative">
                        <Input
                            id="confirmNewPassword"
                            type={showConfirmNewPassword ? 'text' : 'password'}
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            disabled={changeLoading}
                            className="pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            disabled={changeLoading}
                        >
                            {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <Button type="submit" disabled={changeLoading}>
                    {changeLoading ? 'Updating...' : 'Change Password'}
                </Button>
            </form>
        </Card>

        <Card title="Danger Zone">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-base text-destructive">Delete Account</Label>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                </div>
                <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Delete Account
                </Button>
            </div>
        </Card>
        </div>
    );
}
