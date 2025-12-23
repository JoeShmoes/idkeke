

'use client'

import { useState, useEffect } from 'react';
import { useApp } from '../layout/app-provider';
import { useDebounce } from '@/hooks/use-debounce';
import { Card } from './settings-dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export default function ProfileSettings() {
    const { userProfile, setUserProfile } = useApp();
    const [localProfile, setLocalProfile] = useState(userProfile);
    const debouncedProfile = useDebounce(localProfile, 500);

    useEffect(() => {
        // This effect syncs the debounced local state back to the global context.
        if (JSON.stringify(debouncedProfile) !== JSON.stringify(userProfile)) {
            setUserProfile(debouncedProfile);
        }
    }, [debouncedProfile, userProfile, setUserProfile]);

    useEffect(() => {
        // This effect ensures that if the global profile changes (e.g., from an external source),
        // the local state is updated to reflect it.
        if (JSON.stringify(userProfile) !== JSON.stringify(localProfile)) {
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
    
    return (
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
    );
}
