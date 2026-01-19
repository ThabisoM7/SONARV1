import { NextResponse } from 'next/server';
import { privyClient } from '@/lib/privy-server';
import { prisma } from '@/lib/prisma';

// Note: Next.js 15+ requires params to be awaited
export async function GET(req: Request, props: { params: Promise<{ address: string }> }) {
    try {
        const params = await props.params;
        const address = params.address;

        // 1. Fetch Basic Metadata from Privy
        // Note: We sync this to DB on login/updates, but for now Privy is truth for profile data.
        let privyUser;
        try {
            privyUser = await privyClient.getUserByWalletAddress(address);
        } catch (e) {
            // User might not exist in Privy yet if they haven't logged in, or purely on-chain
        }

        if (!privyUser) {
            // Fallback: Check if we have them in DB (maybe imported)
            // For now return 404
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check 'viewer' param to see if they follow this profile
        const { searchParams } = new URL(req.url);
        const viewer = searchParams.get('viewer');
        let isFollowing = false;

        // Find user case-insensitively (Privy/Wagmi often mix Checksum/Lowercase)
        const dbUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { walletAddress: address },
                    { walletAddress: address.toLowerCase() }
                ]
            },
            include: {
                _count: {
                    select: { followers: true, following: true }
                },
                followers: viewer ? {
                    where: { follower: { walletAddress: viewer } }
                } : false,
                memberships: true,
                tracks: {
                    orderBy: { createdAt: 'desc' },
                    include: { collection: true } // Need coverUrl from collection
                }
            }
        });



        if (viewer && dbUser?.followers && dbUser.followers.length > 0) {
            isFollowing = true;
        }

        const safeUser = {
            id: privyUser.id,
            walletAddress: privyUser.wallet?.address,
            name: (privyUser.customMetadata as any)?.name || 'Anonymous',
            bio: (privyUser.customMetadata as any)?.bio || '',
            imageCid: (privyUser.customMetadata as any)?.imageCid || '',
            role: (privyUser.customMetadata as any)?.role || 'fan',
            likedSongs: (privyUser.customMetadata as any)?.likedSongs || [],
            playlists: (privyUser.customMetadata as any)?.playlists || [],

            // Music
            tracks: dbUser?.tracks || [], // Return DB tracks

            // Social Stats
            followersCount: dbUser?._count.followers || 0,
            followingCount: dbUser?._count.following || 0,
            isFollowing // <--- New field
        };

        return NextResponse.json(safeUser);
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch user' }, { status: 500 });
    }
}
