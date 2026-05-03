'use client';

import { useCallback } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { useSound } from './use-sound';
import { useToast } from './use-toast';

export const useNotifications = () => {
    const { appSettings } = useApp();
    const { playSound } = useSound();
    const { toast } = useToast();

    const requestPermission = useCallback(async () => {
        const NotificationApi = typeof window !== 'undefined' ? (window as any).Notification : undefined;
        if (!NotificationApi) return false;
        if (NotificationApi.permission === 'granted') return true;
        
        const permission = await NotificationApi.requestPermission();
        return permission === 'granted';
    }, []);

    const showNotification = useCallback(async (title: string, options?: any) => {
        if (!appSettings.notificationsEnabled) return;

        // In-app notification (Toast) is always shown unless specified otherwise
        toast({
            title,
            description: options?.body,
            variant: options?.sound === 'overdue' ? 'destructive' : 'default',
        });

        // Sound
        if (options?.sound) {
            playSound(options.sound);
        }

        // OS-level notification
        const NotificationApi = typeof window !== 'undefined' ? (window as any).Notification : undefined;
        if (!options?.inAppOnly && NotificationApi && NotificationApi.permission === 'granted') {
            try {
                // Prefer service worker for showing notifications as it handles background better
                if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.ready;
                    reg.showNotification(title, {
                        body: options?.body,
                        icon: '/icon.png',
                        badge: '/icon.png',
                        ...options,
                    });
                } else {
                    new NotificationApi(title, {
                        body: options?.body,
                        icon: '/icon.png',
                        ...options,
                    });
                }
            } catch (error) {
                // Silently ignore — iOS Safari may throw
            }
        }
    }, [appSettings.notificationsEnabled, playSound, toast]);

    return { showNotification, requestPermission };
};
