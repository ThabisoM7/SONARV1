'use client';

import { Avatar, Image, Typography } from 'antd';
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
        <div className="glass rounded-2xl p-6 mb-6 hover:bg-white/5 transition-colors border border-white/5">
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
                            <Link href={`/profile/${post.author.walletAddress}`} className="font-bold text-foreground hover:text-primary mr-2">
                                {post.author.name || 'Anonymous'}
                            </Link>
                            <span className="text-gray-400 text-sm">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        {post.author.role === 'artist' && (
                            <span className="bg-primary/20 text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold border border-primary/30">
                                ARTIST
                            </span>
                        )}
                    </div>

                    <p className="text-lg text-gray-200 whitespace-pre-wrap mb-4 font-light">
                        {post.content}
                    </p>

                    {post.mediaUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden glass border-0">
                            <Image src={post.mediaUrl} alt="Post media" style={{ maxHeight: 400, objectFit: 'cover' }} />
                        </div>
                    )}

                    {embeddedTrack && (
                        <div className="mb-4 bg-black/30 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                            <Text type="secondary" className="block mb-2 text-xs uppercase tracking-wide font-bold text-gray-500">Featured Track</Text>
                            <div className="max-w-sm">
                                <SongCard track={embeddedTrack} />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
                        <button className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors">
                            <HeartOutlined />
                            <span>{post._count?.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                            <CommentOutlined />
                            <span>{post._count?.comments || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
