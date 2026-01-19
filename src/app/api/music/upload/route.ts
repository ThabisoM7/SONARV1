import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { privyClient } from '@/lib/privy-server';

// POST /api/music/upload
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { authToken, title, description, genre, type, coverCid, tracks } = body;

        // 1. Auth Verification
        if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const verified = await privyClient.verifyAuthToken(authToken);

        const pUser = await privyClient.getUser(verified.userId);
        const address = pUser.wallet?.address;
        if (!address) return NextResponse.json({ error: 'No wallet linked' }, { status: 400 });

        const artist = await prisma.user.findUnique({ where: { walletAddress: address } });
        if (!artist || artist.role !== 'artist') {
            return NextResponse.json({ error: 'Artist profile not found' }, { status: 403 });
        }

        // 2. Create Collection & Tracks Transaction
        const result = await prisma.$transaction(async (tx: any) => {
            // Create Collection
            const collection = await tx.collection.create({
                data: {
                    title,
                    description,
                    type, // SINGLE, EP, ALBUM
                    coverUrl: `ipfs://${coverCid}`,
                    artistId: artist.id,
                }
            });

            // Create Tracks
            // createMany is not supported on SQLite
            if (tracks && tracks.length > 0) {
                await Promise.all(tracks.map((t: any) =>
                    tx.track.create({
                        data: {
                            title: t.title,
                            audioUrl: `ipfs://${t.audioCid}`, // Store as IPFS URI
                            duration: t.duration || 0,
                            trackNumber: t.trackNumber,
                            collectionId: collection.id,
                            artistId: artist.id
                        }
                    })
                ));
            }

            // Optional: Auto-create a Post execution?
            // "New Release: [Title]"
            await tx.post.create({
                data: {
                    authorId: artist.id,
                    content: `Dropped a new ${type.toLowerCase()}: **${title}** 🎵`,
                    mediaUrl: `ipfs://${coverCid}`, // Show cover art
                    // We don't have a direct "collectionId" on Post yet, but we can embed the first track or just link it.
                    // For now, simple text post.
                }
            });

            return collection;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Music Upload Error", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
