import { NextResponse } from 'next/server';
import { privyClient } from '@/lib/privy-server';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
        }

        const authToken = authHeader.split(' ')[1];

        // Validate the token and get the user ID
        let userId;
        try {
            const verifiedClaims = await privyClient.verifyAuthToken(authToken);
            userId = verifiedClaims.userId;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
        }

        const body = await req.json();
        const { role } = body;

        if (!['artist', 'fan'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role. Must be artist or fan.' }, { status: 400 });
        }

        // Update metadata using Privy Server SDK
        await privyClient.setCustomMetadata(userId, { role });

        return NextResponse.json({ success: true, role });
    } catch (error) {
        console.error('SERVER ERROR in /api/privy/update-role:', error);
        // Log environment status (don't log the actual secret)
        console.log('Env Check:', {
            hasAppId: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
            hasSecret: !!process.env.PRIVY_APP_SECRET
        });
        return NextResponse.json({ error: 'Internal Server Error: ' + (error as Error).message }, { status: 500 });
    }
}
