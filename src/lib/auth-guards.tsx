'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spin } from 'antd';

export function withAuth(Component: any) {
    return function ProtectedRoute(props: any) {
        const { ready, authenticated } = usePrivy();
        const router = useRouter();

        useEffect(() => {
            if (ready && !authenticated) {
                router.push('/');
            }
        }, [ready, authenticated, router]);

        if (!ready || !authenticated) {
            return (
                <div className="flex justify-center items-center h-full min-h-[50vh]">
                    <Spin size="large" />
                </div>
            );
        }

        return <Component {...props} />;
    };
}

export function withArtistAuth(Component: any) {
    return function ArtistRoute(props: any) {
        const { ready, authenticated, user } = usePrivy();
        const router = useRouter();

        useEffect(() => {
            if (ready && authenticated) {
                const metadata = user?.customMetadata as any;
                if (metadata?.role !== 'artist') {
                    router.push('/discover'); // Redirect non-artists to Fan view
                }
            } else if (ready && !authenticated) {
                router.push('/');
            }
        }, [ready, authenticated, user, router]);

        if (!ready || !authenticated) {
            return (
                <div className="flex justify-center items-center h-full min-h-[50vh]">
                    <Spin size="large" />
                </div>
            );
        }

        const metadata = user?.customMetadata as any;
        if (metadata?.role !== 'artist') return null; // Logic handles redirect

        return <Component {...props} />;
    };
}

export function withFanAuth(Component: any) {
    return function FanRoute(props: any) {
        const { ready, authenticated, user } = usePrivy();
        const router = useRouter();

        useEffect(() => {
            if (ready && !authenticated) {
                router.push('/');
            }
            // Artists are allowed to view Fan pages (Discover, Feeds)
        }, [ready, authenticated, user, router]);

        if (!ready || !authenticated) return <Spin />;

        const metadata = user?.customMetadata as any;
        // Allow both roles
        if (metadata?.role !== 'fan' && metadata?.role !== 'artist') return null;

        return <Component {...props} />;
    };
}
