import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { privyClient } from '@/lib/privy-server';

// GET /api/community/events?artistWallet=xyz OR ?feed=true
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const artistWallet = searchParams.get('artistWallet');
    const feed = searchParams.get('feed');

    try {
        if (artistWallet) {
            const artist = await prisma.user.findUnique({
                where: { walletAddress: artistWallet },
                select: { id: true }
            });
            if (!artist) return NextResponse.json([]);

            const events = await prisma.event.findMany({
                where: { artistId: artist.id },
                orderBy: { date: 'asc' }
            });
            return NextResponse.json(events);
        } else if (feed) {
            // Fetch all upcoming events (Discovery)
            const events = await prisma.event.findMany({
                where: { date: { gte: new Date() } },
                orderBy: { date: 'asc' },
                take: 20,
                // TODO: Include artist details
            });
            return NextResponse.json(events);
        }

        return NextResponse.json([]);
    } catch (error) {
        console.error("Get Events Error", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/community/events (Create)
export async function POST(req: Request) {
    try {
        const { authToken, title, description, date, location } = await req.json();
        const verified = await privyClient.verifyAuthToken(authToken);

        const pUser = await privyClient.getUser(verified.userId);
        const address = pUser.wallet?.address;

        if (!address) throw new Error("No wallet");

        const user = await prisma.user.findUnique({ where: { walletAddress: address } });
        if (!user) throw new Error("User not found in DB");

        const event = await prisma.event.create({
            data: {
                artistId: user.id,
                title,
                description,
                date: new Date(date),
                location
            }
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("Create Event Error", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
