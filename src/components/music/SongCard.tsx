'use client';

// Need to ensure Lucide icons are imported if they were missing or failed
import { Play, Pause, Disc } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePlayer } from './PlayerContext';
import { LikeButton } from '@/components/social/LikeButton';

interface SongCardProps {
    track: {
        id: bigint;
        tokenId?: bigint; // Contract might return id or tokenId
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
        return <div className="glass rounded-2xl w-full aspect-[3/4] animate-pulse bg-white/5" />;
    }

    const imageUrl = metadata?.image?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');

    return (
        <div className="group relative glass rounded-2xl overflow-hidden hover:bg-white/5 transition-all duration-300 hover:-translate-y-1">
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-800">
                {imageUrl ? (
                    <img
                        alt={metadata.name}
                        src={imageUrl}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <Disc className="text-muted-foreground/50" size={48} />
                    </div>
                )}

                {/* Like Button */}
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <LikeButton trackId={track.tokenId || track.id} />
                </div>

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePlay();
                        }}
                        className="h-14 w-14 rounded-full bg-primary/90 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-primary/20"
                    >
                        {isCurrent && isPlaying ? (
                            <Pause size={24} fill="white" />
                        ) : (
                            <Play size={24} fill="white" className="ml-1" />
                        )}
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="font-bold text-foreground truncate text-lg mb-1">{metadata?.name || 'Untitled'}</h3>
                <Link href={`/profile/${track.artist}`} className="flex items-center gap-2 group/artist">
                    <span className="text-sm text-gray-400 group-hover/artist:text-primary transition-colors truncate">
                        {metadata?.attributes?.[0]?.value || 'Unknown Artist'}
                    </span>
                </Link>
                {metadata?.attributes?.find((a: any) => a.trait_type === 'Genre') && (
                    <span className="mt-3 inline-block text-[10px] uppercase tracking-wider font-bold text-gray-500 border border-white/5 px-2 py-0.5 rounded-full">
                        {metadata.attributes.find((a: any) => a.trait_type === 'Genre').value}
                    </span>
                )}
            </div>
        </div>
    );
}
