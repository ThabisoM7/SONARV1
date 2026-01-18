import { NextResponse } from 'next/server';
import { privyClient } from '@/lib/privy-server';

export async function GET() {
    try {
        // Fetch all users from Privy
        // Note: For production with many users, implement pagination.
        // For MVP, we'll fetch the default list (usually limited to 50-100).
        const users = await privyClient.getUsers();

        // Map to a simplified format for the frontend
        const safeUsers = users.map(u => ({
            id: u.id,
            walletAddress: u.wallet?.address,
            email: u.email?.address,
            name: (u.customMetadata as any)?.name || 'Anonymous',
            bio: (u.customMetadata as any)?.bio || '',
            imageCid: (u.customMetadata as any)?.imageCid || '',
            role: (u.customMetadata as any)?.role || 'fan'
        }));

        return NextResponse.json(safeUsers);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
    }
}
