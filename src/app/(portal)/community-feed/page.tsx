'use client';

import { withFanAuth } from "@/lib/auth-guards";
import { Typography, List, Avatar, Card, Spin, Empty } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useReadContract, useAccount } from "wagmi";
import contractJson from "../../../artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json";
import { useState, useEffect } from "react";
import { readContract } from '@wagmi/core';
import { wagmiConfig } from '@/components/providers';

const { Title, Text } = Typography;
const ABI = contractJson.abi;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

function CommunityFeedPage() {
    // For MVP, we need a way to get *all* posts.
    // The contract only has `getArtistPosts(artist)`.
    // We can iterate over `getAllTracks` to get unique artists, then fetch their posts.

    // 1. Get All Tracks -> Extract Artists
    const { data: allTracks } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getAllTracks',
    });

    const [allPosts, setAllPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!allTracks || !CONTRACT_ADDRESS) {
                setLoading(false);
                return;
            }

            const artists = new Set((allTracks as any[]).map(t => t.artist));
            let posts: any[] = [];

            for (const artist of Array.from(artists)) {
                try {
                    const artistPosts = await readContract(wagmiConfig, {
                        address: CONTRACT_ADDRESS,
                        abi: ABI,
                        functionName: 'getArtistPosts',
                        args: [artist],
                    });
                    // Add artist info to post
                    const postsWithArtist = (artistPosts as any[]).map(p => ({ ...p, artist }));
                    posts = [...posts, ...postsWithArtist];
                } catch (e) {
                    console.error(e);
                }
            }

            // Sort by timestamp desc
            posts.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
            setAllPosts(posts);
            setLoading(false);
        };

        if (allTracks) fetchPosts();
    }, [allTracks]);

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Title level={2}>Community Feed</Title>

            {loading ? <Spin className="w-full flex justify-center" /> : (
                allPosts.length > 0 ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={allPosts}
                        renderItem={(item) => (
                            <List.Item>
                                <Card className="w-full" hoverable>
                                    <List.Item.Meta
                                        avatar={<Avatar icon={<UserOutlined />} className="bg-purple-100 text-purple-600" />}
                                        title={
                                            <div className="flex justify-between">
                                                <Text code>{(item.artist as string).slice(0, 6)}...{(item.artist as string).slice(-4)}</Text>
                                                <Text type="secondary" className="text-xs">{new Date(Number(item.timestamp) * 1000).toLocaleString()}</Text>
                                            </div>
                                        }
                                        description={<Text className="text-gray-800 text-lg block mt-2">{item.content}</Text>}
                                    />
                                </Card>
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="No community updates yet." />
                )
            )}
        </div>
    );
}

export default withFanAuth(CommunityFeedPage);
