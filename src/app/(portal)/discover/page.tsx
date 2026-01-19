'use client';

import { withFanAuth } from "@/lib/auth-guards";
import { Typography, Input, Spin, Empty, Tabs } from "antd";
import { SongCard } from "@/components/music/SongCard";
import { UserCard } from "@/components/social/UserCard";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getGatewayUrl } from "@/lib/utils";
// import contractJson from "../../../artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json";

const { Title } = Typography;
const { Search } = Input;
// const ABI = contractJson.abi;
// const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

function DiscoverPage() {
    // Removed legacy contract read
    // const { data: tracks, isLoading } = useReadContract({...});

    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Fetch Users
        fetch('/api/users')
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error(err));
    }, []);

    // Simplistic text search for users
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // FETCH V3 TRACKS (DB)
    const { data: v3Tracks, isLoading: tracksLoading } = useQuery({
        queryKey: ['discover-tracks'],
        queryFn: async () => {
            const res = await fetch('/api/music/feed');
            if (!res.ok) throw new Error('Failed');
            return res.json();
        }
    });

    const filteredTracks = (v3Tracks as any[])?.filter((t: any) =>
        t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.artist?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const items = [
        {
            key: '1',
            label: 'Music',
            children: tracksLoading ? <div className="flex justify-center py-20"><Spin /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredTracks.length > 0 ? (
                        filteredTracks.map((track: any) => (
                            <SongCard
                                key={track.id}
                                track={{
                                    ...track,
                                    artist: track.artist?.name || 'Unknown',
                                    artistId: track.artistId,
                                    imageSrc: getGatewayUrl(track.collection?.coverUrl || track.artist?.imageCid),
                                    audioSrc: getGatewayUrl(track.audioUrl),
                                    streamCount: track.streamCount
                                }}
                            />
                        ))
                    ) : (
                        <Empty description="No tracks found" />
                    )}
                </div>
            )
        },
        {
            key: '2',
            label: 'People',
            children: (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                            <UserCard key={u.id} user={u} />
                        ))
                    ) : (
                        <Empty description="No users found" />
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 pb-24">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <Title level={2} style={{ margin: 0 }}>Discover</Title>
                <div className="w-full md:w-1/3">
                    <Search
                        placeholder="Search artists, fans, or tracks..."
                        allowClear
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultActiveKey="1" items={items} />
        </div>
    );
}

export default withFanAuth(DiscoverPage);
