'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/components/layout/app-provider';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { userProfile, setUserProfile } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (userProfile.hasCompletedSetup) {
      router.push('/dashboard');
    }
  }, [userProfile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!email || !password || !firstName || !lastName || !confirmPassword) {
      setFormError('Please fill out all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setFormError('Password must be at least 8 characters long, contain at least one uppercase letter, and one special character.');
      return;
    }

    setLoading(true);

    try {
      // Sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: {
            full_name: `${firstName} ${lastName}`,
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      setFormSuccess('Account created! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error: any) {
      setFormError(error.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white/70 backdrop-blur-2xl border border-slate-200/50 rounded-[2.5rem] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] space-y-7 relative group/card">
        <div className="flex items-center">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="h-8 text-[11px] text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all rounded-full px-3">
              <ArrowLeft className="mr-1.5 h-3 w-3" />
              Back
            </Button>
          </Link>
        </div>
        
        <div className="space-y-1.5 text-center">
          <h1 className="text-4xl font-medium tracking-tight text-slate-900 leading-tight" style={{ fontFamily: "'EB Garamond', serif" }}>
            Create Account
          </h1>
          <p className="text-slate-500 text-[13px] font-light tracking-wide">
            Join the neural workspace for digital builders
          </p>
        </div>

        {emailSent ? (
          <div className="text-center space-y-4 py-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/10 flex items-center justify-center text-primary mx-auto shadow-[0_8px_30px_-5px_rgba(0,102,255,0.15)]">
              <Loader2 className="h-7 w-7 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-medium text-slate-900" style={{ fontFamily: "'EB Garamond', serif" }}>Verify your email</h2>
              <p className="text-slate-500 text-[13px]">
                We've sent a link to <span className="text-slate-900 font-medium">{email}</span>.
              </p>
            </div>
            <Button variant="outline" className="w-full h-11 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 transition-all text-slate-900 mt-4 shadow-sm" onClick={() => router.push('/login')}>
              Return to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold ml-1">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  className="h-11 bg-slate-50/50 border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:bg-white transition-all rounded-xl text-slate-900 placeholder:text-slate-300 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold ml-1">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className="h-11 bg-slate-50/50 border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:bg-white transition-all rounded-xl text-slate-900 placeholder:text-slate-300 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11 bg-slate-50/50 border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:bg-white transition-all rounded-xl text-slate-900 placeholder:text-slate-300 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold ml-1">Password</Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 bg-slate-50/50 border-slate-200 group-hover:border-slate-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:bg-white transition-all rounded-xl text-slate-900 placeholder:text-slate-300 pr-10 shadow-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent text-slate-300 hover:text-slate-500"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" title="Repeat password" className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold ml-1">Confirm Password</Label>
              <div className="relative group">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 bg-slate-50/50 border-slate-200 group-hover:border-slate-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:bg-white transition-all rounded-xl text-slate-900 placeholder:text-slate-300 pr-10 shadow-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent text-slate-300 hover:text-slate-500"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-[13px] font-medium p-3 rounded-xl flex items-center justify-center animate-in slide-in-from-top-2">
                {formError}
              </div>
            )}
            
            {formSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[13px] font-medium p-3 rounded-xl flex items-center justify-center animate-in slide-in-from-top-2">
                {formSuccess}
              </div>
            )}

            <div className="pt-[7px]">
                <Button 
                    type="submit" 
                    className="w-full h-12 bg-slate-900 text-white hover:bg-black transition-all rounded-xl font-bold text-[15px] shadow-[0_8px_30px_-10px_rgba(0,0,0,0.3)] active:scale-[0.98] disabled:opacity-50" 
                    disabled={loading}
                >
                {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                    'Create Account'
                )}
                </Button>
            </div>
          </form>
        )}

        {!emailSent && (
          <div className="text-center text-[13px] text-slate-400 pt-2">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-slate-900 hover:text-primary transition-colors hover:underline underline-offset-4">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
