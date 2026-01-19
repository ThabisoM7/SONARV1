import { NextResponse } from 'next/server';
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygonAmoy } from 'viem/chains';
import contractJson from '@/artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json';
import { privyClient } from '@/lib/privy-server';

// Initialize Admin Wallet
// Initialize Admin Wallet
const rawPrivateKey = process.env.PRIVATE_KEY || '';
const privateKey = (rawPrivateKey.startsWith('0x') ? rawPrivateKey : `0x${rawPrivateKey}`) as `0x${string}`;
const account = privateKeyToAccount(privateKey);

const client = createWalletClient({
    account,
    chain: polygonAmoy,
    transport: http(process.env.ALCHEMY_API_URL) // Use reliable Alchemy Node
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { authToken, metadataCid, receiver } = body;

        // 1. Verify User Auth
        if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const verified = await privyClient.verifyAuthToken(authToken); // Ensure request comes from logged-in user

        // 2. Prepare Transaction
        const tokenUri = `ipfs://${metadataCid}`;
        const royaltyReceiver = receiver || verified.userId; // Fallback to user ID if no receiver (logic might need address)

        // We need the WALLET address of the user to mint to, not the User ID.
        // The frontend should pass the `receiver` address, or we fetch it from Privy.
        // For now, let's assume `receiver` is the connected wallet address passed from client.
        if (!receiver || !receiver.startsWith('0x')) {
            return NextResponse.json({ error: 'Invalid receiver address' }, { status: 400 });
        }

        console.log(`Minting to ${receiver} with URI: ${tokenUri}`);

        // 3. Execute Transaction (Gasless for User, Admin pays)
        const hash = await client.writeContract({
            address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
            abi: contractJson.abi,
            functionName: 'mintTo',
            args: [receiver, tokenUri, 500, receiver], // 500 = 5% Royalty
        });

        console.log("Mint Transaction Sent:", hash);

        return NextResponse.json({ success: true, txHash: hash });

    } catch (error: any) {
        console.error("Mint API Error:", error);
        return NextResponse.json({ error: error.message || 'Minting failed' }, { status: 500 });
    }
}
