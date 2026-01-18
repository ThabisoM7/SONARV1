import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { privyClient } from '@/lib/privy-server';

// GET /api/community/fan-club?artistWallet=...
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const artistWallet = searchParams.get('artistWallet');

    if (!artistWallet) return NextResponse.json({ error: 'Missing artistWallet' }, { status: 400 });

    try {
        const artist = await prisma.user.findUnique({
            where: { walletAddress: artistWallet },
            include: {
                fanClub: {
                    include: { tiers: true }
                }
            }
        });

        if (!artist || !artist.fanClub) {
            return NextResponse.json(null); // No club yet
        }

        return NextResponse.json(artist.fanClub);
    } catch (error) {
        console.error("Get Fan Club Error", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/community/fan-club (Create/Update)
export async function POST(req: Request) {
    try {
        const { authToken, name, description, bannerUrl, tiers } = await req.json();

        const verified = await privyClient.verifyAuthToken(authToken);
        const pUser = await privyClient.getUser(verified.userId);
        const address = pUser.wallet?.address;

        if (!address) return NextResponse.json({ error: 'No wallet' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { walletAddress: address } });
        if (!user) return NextResponse.json({ error: 'User not found in DB' }, { status: 404 });

        console.log("Saving Fan Club for:", address, { name, bannerUrl });

        const club = await prisma.fanClub.upsert({
            where: { artistId: user.id },
            update: {
                name,
                description,
                bannerUrl
            },
            create: {
                artistId: user.id,
                name,
                description,
                bannerUrl
            }
        });

        console.log("Upserted Club:", club.id);

        // Handle Tiers
        if (tiers && Array.isArray(tiers)) {
            for (const t of tiers) {
                const existing = await prisma.clubTier.findFirst({
                    where: { clubId: club.id, name: t.name }
                });

                if (!existing) {
                    await prisma.clubTier.create({
                        data: {
                            clubId: club.id,
                            name: t.name,
                            price: t.price,
                            nftContract: t.nftContract
                        }
                    });
                } else {
                    await prisma.clubTier.update({
                        where: { id: existing.id },
                        data: { price: t.price }
                    });
                }
            }
        }
        return NextResponse.json(club);
    } catch (error) {
        console.error("Save Fan Club Error Detail:", error);
        return NextResponse.json({ error: 'Failed', details: String(error) }, { status: 500 });
    }
}
