'use client';

import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { Button, message, notification } from "antd";
import { useState } from "react";
import contractJson from "../../artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json";

// Using the ABI from the compiled artifact
const ABI = contractJson.abi;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

interface MintButtonProps {
    metadataCid: string;
    onSuccess: () => void;
    receiver?: string;
}

export function MintButton({ metadataCid, onSuccess, receiver }: MintButtonProps) {
    const { address } = useAccount(); // Still need specific user address
    const { getAccessToken } = usePrivy();
    const [loading, setLoading] = useState(false);

    const handleMint = async () => {
        if (!CONTRACT_ADDRESS) {
            message.error('Contract setup incomplete');
            return;
        }
        if (!address) {
            message.error('Please connect wallet first');
            return;
        }

        try {
            setLoading(true);
            const token = await getAccessToken();

            const response = await fetch('/api/music/mint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    metadataCid,
                    receiver: receiver || address, // Mint to this address
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Minting failed');
            }

            notification.success({
                message: 'Mint Successful!',
                description: `Track minted! Tx: ${data.txHash.slice(0, 10)}...`,
            });
            onSuccess();
        } catch (error: any) {
            console.error("Mint Error:", error);
            notification.error({
                message: 'Mint Failed',
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            type="primary"
            size="large"
            block
            onClick={handleMint}
            loading={loading}
            disabled={!metadataCid}
        >
            {loading ? 'Minting (Gasless)...' : 'Mint NFT (Polygon Amoy)'}
        </Button>
    );
}
