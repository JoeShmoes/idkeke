'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/layout/app-provider';

export default function SetupDevPage() {
    const router = useRouter();
    const { setUserProfile } = useApp();
    const [email, setEmail] = useState('dev@nexaris.app');
    const [password, setPassword] = useState('DevAccount123!');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const createAccount = async () => {
        setStatus('loading');
        setMessage('');
        try {
            // 1. Try to Sign Up
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: 'Dev User',
                        first_name: 'Dev',
                        last_name: 'User'
                    }
                }
            });

            if (error) {
                // If user already exists, try to sign in
                if (error.message.includes('already registered')) {
                     setMessage('User already exists. Attempting login...');
                     const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                         email,
                         password
                     });
                     
                     if (signInError) {
                         setStatus('error');
                         setMessage(signInError.message);
                     } else {
                         setStatus('success');
                         setMessage('User existed. Logged in successfully!');
                         setUserProfile({
                             name: 'Dev User',
                             firstName: 'Dev',
                             lastName: 'User',
                             email: email,
                             hasCompletedSetup: true,
                         });
                         setTimeout(() => router.push('/dashboard'), 1500);
                     }
                } else {
                    setStatus('error');
                    setMessage(error.message);
                }
            } else if (data.user) {
                // Check if session is established (meaning no email confirm required)
                if (data.session) {
                    setStatus('success');
                    setMessage('Account created and logged in!');
                    setUserProfile({
                        name: 'Dev User',
                        firstName: 'Dev',
                        lastName: 'User',
                        email: email,
                        hasCompletedSetup: true,
                    });
                    setTimeout(() => router.push('/dashboard'), 1500);
                } else {
                    setStatus('success');
                    setMessage('Account created! Please check your email/console to confirm if required.');
                }
            }
        } catch (e: any) {
            setStatus('error');
            setMessage(e.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Create Dev Account</CardTitle>
                    <CardDescription>
                        Quickly generate a development account for testing.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input value={password} onChange={e => setPassword(e.target.value)} />
                        <p className="text-xs text-muted-foreground">
                            Requirements: 8+ chars, 1 uppercase, 1 special char.
                        </p>
                    </div>

                    {status === 'error' && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-md">
                            <XCircle className="w-4 h-4" />
                            {message}
                        </div>
                    )}
                    
                    {status === 'success' && (
                        <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-md">
                            <CheckCircle className="w-4 h-4" />
                            {message}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button 
                        onClick={createAccount} 
                        className="w-full" 
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {status === 'loading' ? 'Processing...' : 'Create & Login'}
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="w-full" 
                        onClick={() => router.push('/login')}
                    >
                        Back to Login
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
