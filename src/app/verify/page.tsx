'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerifyContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (error) {
    return (
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <CheckCircle2 className="h-10 w-10 text-destructive rotate-45" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">Verification Failed</CardTitle>
          <CardDescription>
            The verification link was invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground leading-relaxed">
           This could happen if you've already used the link or if too much time has passed. Please try logging in again to request a new link.
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login">
            <Button variant="outline">
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-brand-blue/20 shadow-xl shadow-brand-blue/5">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-green-50 rounded-full">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
        <CardDescription>
          Your account has been successfully verified.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground leading-relaxed">
        Welcome to Nexaris! Your workspace is ready. You can now access all features and start building your productive future.
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/dashboard">
          <Button className="bg-brand-blue hover:bg-brand-dark transition-all px-8 py-5 h-auto text-lg font-bold rounded-xl shadow-lg shadow-brand-blue/20">
            Go to Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 pattern-dots">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-brand-blue" />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
