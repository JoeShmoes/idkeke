'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { Settings, LogOut, User, Folder, MessageSquare, Coffee, DollarSign } from 'lucide-react';
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
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import type { NavItem, NavGroup as NavGroupType } from '@/lib/types';
import { iconMap } from '@/lib/nav-items';
import { supabase } from '@/lib/supabase';

const NavGroup = ({
  label,
  items,
}: {
  label: string;
  items: NavItem[];
}) => {
  const pathname = usePathname();

  if (!items || items.length === 0) return null;

  return (
    <SidebarMenuItem>
      <span className="group-data-[collapsible=icon]:hidden text-xs font-semibold text-muted-foreground px-2 py-1">
        {label}
      </span>
      {items.map((item) => {
        const isExternal = item.external;
        const isActive = !isExternal && pathname.startsWith(item.href);
        const Icon = iconMap[item.icon] || Folder;

        const linkContent = (
          <>
            <Icon className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
          </>
        );

        const menuButton = isExternal ? (
          <a href={item.href} target="_blank" rel="noopener noreferrer" className="w-full">
            <SidebarMenuButton
              key={item.href}
              isActive={isActive}
              tooltip={item.label}
            >
              {linkContent}
            </SidebarMenuButton>
          </a>
        ) : (
          <SidebarMenuButton key={item.href} isActive={isActive} tooltip={item.label} asChild>
            <Link href={item.href}>{linkContent}</Link>
          </SidebarMenuButton>
        );

        return (
          <div key={item.href} className="flex items-center">
            {menuButton}
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
  const { userProfile, appSettings, chats, setUserProfile } = useApp();
  const router = useRouter();
  const pathname = usePathname();

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
      {/* Header */}
      <SidebarHeader className="h-16 hidden">
        <Logo className="h-10 w-10" />
      </SidebarHeader>

      <SidebarHeader className="h-16 flex flex-row items-center px-2 border-b">
        <DropdownMenu>

          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-2"
            >
              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="group-data-[collapsible=icon]:hidden font-semibold">
                {userProfile?.name || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 ml-2 mb-2" side="bottom" align="start">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
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
                <NavGroup key={group.label} label={group.label} items={group.items} />
              );
            })}
            {/* AI Chats Section (only show inside AI Room) */}
            {pathname?.startsWith('/ai-room') && chats.length > 0 && (
              <SidebarMenuItem>
                <span className="group-data-[collapsible=icon]:hidden text-xs font-semibold text-muted-foreground px-2 py-1">
                  AI Chats
                </span>
                {chats.slice(0, 5).map((chat) => (
                  <div key={chat.id} className="flex items-center">
                    <SidebarMenuButton
                      tooltip={chat.name}
                      asChild
                    >
                      <Link href={`/ai-room?chat=${chat.id}`} className="w-full">
                        <MessageSquare className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden truncate">{chat.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </div>
                ))}
                {chats.length > 5 && (
                  <div className="flex items-center">
                    <SidebarMenuButton
                      tooltip="View all chats"
                      asChild
                    >
                      <Link href="/ai-room" className="w-full">
                        <Folder className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden truncate">View all</span>
                      </Link>
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <div className="flex items-center justify-between w-full p-2 h-14">
          <div className="flex items-center gap-2 flex-shrink-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-2">
            <Logo className="h-7 w-7 text-primary" />
            <span className="text-base font-semibold text-foreground group-data-[collapsible=icon]:hidden">
              Nexaris
            </span>
          </div>
          <div className="flex items-center gap-1">
            <a href="https://nexarismodule.gumroad.com/coffee" target="_blank" rel="noopener noreferrer" title="Buy us a coffee">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Coffee className="h-4 w-4" />
              </Button>
            </a>
            <a href="https://nexarismodule.gumroad.com/l/rhyybu?_gl=1*1codf41*_ga*NTIyMzc0NjQwLjE3NjU0NzM3NDY.*_ga_6LJN6D94N6*czE3NjY0NDA3MjEkbzE4JGcwJHQxNzY2NDQwNzIxJGo2MCRsMCRoMA.." target="_blank" rel="noopener noreferrer" title="Monthly support">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <DollarSign className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
