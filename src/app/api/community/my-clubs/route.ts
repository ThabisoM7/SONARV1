import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { privyClient } from '@/lib/privy-server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });

    try {
        const user = await prisma.user.findUnique({
            where: { walletAddress: wallet },
            include: {
                // Clubs I joined
                memberships: {
                    include: {
                        club: {
                            select: { id: true, name: true, bannerUrl: true, artistId: true }
                        }
                    }
                },
                // Club I own (as Artist)
                fanClub: {
                    select: { id: true, name: true, bannerUrl: true, artistId: true }
                }
            }
        });

        if (!user) return NextResponse.json([], { status: 200 });

        // Normalize data
        const joined = user.memberships.map((m: any) => ({
            ...m.club,
            isCreator: false,
            role: 'member'
        }));

        const owned = user.fanClub ? [{
            ...user.fanClub,
            isCreator: true,
            role: 'owner'
        }] : [];

        // Unique list (in case I joined my own club for testing)
        const allClubs = [...owned, ...joined].filter((c, index, self) =>
            index === self.findIndex((t) => t.id === c.id)
        );

        return NextResponse.json(allClubs);
    } catch (error) {
        console.warn("Get My Clubs Error", error); // Warn only
        return NextResponse.json([], { status: 200 }); // Fail gracefully
    }
}
