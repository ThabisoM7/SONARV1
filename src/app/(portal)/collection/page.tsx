'use client';

import { withFanAuth } from "@/lib/auth-guards";
import { Typography, Spin, Empty, Divider } from "antd";
import { SongCard } from "@/components/music/SongCard";
import { useReadContract, useAccount } from "wagmi";
import contractJson from "../../../artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json";
import { useEffect, useState } from "react";
import { readContract } from '@wagmi/core';
import { wagmiConfig } from '@/components/providers';

const { Title, Text } = Typography;
const ABI = contractJson.abi;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

function CollectionPage() {
    const { address } = useAccount();

    // 1. Get All Tracks
    const { data: allTracks, isLoading: loadingTracks } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getAllTracks',
    });

    const [ownedTracks, setOwnedTracks] = useState<any[]>([]);
    const [loadingOwnership, setLoadingOwnership] = useState(true);

    // 2. Check Ownership for each track
    useEffect(() => {
        const checkOwnership = async () => {
            if (!allTracks || !address || !CONTRACT_ADDRESS) {
                setLoadingOwnership(false);
                return;
            }

            const tracks = allTracks as any[];
            const owned = [];

            // This is not efficient for production (N calls), but fine for MVP.
            // Better approach: balanceOfBatch or subgraph.
            for (const track of tracks) {
                try {
                    // Direct read using wagmi core to avoid hooks in loop
                    const result = await readContract(wagmiConfig, {
                        address: CONTRACT_ADDRESS,
                        abi: ABI,
                        functionName: 'balanceOf',
                        args: [address, track.id],
                    });

                    if (Number(result) > 0) {
                        owned.push(track);
                    }
                } catch (e) {
                    console.error("Error checking balance", track.id, e);
                }
            }
            setOwnedTracks(owned);
            setLoadingOwnership(false);
        };

        if (allTracks) {
            checkOwnership();
        }
    }, [allTracks, address]);

    if (loadingTracks || loadingOwnership) return <div className="flex justify-center p-20"><Spin size="large" /></div>;

    return (
        <div className="space-y-6">
            <Title level={2}>My Collection</Title>
            <Text type="secondary">Music you have collected or minted.</Text>
            <Divider />

            {ownedTracks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {ownedTracks.map((track: any) => (
                        <SongCard key={track.id.toString()} track={track} />
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-lg border border-gray-100 text-center">
                    <Empty description="You haven't collected any music yet." />
                    <div className="mt-4">
                        <a href="/discover" className="text-blue-500 hover:underline">Go to Discover</a>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withFanAuth(CollectionPage);
