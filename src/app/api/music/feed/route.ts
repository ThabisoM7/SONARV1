import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET() {
    try {
        const tracks = await prisma.track.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                artist: true,
                collection: true
            },
            take: 50 // Limit for now
        });

        // Add collection coverUrl fallback to tracks if needed (though map in UI handles it)
        return NextResponse.json(tracks);
    } catch (error) {
        console.error("Feed Error", error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
