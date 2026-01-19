import { Play, Pause, Disc, Trash2, Headphones } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePlayer, PlayerTrack } from './PlayerContext';
import { LikeButton } from '@/components/social/LikeButton';
import { getGatewayUrl } from '@/lib/utils';
import { usePrivy } from '@privy-io/react-auth';
import { message } from 'antd';

interface SongCardProps {
    // Supports both V3 (PlayerTrack) and Legacy (Contract)
    track: Partial<PlayerTrack> & {
        // Legacy props
        tokenId?: any;
        uri?: string;
        // V3 props
        artistId?: string;
        streamCount?: number;
    };
    onDelete?: () => void; // Optional callback
}

export function SongCard({ track, onDelete }: SongCardProps) {
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(!track.audioSrc); // If audioSrc exists (V3), not loading
    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const { user, getAccessToken } = usePrivy();

    // Standardize Data
    const isV3 = !!track.audioSrc;
    const displayTitle = isV3 ? track.title : (metadata?.name || 'Untitled');
    const displayArtist = isV3 ? track.artist : (metadata?.attributes?.[0]?.value || 'Unknown Artist');
    const displayImage = isV3 ? track.imageSrc : (metadata?.image ? getGatewayUrl(metadata.image) : '');
    const displayId = track.id || track.tokenId?.toString();

    // Check Ownership (Only for V3 tracks connected to DB)
    // We assume track.artistId corresponds to the DB User ID
    const isOwner = isV3 && user?.id === track.artistId;

    const handleDelete = async () => {
        try {
            const token = await getAccessToken();
            const res = await fetch(`/api/music/track/${displayId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete');
            message.success('Track deleted from catalog');
            if (onDelete) onDelete();
            // Optional: Trigger a refresh or reload
            window.location.reload();
        } catch (error) {
            message.error('Deletion failed');
            console.error(error);
        }
    };

    useEffect(() => {
        const fetchMetadata = async () => {
            // Only fetch if legacy URI and no metadata
            if (isV3 || !track.uri || metadata) return;

            try {
                const gatewayUrl = getGatewayUrl(track.uri);
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
    }, [track.uri, isV3]);

    const handlePlay = async () => {
        if (isV3) {
            playTrack(track as PlayerTrack);

            // Trigger Stream Count
            try {
                // Determine auth token (optional)
                let body: any = { trackId: displayId };
                if (user) {
                    const token = await getAccessToken();
                    body.authToken = token;
                }

                await fetch('/api/music/stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            } catch (e) {
                console.error("Stream count failed", e);
            }

        } else if (metadata && track.uri) {
            // Convert Legacy to PlayerTrack
            playTrack({
                id: displayId,
                title: displayTitle,
                artist: displayArtist,
                audioSrc: getGatewayUrl(metadata.animation_url),
                imageSrc: getGatewayUrl(metadata.image),
            });
        }
    };

    const isCurrent = currentTrack?.id === displayId;

    if (loading) {
        return <div className="glass rounded-2xl w-full aspect-[3/4] animate-pulse bg-white/5" />;
    }

    return (
        <div className="group relative glass rounded-2xl overflow-hidden hover:bg-white/5 transition-all duration-300 hover:-translate-y-1">
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-800">
                {displayImage ? (
                    <img
                        alt={displayTitle}
                        src={displayImage}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <Disc className="text-muted-foreground/50" size={48} />
                    </div>
                )}

                {/* Like Button */}
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <LikeButton trackId={displayId} />
                    {isOwner && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this track? It will be hidden from the app but remain on-chain.')) {
                                    handleDelete();
                                }
                            }}
                            className="bg-black/50 hover:bg-red-500/80 p-2 rounded-full backdrop-blur-sm transition-colors text-white"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                {/* Stream Count Overlay (Bottom Left) */}
                {isV3 && track.streamCount !== undefined && (
                    <div className="absolute bottom-3 left-3 z-10 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold text-white">
                        <Headphones size={12} />
                        {track.streamCount}
                    </div>
                )}

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
                <h3 className="font-bold text-foreground truncate text-lg mb-1">{displayTitle}</h3>
                <Link href={`/profile/${track.artistId || track.artist}`} className="flex items-center gap-2 group/artist">
                    <span className="text-sm text-gray-400 group-hover/artist:text-primary transition-colors truncate">
                        {displayArtist}
                    </span>
                </Link>
                {!isV3 && metadata?.attributes?.find((a: any) => a.trait_type === 'Genre') && (
                    <span className="mt-3 inline-block text-[10px] uppercase tracking-wider font-bold text-gray-500 border border-white/5 px-2 py-0.5 rounded-full">
                        {metadata.attributes.find((a: any) => a.trait_type === 'Genre').value}
                    </span>
                )}
            </div>
        </div>
    );
}

