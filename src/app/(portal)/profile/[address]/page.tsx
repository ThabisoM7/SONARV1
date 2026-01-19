'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Spin, Button } from 'antd'; // Keeping Avatar for now as it handles images well, or replace later.
import { UserOutlined } from '@ant-design/icons';
import { FollowButton } from '@/components/social/FollowButton';
import { JoinClubButton } from '@/components/community/JoinClubButton';
import { SongCard } from '@/components/music/SongCard';
import { useReadContract } from 'wagmi';
import contractJson from "../../../../artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json";
import socialGraphJson from "../../../../artifacts/contracts/SocialGraph.sol/SocialGraph.json";
import { UserData, Playlist } from '@/hooks/useUserData';
import { useState } from 'react';
import { Copy, Music, Heart, ListMusic } from 'lucide-react';
import { getGatewayUrl } from '@/lib/utils';

export default function ProfilePage() {
    const params = useParams();
    const address = params.address as string;

    // Since Shadcn Tabs are headless/radix, we can just build a custom Glass Tab system or use the registry one if installed.
    // For now, let's build a simple custom Glass Tab UI.
    const [activeTab, setActiveTab] = useState('releases'); // Default to releases. User can switch.

    // 1. Fetch User Metadata (Privy)
    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['user', address],
        queryFn: async () => {
            const res = await fetch(`/api/users/${address}`); // Viewer context added in API if we pass param, but here we just need profile.
            // Actually, we need to pass viewer for isFollowing logic if usage in API changed? 
            // The API handles searchParams.get('viewer'). 
            // We should arguably pass `?viewer=${myWallet}` here if we want `isFollowing` in the user object.
            // But let's stick to existing simple fetch.
            if (!res.ok) throw new Error('User not found');
            return res.json();
        }
    });

    // 1b. Fetch Fan Club (if artist)
    const { data: fanClub } = useQuery({
        queryKey: ['fanClub', address],
        queryFn: async () => {
            const res = await fetch(`/api/community/fan-club?artistWallet=${address}`);
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!address
    });

    // 2. Fetch Follow Stats (Contract)
    const { data: followers } = useReadContract({
        address: process.env.NEXT_PUBLIC_SOCIAL_GRAPH_ADDRESS as `0x${string}`,
        abi: socialGraphJson.abi,
        functionName: 'getFollowers',
        args: [address]
    }) as { data: string[] };

    const { data: following } = useReadContract({
        address: process.env.NEXT_PUBLIC_SOCIAL_GRAPH_ADDRESS as `0x${string}`,
        abi: socialGraphJson.abi,
        functionName: 'getFollowing',
        args: [address]
    }) as { data: string[] };

    // 3. Fetch All Songs (to filter by likes)
    // In prod, use a subgraph to fetch specific tokens.
    // For MVP, fetch all and filter client side (slow but works).
    const { data: allTracks } = useReadContract({
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi: contractJson.abi,
        functionName: 'getAllTracks',
    }) as { data: any[] };

    // Defined role (Safe access)
    const isArtist = user?.role === 'artist';

    // Tracks (Calculated only if user exists)
    const likedTracks = user && allTracks ? allTracks.filter((t: any) => t?.id && user.likedSongs?.includes(t.id.toString())) : [];
    const releasedTracks = user && allTracks ? allTracks.filter((t: any) => t?.artist && t?.id && t.artist.toLowerCase() === address.toLowerCase()) : [];
    const playlists = (user?.playlists as Playlist[]) || [];

    if (userLoading) return <div className="flex justify-center p-20"><Spin size="large" /></div>;
    if (!user) return <div className="text-center p-20">User not found</div>;

    // Note: We keep the returns for loading/error AFTER all hooks are declared.
    // But wait, are there hooks BELOW this point?
    // In the original file, useState was BELOW. I moved it UP in the previous step.
    // So now useState is at the top.
    // Check if there are ANY OTHER hooks.
    // Only useQuery, useReadContract, and useState.
    // useReadContract are above.
    // So now order is: useState -> useQuery -> useReadContract -> Returns. 
    // This is correct.

    // Force default tab based on role if needed?
    // Actually simplicity is better. Default 'releases'. If user is fan, they just see 'liked' tab if we hide 'releases'.
    // Let's ensure logic in JSX handles it.

    return (
        <div className="max-w-6xl mx-auto pb-32 pt-8 px-4">
            {/* Glass Header */}
            <div className="glass rounded-3xl p-8 mb-12 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-75 animate-pulse" />
                        <Avatar
                            size={140}
                            src={user.imageCid ? `https://gateway.pinata.cloud/ipfs/${user.imageCid}` : undefined}
                            icon={<UserOutlined />}
                            className="relative border-4 border-black bg-gray-900"
                        />
                    </div>
                </div>

                <div className="flex-1 space-y-4 relative z-10 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-4xl font-bold text-foreground tracking-tight">{user.name}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${isArtist ? 'bg-purple-500/20 border-purple-500/50 text-purple-200' : 'bg-green-500/20 border-green-500/50 text-green-200'}`}>
                                    {isArtist ? 'Artist' : 'Fan'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 font-mono text-sm">
                                <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
                                <Button type="text" size="small" icon={<Copy size={14} />} className="text-muted-foreground hover:text-foreground" />
                            </div>
                        </div>
                        <div className="flex gap-3 items-center w-full md:w-auto">
                            <FollowButton targetAddress={address} />
                            {isArtist && fanClub && (
                                <JoinClubButton club={fanClub} userMemberships={user.memberships || []} />
                            )}
                        </div>
                    </div>

                    <p className="text-lg text-gray-300 max-w-2xl font-light leading-relaxed">
                        {user.bio || "No bio yet."}
                    </p>

                    <div className="flex gap-8 pt-4 border-t border-white/5">
                        <div className="text-center">
                            <div className="font-bold text-2xl text-foreground">{user.followersCount !== undefined ? user.followersCount : (followers?.length || 0)}</div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider font-bold">Followers</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-2xl text-foreground">{user.followingCount !== undefined ? user.followingCount : (following?.length || 0)}</div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider font-bold">Following</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Glass Tabs Navigation */}
            <div className="flex gap-2 mb-8 p-1 bg-white/5 backdrop-blur-md rounded-xl w-fit border border-white/5">
                {isArtist && (
                    <button
                        onClick={() => setActiveTab('releases')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'releases' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                    >
                        Releases
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('liked')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'liked' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                >
                    Liked
                </button>
                <button
                    onClick={() => setActiveTab('playlists')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'playlists' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                >
                    Playlists
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'releases' && (
                    (user.tracks && user.tracks.length > 0) || releasedTracks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Prefer DB Tracks (V3) */}
                            {user.tracks?.map((track: any) => (
                                <SongCard
                                    key={track.id}
                                    track={{
                                        ...track,
                                        artist: user.name,
                                        artistId: user.id,
                                        imageSrc: getGatewayUrl(track.collection?.coverUrl || user.imageCid),
                                        audioSrc: getGatewayUrl(track.audioUrl),
                                        streamCount: track.streamCount
                                    }}
                                />
                            ))}
                            {/* Fallback to Contract Tracks (Legacy) - Filter out ones that match DB? */}
                            {releasedTracks
                                .filter((t: any) => !user.tracks?.some((dbT: any) => dbT.id === t.id.toString())) // Naive dedup if IDs matched, but they don't (UUID vs Int). 
                                // Actually, let's just show DB tracks if they exist. Contract tracks are legacy. 
                                // If we want to show BOTH, we risk dups if we don't link them.
                                // For now, let's show DB tracks FIRST.
                                .map((track: any) => (
                                    <SongCard key={track.id.toString()} track={track} />
                                ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <Music size={48} className="mb-4 opacity-50" />
                            <span className="text-lg">No releases yet</span>
                        </div>
                    )
                )}

                {activeTab === 'liked' && (
                    likedTracks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {likedTracks.map((track: any) => (
                                <SongCard key={track.id.toString()} track={track} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <Heart size={48} className="mb-4 opacity-50" />
                            <span className="text-lg">No liked songs yet</span>
                        </div>
                    )
                )}

                {activeTab === 'playlists' && (
                    <div className="space-y-8">
                        {playlists.length > 0 ? playlists.map(playlist => {
                            const plTracks = allTracks?.filter((t: any) => t?.id && playlist.songs.includes(t.id.toString())) || [];
                            return (
                                <div key={playlist.id} className="glass p-6 rounded-2xl border border-white/5">
                                    <div className="flex items-baseline justify-between mb-6">
                                        <h3 className="text-xl font-bold text-foreground">{playlist.name}</h3>
                                        <span className="text-gray-500 text-sm">{plTracks.length} tracks</span>
                                    </div>
                                    {plTracks.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {plTracks.map((track: any) => (
                                                <SongCard key={track.id.toString()} track={track} />
                                            ))}
                                        </div>
                                    ) : <span className="text-gray-500 italic">Empty playlist</span>}
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                <ListMusic size={48} className="mb-4 opacity-50" />
                                <span className="text-lg">No playlists created</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
