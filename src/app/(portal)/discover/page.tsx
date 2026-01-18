'use client';

import { withFanAuth } from "@/lib/auth-guards";
import { Typography, Input, Spin, Empty, Tabs } from "antd";
import { SongCard } from "@/components/music/SongCard";
import { UserCard } from "@/components/social/UserCard";
import { useReadContract } from "wagmi";
import { useState, useEffect } from "react";
import contractJson from "../../../artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json";

const { Title } = Typography;
const { Search } = Input;
const ABI = contractJson.abi;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

function DiscoverPage() {
    const { data: tracks, isLoading } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getAllTracks',
        query: {
            refetchInterval: 5000
        }
    });

    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Fetch Users
        fetch('/api/users')
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error(err));
    }, []);

    // Filter Logic
    const filteredTracks = (tracks as any[])?.filter((t: any) =>
        t.id?.toString().includes(searchTerm) || true // TODO: Add better track search if metadata available
    );

    // Simplistic text search for users
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const items = [
        {
            key: '1',
            label: 'Music',
            children: isLoading ? <div className="flex justify-center py-20"><Spin /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tracks && (tracks as any[]).length > 0 ? (
                        (tracks as any[]).map((track: any) => (
                            <SongCard key={track.id.toString()} track={track} />
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
