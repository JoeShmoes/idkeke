'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp } from '@/components/layout/app-provider';
import ExcalidrawRoom from '@/components/collaboration/ExcalidrawRoom';
import { Loader2 } from 'lucide-react';

export default function SharedRoomPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { userProfile, isDataLoaded } = useApp();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isDataLoaded) return;

    // Check if user is logged in
    const checkAuth = () => {
        if (userProfile && userProfile.email) {
            // Logged in -> Redirect to full app
            router.replace(`/collaboration/${id}`);
        } else {
            // Not logged in -> Show guest view
            setIsChecking(false);
        }
    };

    checkAuth();
  }, [userProfile, id, router, isDataLoaded]);

  if (isChecking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        <span className="ml-2 text-zinc-500">Connecting to session...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex flex-col">
        <div className="flex-1 relative">
            <ExcalidrawRoom roomId={id} isGuest={true} />
        </div>
    </div>
  );
}
