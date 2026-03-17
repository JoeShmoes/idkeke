'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
} from '@/components/ui/sidebar';
import Logo from '@/components/logo';
import { Settings, LogOut, User, Folder, MessageSquare, Coffee, DollarSign, Loader2 } from 'lucide-react';
import { useApp } from './app-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
} from '@/components/ui/context-menu';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import type { NavItem, NavGroup as NavGroupType } from '@/lib/types';
import { iconMap } from '@/lib/nav-items';
import { supabase } from '@/lib/supabase';
import { ExternalLink, Link as LinkIcon, Download } from 'lucide-react';

const NavGroup = ({
  label,
  items,
  getShortcutLabel,
}: {
  label: string;
  items: NavItem[];
  getShortcutLabel: (href: string) => string | null;
}) => {
  const pathname = usePathname();

  if (!items || items.length === 0) return null;

  const handleDownloadPDF = async (filename: string) => {
    // Dynamically import html2pdf to avoid SSR issues
    const [html2pdf, { default: html2canvas }] = await Promise.all([
      import('html2pdf.js'),
      import('html2canvas')
    ]);
    
    const element = document.querySelector('main') || document.body;
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf.default().set(opt).from(element).save();
  };

  return (
    <SidebarMenuItem>
      <div className={cn(
        "flex items-center px-2 py-1 transition-all duration-200 ease-in-out overflow-hidden",
        "group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:opacity-0"
      )}>
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
          {label}
        </span>
      </div>
      {items.map((item) => {
        // treat anything starting with http(s) as external; also respect explicit flag
        const isExternal = item.external || /^https?:\/\//.test(item.href);
        const isActive = !isExternal && pathname.startsWith(item.href);
        const Icon = iconMap[item.icon] || Folder;
        const shortcutLabel = getShortcutLabel(item.href);
        const tooltipLabel = shortcutLabel ? `${item.label} (${shortcutLabel})` : item.label;

        const linkContent = item.href === '/ai-room'
          ? (
            <>
              <Logo
                className="h-4 w-4 transition-all duration-300 text-foreground group-hover/menu-button:scale-110"
                style={{
                  filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.5)) drop-shadow(4px 4px 2px rgba(0,0,0,0.3))',
                  transform: 'perspective(500px) rotateX(15deg) rotateY(-15deg) rotateZ(0deg)'
                }}
              />
              <span className={cn(
                "transition-all duration-200 ease-in-out overflow-hidden whitespace-nowrap",
                "group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0"
              )}>{item.label}</span>
            </>
          )
          : (
            <>
              <Icon 
                className="h-5 w-5 transition-all duration-300 text-foreground group-hover/menu-button:scale-110" 
                style={{ 
                  strokeWidth: 2.5,
                  filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.5)) drop-shadow(4px 4px 2px rgba(0,0,0,0.3))',
                  transform: 'perspective(500px) rotateX(15deg) rotateY(-15deg) rotateZ(0deg)'
                }} 
              />
              <span className={cn(
                "transition-all duration-200 ease-in-out overflow-hidden whitespace-nowrap",
                "group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0"
              )}>{item.label}</span>
            </>
          );

        const menuButton = isExternal ? (
          <a href={item.href} target="_blank" rel="noopener noreferrer" className="w-full">
            <SidebarMenuButton
              key={item.href}
              isActive={isActive}
              tooltip={tooltipLabel}
              className="group/menu-button"
            >
              {linkContent}
            </SidebarMenuButton>
          </a>
        ) : (
          <SidebarMenuButton key={item.href} isActive={isActive} tooltip={tooltipLabel} asChild className="group/menu-button">
            <Link href={item.href}>{linkContent}</Link>
          </SidebarMenuButton>
        );

        return (
          <div key={item.href} className="flex items-center">
             <ContextMenu>
                <ContextMenuTrigger className="w-full">
                   {menuButton}
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                   {isActive && (
                      <ContextMenuItem onClick={() => handleDownloadPDF(item.label)}>
                         <Download className="w-4 h-4 mr-2" />
                         Download PDF
                      </ContextMenuItem>
                   )}
                </ContextMenuContent>
             </ContextMenu>
          </div>
        );
      })}
    </SidebarMenuItem>
  );
};

interface AppSidebarProps {
  className?: string;
}

export default function AppSidebar({ className }: AppSidebarProps) {
  const { userProfile, appSettings, chats, setUserProfile, setIsSettingsOpen } = useApp();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const isMac = typeof window !== 'undefined' && navigator.userAgent.includes('Mac');

  const getShortcutLabel = (href: string) => {
    const shortcutKey = Object.keys(appSettings.shortcuts).find(key => {
        // Map common hrefs to shortcut keys
        const mapping: { [key: string]: string } = {
            '/dashboard': 'goToDashboard',
            '/ai-room': 'goToAlfred',
            '/tasks': 'goToTasks',
            '/growth-hub': 'goToGrowthHub',
            '/project-board': 'goToProjects',
            '/clients': 'goToClients',
            '/research': 'goToResearch',
            '/notes': 'goToNotes',
            '/brand-room': 'goToBrandRoom',
            '/budgeting': 'goToBudgeting',
            '/asset-tracker': 'goToAssets',
            '/file-vault': 'goToFileVault',
            '/networking': 'goToNetworking',
            '/learning': 'goToLearning',
            '/collaboration': 'goToBriefingRoom',
            '/briefing-room': 'goToBriefingRoom',
            '/calendar': 'goToCalendar',
            '/sheets': 'goToSpreadsheets'
        };
        return mapping[href] === key;
    });

    const shortcut = shortcutKey ? appSettings.shortcuts[shortcutKey as keyof typeof appSettings.shortcuts] : null;
    if (!shortcut || !shortcut.keys) return null;

    return shortcut.keys.map(k => {
        if (k === 'mod') return isMac ? '⌘' : 'Ctrl / Cmd';
        if (k === 'alt') return 'Alt';
        if (k === 'shift') return 'Shift';
        return k.toUpperCase();
    }).join(' + ');
  };

  const handleSupportClick = (type: 'coffee' | 'monthly') => {
    const url = type === 'monthly' 
      ? 'https://nexarismodule.gumroad.com/l/rhyybu?_gl=1*1codf41*_ga*NTIyMzc0NjQwLjE3NjU0NzM3NDY.*_ga_6LJN6D94N6*czE3NjY0NDA3MjEkbzE4JGcwJHQxNzY2NDQwNzIxJGo2MCRsMCRoMA..'
      : 'https://nexarismodule.gumroad.com/coffee';
    
    window.open(url, '_blank');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('contextflow-workspace-key');
      setUserProfile({ name: 'User', email: '', firstName: '', lastName: '', hasSeenTour: false });
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      // Force redirect anyway
      localStorage.removeItem('contextflow-workspace-key');
      window.location.href = '/login';
    }
  };

  const navStructure: NavGroupType[] = appSettings.navStructure || [];

  return (
    <Sidebar
      className={cn("border-r", className)}
      variant={appSettings.sidebar.variant}
      side={appSettings.sidebar.side}
      collapsible={appSettings.sidebar.collapsible}
    >
      <SidebarHeader className="h-16 flex flex-row items-center px-2 py-0 border-b gap-3">
        <DropdownMenu>

          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-2"
            >
              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className={cn(
                "font-semibold whitespace-nowrap transition-all duration-200 ease-in-out overflow-hidden",
                "group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0"
              )}>
                {userProfile?.name || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 ml-2 mb-2" side="bottom" align="start">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <ScrollArea className="h-full">
          <SidebarMenu>
            {navStructure.map((group) => {
              const isVisible = appSettings.sidebar.visibleGroups?.includes(group.label);
              if (!isVisible) return null;

              return (
                <NavGroup 
                  key={group.label} 
                  label={group.label} 
                  items={group.items} 
                  getShortcutLabel={getShortcutLabel}
                />
              );
            })}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <div className="flex items-center justify-between w-full p-2 h-14 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center border-t">
          <div className="group/logo flex items-center gap-2 flex-shrink-0 select-none group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:p-2">
            <Logo
              className="h-7 w-7 text-primary transition-transform duration-300 group-hover/logo:scale-110"
            />
            <span className={cn(
              "text-base font-semibold text-foreground transition-[width,opacity,filter] duration-300 ease-out overflow-hidden whitespace-nowrap",
              "group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:blur-sm"
            )}>
              Nexaris
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-2 transition-[width,opacity,filter] duration-300 ease-out overflow-hidden",
            "group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:blur-sm"
          )}>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border-orange-200 dark:border-orange-800 dark:text-orange-400"
              onClick={() => handleSupportClick('coffee')}
              title="Buy us a coffee"
            >
              <Coffee className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-200 dark:border-green-800 dark:text-green-400"
              onClick={() => handleSupportClick('monthly')}
              title="Monthly support"
            >
              <DollarSign className="h-4 w-4" />
            </Button>
            </div>
          </div>
      </SidebarFooter>
    </Sidebar>
  );
}
