import { NextResponse } from 'next/server';
import { privyClient } from '@/lib/privy-server';

export async function POST(req: Request) {
    try {
        const { authToken, name, bio, imageCid } = await req.json();

        if (!authToken) {
            return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
        }

        // Verify the user's token
        const verifiedClaims = await privyClient.verifyAuthToken(authToken);
        const userId = verifiedClaims.userId;

        // Construct metadata update object
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (imageCid !== undefined) updateData.imageCid = imageCid;

        // Fetch current user data to preserve existing metadata (like 'role')
        const currentUser = await privyClient.getUser(userId);
        const currentMetadata = currentUser.customMetadata || {};

        // Merge with new updates
        const mergedMetadata = {
            ...currentMetadata,
            ...updateData
        };

        // Update Privy User Metadata
        await privyClient.setCustomMetadata(userId, mergedMetadata);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
