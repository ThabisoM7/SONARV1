import { NextResponse } from 'next/server';
import { privyClient } from '@/lib/privy-server';

export async function POST(req: Request) {
    try {
        const { authToken, update } = await req.json();

        if (!authToken) {
            return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
        }

        // Verify the user's token
        const verifiedClaims = await privyClient.verifyAuthToken(authToken);
        const userId = verifiedClaims.userId;

        // Fetch current user data
        const currentUser = await privyClient.getUser(userId);
        const currentMetadata = currentUser.customMetadata || {};

        // Merge updates (shallow merge for now, but lists should be fully replaced by frontend to handle removals)
        // Expected update structure: { likedSongs: [...], playlists: [...] }
        const mergedMetadata = {
            ...currentMetadata,
            ...update
        };

        // Update Privy User Metadata
        await privyClient.setCustomMetadata(userId, mergedMetadata);

        return NextResponse.json({ success: true, metadata: mergedMetadata });
    } catch (error: any) {
        console.error('Error updating user data:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
