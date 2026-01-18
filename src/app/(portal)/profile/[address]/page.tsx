'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Typography, Tabs, Spin, Empty, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { FollowButton } from '@/components/social/FollowButton';
import { JoinClubButton } from '@/components/community/JoinClubButton';
import { SongCard } from '@/components/music/SongCard';
import { useSocialGraph } from '@/hooks/useSocialGraph';
import { useReadContract } from 'wagmi';
import contractJson from "../../../../artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json";
import socialGraphJson from "../../../../artifacts/contracts/SocialGraph.sol/SocialGraph.json";
import { UserData, Playlist } from '@/hooks/useUserData';

const { Title, Text, Paragraph } = Typography;

export default function ProfilePage() {
    const params = useParams();
    const address = params.address as string;

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

    if (userLoading) return <div className="flex justify-center p-20"><Spin size="large" /></div>;
    if (!user) return <div className="text-center p-20">User not found</div>;

    // Defined role
    const isArtist = user.role === 'artist';

    // Tracks

    const likedTracks = allTracks?.filter((t: any) => t?.id && user.likedSongs?.includes(t.id.toString())) || [];
    const releasedTracks = allTracks?.filter((t: any) => t?.artist && t?.id && t.artist.toLowerCase() === address.toLowerCase()) || [];
    const playlists = user.playlists as Playlist[] || [];

    // Tabs
    const tabItems = [];

    if (isArtist) {
        tabItems.push({
            key: 'releases',
            label: `Released Music (${releasedTracks.length})`,
            children: releasedTracks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {releasedTracks.map((track: any) => (
                        <SongCard key={track.id.toString()} track={track} />
                    ))}
                </div>
            ) : <Empty description="No releases yet" />
        });
    }

    tabItems.push({
        key: 'liked',
        label: `Liked Songs (${likedTracks.length})`,
        children: likedTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {likedTracks.map((track: any) => (
                    <SongCard key={track.id.toString()} track={track} />
                ))}
            </div>
        ) : <Empty description="No liked songs yet" />
    });

    tabItems.push({
        key: 'playlists',
        label: `Playlists (${playlists.length})`,
        children: (
            <div className="space-y-8">
                {playlists.length > 0 ? playlists.map(playlist => {
                    const plTracks = allTracks?.filter((t: any) => t?.id && playlist.songs.includes(t.id.toString())) || [];
                    return (
                        <div key={playlist.id} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <div className="flex items-baseline justify-between mb-4">
                                <Title level={4}>{playlist.name}</Title>
                                <Text type="secondary">{plTracks.length} tracks</Text>
                            </div>
                            {plTracks.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {plTracks.map((track: any) => (
                                        <SongCard key={track.id.toString()} track={track} />
                                    ))}
                                </div>
                            ) : <Text type="secondary" italic>Empty playlist</Text>}
                        </div>
                    );
                }) : <Empty description="No playlists created" />}
            </div>
        )
    });

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-8 items-start mb-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <Avatar
                    size={120}
                    src={user.imageCid ? `https://gateway.pinata.cloud/ipfs/${user.imageCid}` : undefined}
                    icon={<UserOutlined />}
                    className="bg-blue-500 shadow-xl"
                />
                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3">
                                <Title level={2} style={{ margin: 0 }}>{user.name}</Title>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isArtist ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                                    {isArtist ? 'Artist' : 'Fan'}
                                </span>
                            </div>
                            <Text type="secondary" copyable>{address}</Text>
                        </div>
                        <div className="flex gap-3 items-center">
                            <FollowButton targetAddress={address} />
                            {isArtist && fanClub && (
                                <JoinClubButton club={fanClub} userMemberships={user.memberships || []} />
                            )}
                        </div>
                    </div>

                    <Paragraph className="text-lg text-slate-600 max-w-2xl">{user.bio || "No bio yet."}</Paragraph>

                    <div className="flex gap-8 text-lg">
                        <div className="text-center">
                            {/* Uses hybrid stats if available, fallbacks to 0 */}
                            <div className="font-bold text-slate-900">{user.followersCount !== undefined ? user.followersCount : (followers?.length || 0)}</div>
                            <div className="text-slate-500 text-sm">Followers</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-slate-900">{user.followingCount !== undefined ? user.followingCount : (following?.length || 0)}</div>
                            <div className="text-slate-500 text-sm">Following</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <Tabs
                defaultActiveKey={isArtist ? 'releases' : 'liked'}
                size="large"
                items={tabItems}
            />
        </div>
    );
}
