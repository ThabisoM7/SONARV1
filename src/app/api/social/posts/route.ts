import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { privyClient } from '@/lib/privy-server';

// GET /api/social/posts?feed=true (My Feed) or ?userId=xyz (Specific Profile)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const feed = searchParams.get('feed');
    const viewerWallet = searchParams.get('viewerWallet');

    try {
        let posts;

        if (feed === 'true' && viewerWallet) {
            // Resolve Viewer ID
            const viewer = await prisma.user.findUnique({
                where: { walletAddress: viewerWallet },
                select: { id: true }
            });

            if (viewer) {
                // 1. Get who I follow
                const following = await prisma.follow.findMany({
                    where: { followerId: viewer.id },
                    select: { followingId: true }
                });
                const followingIds = following.map((f: { followingId: string }) => f.followingId);
                followingIds.push(viewer.id); // Include self

                // 2. Get my memberships (for tiered content)
                const memberships = await prisma.clubMember.findMany({
                    where: { userId: viewer.id },
                    select: { tierId: true }
                });
                const myTierIds = memberships.map((m: { tierId: string }) => m.tierId);

                // 3. Query Posts
                // - Must be from someone I follow OR myself
                // - AND (Post is public OR I have the tier)
                posts = await prisma.post.findMany({
                    where: {
                        authorId: { in: followingIds },
                        OR: [
                            { tierId: null }, // Public
                            { tierId: { in: myTierIds } }, // I have access
                            { authorId: viewer.id } // I wrote it
                        ]
                    },
                    include: {
                        author: { select: { name: true, imageCid: true, walletAddress: true, role: true } },
                        tier: { select: { name: true } }, // Show tier badge
                        _count: { select: { likes: true, comments: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            } else {
                posts = [];
            }
        } else if (userId) {
            // Specific User Profile - Show Public + Tiered if viewer has access
            // Need viewer context to filter correctly if we want to hide locked posts completely from API
            // For MVP, returning all but usually we'd mark them as "locked" if no access.
            // Let's implement robust filtering here too if viewerWallet present.

            let myTierIds: string[] = [];
            if (viewerWallet) {
                const viewer = await prisma.user.findUnique({
                    where: { walletAddress: viewerWallet },
                    include: { memberships: true }
                });
                if (viewer) myTierIds = viewer.memberships.map((m: { tierId: string }) => m.tierId);
            }

            posts = await prisma.post.findMany({
                where: {
                    authorId: userId,
                    OR: [
                        { tierId: null },
                        { tierId: { in: myTierIds } },
                        // If I am the author, I see everything
                        ...(viewerWallet ? [{ author: { walletAddress: viewerWallet } }] : [])
                    ]
                },
                include: {
                    author: { select: { name: true, imageCid: true, walletAddress: true, role: true } },
                    tier: { select: { name: true } },
                    _count: { select: { likes: true, comments: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            // Global Feed - Only Public Posts
            posts = await prisma.post.findMany({
                where: { tierId: null },
                include: {
                    author: { select: { name: true, imageCid: true, walletAddress: true, role: true } },
                    _count: { select: { likes: true, comments: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
        }

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Feed Error", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/social/posts (Create Post)
export async function POST(req: Request) {
    try {
        const { authToken, content, mediaUrl, embeddedTrackId, tierId } = await req.json();

        const verified = await privyClient.verifyAuthToken(authToken);
        // Find DB user by wallet (assuming synced)
        // Ideally we store Privy ID in DB, but we used walletAddress.
        // We need to resolve wallet first.
        const pUser = await privyClient.getUser(verified.userId);
        const address = pUser.wallet?.address;

        if (!address) throw new Error("No wallet");

        const user = await prisma.user.findUnique({ where: { walletAddress: address } });
        if (!user) throw new Error("User not initialized in DB");

        const post = await prisma.post.create({
            data: {
                authorId: user.id,
                content,
                mediaUrl,
                embeddedTrackId,
                tierId: tierId || null
            }
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("Create Post Error", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
