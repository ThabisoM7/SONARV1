'use client';

import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import {
    LayoutDashboard,
    Upload,
    Calendar,
    Users,
    Compass,
    Music,
    LogOut,
    Menu as MenuIcon
} from 'lucide-react';
import { TopBar } from './TopBar';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from 'antd'; // Keeping Antd Button for now, or replace later

export function AppShell({ children }: { children: React.ReactNode }) {
    const { user, ready } = usePrivy();
    const pathname = usePathname();
    const [role, setRole] = useState<'artist' | 'fan' | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (ready && user) {
            const metadata = user.customMetadata as any;
            setRole(metadata?.role || null);
        }
    }, [ready, user]);

    if (!ready) return null; // Or a nice glass loading spinner later

    const artistItems = [
        { key: '/artist/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { key: '/artist/upload', icon: Upload, label: 'Upload Track' },
        { key: '/artist/events', icon: Calendar, label: 'Events' },
        { key: '/community', icon: Users, label: 'Community' },
    ];

    const fanItems = [
        { key: '/discover', icon: Compass, label: 'Discover' },
        { key: '/collection', icon: Music, label: 'My Collection' },
        { key: '/community', icon: Users, label: 'Community' },
        { key: '/events-feed', icon: Calendar, label: 'Events' },
    ];

    const items = role === 'artist' ? artistItems : fanItems;

    return (
        <div className="min-h-screen relative flex bg-transparent">
            {/* Desktop Sidebar (Floating Glass) */}
            <aside className="hidden md:flex fixed left-4 top-4 bottom-4 w-64 flex-col glass rounded-2xl z-20 overflow-hidden">
                {/* Logo */}
                <div className="h-20 flex items-center px-8 border-b border-white/10">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        SONAR
                    </h1>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 px-4 space-y-2">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.key;
                        return (
                            <Link
                                key={item.key}
                                href={item.key}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary/20 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-primary/30"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <Icon size={20} className={cn("transition-colors", isActive ? "text-primary" : "group-hover:text-white")} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Miniprofile or extra links could go here */}
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass z-30 flex items-center justify-between px-4">
                <h1 className="text-xl font-bold text-white">SONAR</h1>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
                    <MenuIcon />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-20 bg-black/90 pt-20 px-4">
                    {items.map((item) => (
                        <Link
                            key={item.key}
                            href={item.key}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-4 py-4 text-white text-lg border-b border-white/10"
                        >
                            <item.icon /> {item.label}
                        </Link>
                    ))}
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 md:ml-[18rem] min-h-screen flex flex-col relative">

                {/* Floating TopBar */}
                <div className="sticky top-4 z-10 mx-4 md:mr-4 mb-4">
                    <TopBar />
                </div>

                {/* Page Content */}
                <div className="px-4 pb-20 md:pr-4">
                    {/* Glass container around content? Optional. For now let content breathe on the background. */}
                    {children}
                </div>
            </main>
        </div>
    );
}
