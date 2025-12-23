
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      {children}
    </Suspense>
  );
}
