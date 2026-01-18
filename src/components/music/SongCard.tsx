'use client';

import { Card, Button, Skeleton, Typography } from 'antd';
import Link from 'next/link';
import { PlayCircleFilled, PauseCircleFilled } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { usePlayer } from './PlayerContext';
import { LikeButton } from '@/components/social/LikeButton';

const { Meta } = Card;

interface SongCardProps {
    track: {
        id: bigint;
        artist: string;
        uri: string;
    };
}

export function SongCard({ track }: SongCardProps) {
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { playTrack, currentTrack, isPlaying } = usePlayer();

    useEffect(() => {
        const fetchMetadata = async () => {
            if (!track.uri) return;
            try {
                // Determine URL (Gateway)
                const gatewayUrl = track.uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                const res = await fetch(gatewayUrl);
                const json = await res.json();
                setMetadata(json);
            } catch (e) {
                console.error("Failed to fetch metadata", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMetadata();
    }, [track.uri]);

    const handlePlay = () => {
        if (metadata) {
            playTrack({ ...track, metadata });
        }
    };

    const isCurrent = currentTrack?.id === track.id;

    if (loading) {
        return <Card loading={true} style={{ width: 240 }} />;
    }

    const imageUrl = metadata?.image?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');

    return (
        <Card
            hoverable
            style={{ width: '100%' }}
            cover={
                <div className="relative group aspect-square overflow-hidden bg-gray-100">
                    {imageUrl && <img alt={metadata.name} src={imageUrl} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />}

                    <div className="absolute top-2 right-2 z-10">
                        <LikeButton trackId={track.tokenId} />
                    </div>

                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={isCurrent && isPlaying ? <PauseCircleFilled style={{ fontSize: 24 }} /> : <PlayCircleFilled style={{ fontSize: 24 }} />}
                            size="large"
                            className="h-16 w-16 flex items-center justify-center bg-white text-black border-none hover:scale-110"
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePlay();
                            }}
                        />
                    </div>
                </div>
            }
        >
            <Meta
                title={metadata?.name || 'Untitled'}
                description={
                    <div className="flex flex-col">
                        <Link href={`/profile/${track.artist}`} className="hover:underline hover:text-blue-500 transition-colors">
                            <span>{metadata?.attributes?.[0]?.value || 'Unknown Artist'}</span>
                        </Link>
                        <span className="text-xs text-gray-400 mt-1">{metadata?.attributes?.find((a: any) => a.trait_type === 'Genre')?.value}</span>
                    </div>
                }
            />
        </Card>
    );
}
