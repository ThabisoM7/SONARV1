import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { privyClient } from '@/lib/privy-server';

export async function POST(req: Request) {
    try {
        const { authToken, clubId, tierId } = await req.json();

        // 1. Verify User
        const verified = await privyClient.verifyAuthToken(authToken);
        const pUser = await privyClient.getUser(verified.userId);
        let address = pUser.wallet?.address;

        if (!address && pUser.linkedAccounts) {
            const walletAccount = pUser.linkedAccounts.find((a: any) => a.type === 'wallet');
            if (walletAccount) address = walletAccount.address;
        }

        if (!address) {
            return NextResponse.json({
                error: 'No wallet found',
                debug: { linkedAccounts: pUser.linkedAccounts }
            }, { status: 401 });
        }

        // 2. Ensure User Exists in DB (Sync from Privy)
        const name = (pUser.customMetadata as any)?.name || pUser.email?.address || 'Fan';
        const role = (pUser.customMetadata as any)?.role || 'fan';
        const imageCid = (pUser.customMetadata as any)?.imageCid;

        const user = await prisma.user.upsert({
            where: { walletAddress: address },
            update: {}, // No update needed if exists
            create: {
                walletAddress: address,
                name,
                role,
                imageCid
            }
        });

        // 2. Simulate Payment (or verify TX hash if passed)
        // For MVP: We assume payment simulated on frontend for 0.01 MATIC

        // 3. Create Membership
        const member = await prisma.clubMember.create({
            data: {
                userId: user.id,
                clubId,
                tierId
            }
        });

        return NextResponse.json(member);
    } catch (error) {
        console.error("Join Club Error:", error);
        return NextResponse.json({ error: 'Failed', details: String(error) }, { status: 500 });
    }
}
