'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [sessionChecked, setSessionChecked] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setHasSession(true);
                setSessionChecked(true);
            } else if (event === 'SIGNED_IN') {
                 setHasSession(true);
                 setSessionChecked(true);
            }
        });

        // Also check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setHasSession(true);
            }
            // Give it a moment to process hash from URL
            setTimeout(() => {
                setSessionChecked(true);
            }, 1000);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Password Mismatch',
                description: 'Passwords do not match.',
            });
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            toast({
                variant: 'destructive',
                title: 'Weak Password',
                description: 'Password must be at least 8 characters long, contain at least one uppercase letter, and one special character.',
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            await supabase.auth.signOut();

            toast({
                title: 'Password Updated',
                description: 'Your password has been successfully updated. Please sign in with your new password.',
            });

            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    if (!sessionChecked) {
         return (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm text-muted-foreground">Verifying reset link...</p>
            </div>
        );
    }

    if (!hasSession) {
        return (
             <div className="flex flex-col items-center justify-center gap-4 p-4 text-center">
                <h1 className="text-2xl font-bold">Invalid or Expired Link</h1>
                <p className="text-muted-foreground text-sm">The password reset link is invalid or has expired. Please try requesting a new one.</p>
                <Button onClick={() => router.push('/login')} className="w-full">Back to Login</Button>
            </div>
        )
    }

    return (
        <div className="space-y-8 w-full">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
                <p className="text-muted-foreground">Enter your new security credentials below.</p>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11 pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="h-11 pr-10"
                        />
                         <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <Button type="submit" className="w-full h-11 mt-4" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Password
                </Button>
            </form>
        </div>
    );
}
