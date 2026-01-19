import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { privyClient } from '@/lib/privy-server';

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const verified = await privyClient.verifyAuthToken(token);
        const userId = verified.userId;

        // Find the track
        const track = await prisma.track.findUnique({
            where: { id: params.id }
        });

        if (!track) {
            return NextResponse.json({ error: 'Track not found' }, { status: 404 });
        }

        // Verify Ownership
        // The track.artistId should match the user's local DB ID
        // First get the local user ID from the privy ID
        const user = await prisma.user.findUnique({
            where: { id: track.artistId } // Optimization: Assume artistId is valid
        });

        // Actually we need to check if the requester is the artist
        // We need to find the user record for the requester
        const requester = await prisma.user.findFirst({
            where: {
                OR: [
                    { walletAddress: verified.userId }, // If ID is address
                    // Ideally we store the privy Subject ID, but we mapped it differently.
                    // For now, let's look up by the expected relation if possible, 
                    // or assume the `artistId` on the track IS the Privy ID?
                    // Looking at schema: User.id is a UUID.
                    // We need to fetch the User by their Privy Wallet/Email? 
                    // The upload route uses `privyClient.getUser(verified.userId)` to get address, 
                    // then `prisma.user.findUnique({ where: { walletAddress: address } })`.
                ]
            }
        });

        const pUser = await privyClient.getUser(userId);
        const address = pUser.wallet?.address;

        if (!address) return NextResponse.json({ error: 'No wallet linked' }, { status: 400 });

        const dbUser = await prisma.user.findUnique({ where: { walletAddress: address } });

        if (!dbUser || dbUser.id !== track.artistId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete from DB
        await prisma.track.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
