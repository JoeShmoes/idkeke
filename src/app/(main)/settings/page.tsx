
'use client';
import SettingsDialog from '@/components/settings/settings-dialog';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const [isOpen, setIsOpen] = useState(true);
    const router = useRouter();

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if(!open) {
            router.back();
        }
    }

    return (
        <div className="flex flex-col h-full -m-4 sm:-m-6 lg:-m-8">
             <SettingsDialog isOpen={isOpen} onOpenChange={handleOpenChange} />
        </div>
    )
}
