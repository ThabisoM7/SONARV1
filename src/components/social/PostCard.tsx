'use client';

import { Avatar, Card, Button, Image, Typography } from 'antd';
import { HeartOutlined, CommentOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useReadContract } from 'wagmi';
import contractJson from "../../artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json";
import { SongCard } from '../music/SongCard'; // We might need a "MiniSongCard" for embeds
import { useState, useEffect } from 'react';

const { Text, Paragraph } = Typography;

interface PostProps {
    post: any;
}

export function PostCard({ post }: PostProps) {
    const [embeddedTrack, setEmbeddedTrack] = useState<any>(null);

    // Fetch Embedded Track if exists (Client side fetch for MVP)
    // Optimization: Feed API should probably resolve this metadata 
    const { data: allTracks } = useReadContract({
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi: contractJson.abi,
        functionName: 'getAllTracks',
    }) as { data: any[] };

    useEffect(() => {
        if (post.embeddedTrackId && allTracks) {
            const track = allTracks.find((t: any) => t.id.toString() === post.embeddedTrackId);
            if (track) setEmbeddedTrack(track);
        }
    }, [post.embeddedTrackId, allTracks]);

    return (
        <Card className="mb-6 hover:shadow-md transition-shadow border-slate-100">
            <div className="flex gap-4">
                <Link href={`/profile/${post.author.walletAddress}`}>
                    <Avatar
                        src={post.author.imageCid ? `https://gateway.pinata.cloud/ipfs/${post.author.imageCid}` : undefined}
                        icon={<UserOutlined />}
                        size="large"
                        className={post.author.role === 'artist' ? 'bg-purple-500' : 'bg-green-500'}
                    />
                </Link>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <Link href={`/profile/${post.author.walletAddress}`} className="font-bold text-slate-900 hover:text-blue-500 mr-2">
                                {post.author.name || 'Anonymous'}
                            </Link>
                            <span className="text-gray-400 text-sm">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        {post.author.role === 'artist' && <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full font-bold">ARTIST</span>}
                    </div>

                    <Paragraph className="text-lg text-slate-700 whitespace-pre-wrap mb-4">
                        {post.content}
                    </Paragraph>

                    {post.mediaUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden">
                            <Image src={post.mediaUrl} alt="Post media" style={{ maxHeight: 400, objectFit: 'cover' }} />
                        </div>
                    )}

                    {embeddedTrack && (
                        <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <Text type="secondary" className="block mb-2 text-xs uppercase tracking-wide font-bold">Featured Track</Text>
                            <div className="max-w-sm">
                                <SongCard track={embeddedTrack} />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-6 mt-4 text-gray-500">
                        <Button type="text" icon={<HeartOutlined />}>
                            {post._count?.likes || 0}
                        </Button>
                        <Button type="text" icon={<CommentOutlined />}>
                            {post._count?.comments || 0}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
