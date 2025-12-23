'use client';

import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";
import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <Construction className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Coming Soon</h1>
        <p className="text-muted-foreground mt-2 max-w-md">This feature is under construction. Check back later!</p>
        <Button asChild className="mt-6">
            <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
    </div>
  );
}
