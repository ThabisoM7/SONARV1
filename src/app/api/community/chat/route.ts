import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { privyClient } from '@/lib/privy-server';

// GET /api/community/chat?clubId=...
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');

    if (!clubId) return NextResponse.json({ error: 'Missing clubId' }, { status: 400 });

    try {
        const messages = await prisma.clubMessage.findMany({
            where: { clubId },
            include: {
                user: {
                    select: { name: true, imageCid: true, walletAddress: true, role: true }
                }
            },
            orderBy: { createdAt: 'asc' }, // Oldest first for chat stream? Or desc and reverse in UI? Usually desc limit 50.
            take: 50
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Chat GET Error:", error);
        return NextResponse.json({ error: 'Failed to load messages', details: String(error) }, { status: 500 });
    }
}

// POST /api/community/chat (Send Message)
export async function POST(req: Request) {
    try {
        const { authToken, clubId, content, imageCid } = await req.json();

        // Verify User
        const verified = await privyClient.verifyAuthToken(authToken);
        const pUser = await privyClient.getUser(verified.userId);
        const address = pUser.wallet?.address;

        if (!address) return NextResponse.json({ error: 'No wallet' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { walletAddress: address } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Verify Membership
        // 1. Is Creator?
        const club = await prisma.fanClub.findUnique({ where: { id: clubId } });
        const isCreator = club?.artistId === user.id;

        // 2. Is Member?
        const member = await prisma.clubMember.findUnique({
            where: {
                userId_clubId: { userId: user.id, clubId }
            }
        });

        if (!isCreator && !member) {
            return NextResponse.json({ error: 'Not a member' }, { status: 403 });
        }

        // Create Message
        const msg = await prisma.clubMessage.create({
            data: {
                clubId,
                userId: user.id,
                content,
                imageCid
            },
            include: {
                user: { select: { name: true, imageCid: true, walletAddress: true } }
            }
        });

        return NextResponse.json(msg);

    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
