import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { privyClient } from '@/lib/privy-server';

// POST /api/music/stream
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { trackId, authToken } = body;

        if (!trackId) return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });

        // Optional: Identify Listener
        let listenerId = undefined;
        if (authToken) {
            try {
                const verified = await privyClient.verifyAuthToken(authToken);
                const pUser = await privyClient.getUser(verified.userId);
                if (pUser.wallet?.address) {
                    const user = await prisma.user.findUnique({ where: { walletAddress: pUser.wallet.address } });
                    if (user) listenerId = user.id;
                }
            } catch (e) {
                // Ignore auth error for streams, just count it as anonymous?
                // Or require auth? User requirement says "playable by other users".
                // We'll allow anon streams but track them without ID.
            }
        }

        // Increment Count
        await prisma.track.update({
            where: { id: trackId },
            data: {
                streamCount: { increment: 1 },
                streams: {
                    create: {
                        listenerId: listenerId
                    }
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Stream Count Error", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
