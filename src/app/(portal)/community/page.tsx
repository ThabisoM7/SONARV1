'use client';

import { Typography, Spin, Avatar, Empty, Button } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/community/ChatInterface';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function CommunityPage() {
    const { user } = usePrivy();
    const [selectedClub, setSelectedClub] = useState<any>(null);

    // Fetch My Clubs
    const { data: myClubs, isLoading } = useQuery({
        queryKey: ['my-clubs', user?.wallet?.address],
        queryFn: async () => {
            if (!user?.wallet?.address) return [];
            return (await fetch(`/api/community/my-clubs?wallet=${user.wallet.address}`)).json();
        },
        enabled: !!user?.wallet?.address
    });

    // Auto-select first club
    useEffect(() => {
        if (myClubs && myClubs.length > 0 && !selectedClub) {
            setSelectedClub(myClubs[0]);
        }
    }, [myClubs]);

    if (!user) return <div className="p-10 text-center">Please login to view community.</div>;

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex gap-6 pb-4">
            {/* Sidebar List */}
            <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <Title level={4} style={{ margin: 0 }}>My Communities</Title>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoading ? (
                        <div className="text-center p-4"><Spin /></div>
                    ) : myClubs?.length === 0 ? (
                        <div className="text-center p-6">
                            <Empty description="You haven't joined any clubs yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            <Link href="/discover">
                                <Button type="link">Discover Artists</Button>
                            </Link>
                        </div>
                    ) : (
                        myClubs?.map((club: any) => (
                            <div
                                key={club.id}
                                onClick={() => setSelectedClub(club)}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedClub?.id === club.id ? 'bg-purple-50 border-l-4 border-purple-500' : 'hover:bg-gray-50'}`}
                            >
                                <Avatar
                                    src={club.bannerUrl}
                                    icon={<TeamOutlined />}
                                    shape="square"
                                    size={48}
                                    className="bg-gray-200"
                                />
                                <div className="overflow-hidden">
                                    <div className="font-bold truncate">{club.name}</div>
                                    <div className="text-xs text-gray-500 uppercase">{club.role === 'owner' ? 'Owner' : 'Member'}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1">
                {selectedClub ? (
                    <ChatInterface clubId={selectedClub.id} clubName={selectedClub.name} />
                ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                        Select a community to start chatting
                    </div>
                )}
            </div>
        </div>
    );
}
