'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp, defaultUserProfile } from '@/components/layout/app-provider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { userProfile, setUserProfile } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (userProfile?.hasCompletedSetup) {
      router.push('/dashboard');
      return;
    }

    // Check for existing Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
          setUserProfile({
            ...(userProfile || defaultUserProfile),
            name: name,
            email: session.user.email || '',
            hasCompletedSetup: true,
          });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };

    checkSession();

    // Remember Me logic
    try {
      const savedEmail = localStorage.getItem('rememberedEmail');
      const wasRemembered = localStorage.getItem('rememberMe') === 'true';
      if (wasRemembered && savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [userProfile, router, setUserProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!email || !password) {
      setFormError('Please fill out all required fields.');
      return;
    }

    if (isSignUp) {
      if (!firstName || !lastName) {
        setFormError('Please enter your first and last name.');
        return;
      }

      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }

      // Password validation: 8 chars, 1 cap, 1 special
      const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!passwordRegex.test(password)) {
        setFormError('Password must be at least 8 characters long, contain at least one uppercase letter, and one special character.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
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

        setIsSignUp(false);
        setFormSuccess('Account created! Please log in to continue.');
        setPassword('');
        setConfirmPassword('');
      }
      else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const name = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User';
          
          setUserProfile({
            ...userProfile,
            name: name,
            email: email,
            hasCompletedSetup: true,
          });

          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberedEmail');
          }

          setFormSuccess('You have been signed in successfully!');
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      if (error.message && (error.message.includes('Email not confirmed') || error.message.includes('Email link is invalid'))) {
          setFormError('Please verify your email or use offline mode.');
          return;
      }

      setFormError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Check your email',
        description: 'We have sent you a password reset link.',
      });
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
  
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.userAgent.includes('NexarisDesktop')) {
      setIsDesktop(true);
    }
  }, []);

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={cn(
        "transition-all duration-[800ms] relative bg-white/70 backdrop-blur-2xl border border-slate-200/50 rounded-[2.5rem] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]",
        isSignUp ? "space-y-7" : "space-y-6"
      )}>
        <div className="flex items-center">
          {(!isDesktop || isSignUp) && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[11px] text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all rounded-full px-3"
                onClick={() => {
                  if (isSignUp) {
                    setIsSignUp(false);
                  } else {
                    router.push('/');
                  }
                }}
            >
              <ArrowLeft className="mr-1.5 h-3 w-3" />
              Back {isSignUp ? '' : 'to Home'}
            </Button>
          )}
        </div>
        
        <div className="space-y-1.5 text-center">
          <h1 className={cn(
            "tracking-tight text-slate-900 leading-tight font-medium",
            isSignUp ? "text-4xl" : "text-3xl"
          )} style={{ fontFamily: "'EB Garamond', serif" }}>
            {isSignUp ? 'Create Account' : 'Welcome to Nexaris'}
          </h1>
          <p className="text-slate-500 text-[13px] font-light tracking-wide">
            {isSignUp ? 'Join the neural workspace for digital builders' : 'Sign in to continue to your dashboard'}
          </p>
        </div>

        {emailSent ? (
          <div className={cn("text-center space-y-4 py-4")}>
            <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/10 shadow-[0_8px_30px_-5px_rgba(0,102,255,0.15)] flex items-center justify-center text-primary mx-auto">
              <Loader2 className="h-7 w-7 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-medium text-slate-900" style={{ fontFamily: "'EB Garamond', serif" }}>Check your email</h2>
              <p className="text-slate-500 text-[13px]">
                We've sent a verification link to <strong className="text-slate-900">{email}</strong>.
              </p>
            </div>
            <Button variant="outline" className="w-full h-11 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 transition-all text-slate-900 mt-4 shadow-sm" onClick={() => setEmailSent(false)}>
              Back to login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={cn("space-y-4", isSignUp ? "space-y-5" : "space-y-4")}>
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
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
            )}

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold ml-1">Password</Label>
                {!isSignUp && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-[10px] text-slate-400 hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      handleForgotPassword();
                    }}
                    disabled={loading}
                  >
                    Forgot Password?
                  </Button>
                )}
              </div>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isSignUp ? "••••••••" : "Enter your password"}
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

            {isSignUp && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
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
            )}

            {!isSignUp && (
              <div className="flex items-center space-x-2 py-0.5">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={loading}
                  className="border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                />
                <Label htmlFor="remember" className="text-xs font-normal cursor-pointer text-slate-500 hover:text-slate-900 transition-colors">
                  Remember me
                </Label>
              </div>
            )}

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

            <div className={isSignUp ? "pt-[7px]" : "pt-2"}>
                <Button 
                    type="submit" 
                    className={cn(
                        "w-full bg-slate-900 text-white hover:bg-black transition-all rounded-xl font-bold font-sans shadow-[0_8px_30px_-10px_rgba(0,0,0,0.3)] active:scale-[0.98] disabled:opacity-50",
                        isSignUp ? "h-12 text-[15px]" : "h-11 text-sm"
                    )}
                    disabled={loading}
                >
                {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isSignUp ? 'Creating...' : 'Signing in...'}</>
                ) : (
                    isSignUp ? 'Create Account' : 'Log in'
                )}
                </Button>
            </div>
          </form>
        )}

        {!emailSent && (
          <div className="text-center text-[13px] text-slate-400 pt-2">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="h-auto p-0 font-semibold text-slate-900 hover:text-primary transition-colors hover:underline underline-offset-4"
                  onClick={() => setIsSignUp(false)}
                  disabled={loading}
                >
                  Sign in
                </Button>
              </>
            ) : (
              <>
                New to Nexaris?{' '}
                <Button
                  variant="link"
                  className="h-auto p-0 font-semibold text-slate-900 hover:text-primary transition-colors hover:underline underline-offset-4"
                  onClick={() => setIsSignUp(true)}
                  disabled={loading}
                >
                  Create an account
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
