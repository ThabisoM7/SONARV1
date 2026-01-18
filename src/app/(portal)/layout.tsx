'use client';

import { AppShell } from "@/components/layout/AppShell";
import { PlayerProvider } from "@/components/music/PlayerContext";
import { GlobalPlayer } from "@/components/music/GlobalPlayer";

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PlayerProvider>
            <AppShell>
                {children}
                <div className="pb-24">
                    {/* Spacing for Player */}
                </div>
                <GlobalPlayer />
            </AppShell>
        </PlayerProvider>
    );
}
