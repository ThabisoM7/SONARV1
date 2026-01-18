import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { privyClient } from '@/lib/privy-server';

export async function POST(req: Request) {
    try {
        const { authToken, targetAddress, action } = await req.json();

        const verified = await privyClient.verifyAuthToken(authToken);
        const pUser = await privyClient.getUser(verified.userId);
        const myAddress = pUser.wallet?.address;

        if (!myAddress || !targetAddress) {
            return NextResponse.json({ error: 'Missing addresses' }, { status: 400 });
        }

        if (myAddress === targetAddress) {
            return NextResponse.json({ error: 'Cannot follow self' }, { status: 400 });
        }

        // Get DB IDs
        const me = await prisma.user.findUnique({ where: { walletAddress: myAddress } });
        const target = await prisma.user.findUnique({ where: { walletAddress: targetAddress } });

        if (!me || !target) {
            return NextResponse.json({ error: 'User not found in DB' }, { status: 404 });
        }

        if (action === 'follow') {
            await prisma.follow.create({
                data: {
                    followerId: me.id,
                    followingId: target.id
                }
            }).catch(() => { }); // Maintain idempotency (ignore if already exists)
        } else {
            await prisma.follow.deleteMany({
                where: {
                    followerId: me.id,
                    followingId: target.id
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Follow Error Detail:", error);
        return NextResponse.json({ error: 'Failed', details: String(error) }, { status: 500 });
    }
}
