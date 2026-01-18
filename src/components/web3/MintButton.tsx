'use client';

import { useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId, useSwitchChain } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { Button, message, notification } from "antd";
import { parseEther } from "viem";
import { useEffect } from "react";
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
    const { address } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (isConfirmed) {
            notification.success({
                message: 'Mint Successful!',
                description: 'Your track has been minted as an NFT on Polygon Amoy.',
            });
            onSuccess();
        }
        if (error) {
            notification.error({
                message: 'Mint Failed',
                description: error.message
            });
        }
    }, [isConfirmed, error, onSuccess]);

    const handleMint = () => {
        if (!CONTRACT_ADDRESS) {
            message.error('Contract setup incomplete');
            return;
        }
        if (!address) {
            message.error('Please connect wallet first');
            return;
        }

        if (chainId !== polygonAmoy.id) {
            switchChain({ chainId: polygonAmoy.id });
            return;
        }

        const tokenUri = `ipfs://${metadataCid}`;
        // Royalty Fee: 500 = 5% (Basis points)
        // Royalty Receiver: Component prop OR current wallet
        const royaltyReceiver = receiver || address;

        console.log("Minting with:", {
            uri: tokenUri,
            fee: 500,
            receiver: royaltyReceiver,
            contract: CONTRACT_ADDRESS
        });

        writeContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'mintTrack',
            args: [tokenUri, 500, royaltyReceiver],
            gas: BigInt(1000000) // High gas limit to force transaction through
        });
    };

    return (
        <Button
            type="primary"
            size="large"
            block
            onClick={handleMint}
            loading={isPending || isConfirming}
            disabled={!metadataCid}
        >
            {isPending ? 'Minting...' : isConfirming ? 'Confirming Transaction...' : 'Mint NFT (Polygon Amoy)'}
        </Button>
    );
}
