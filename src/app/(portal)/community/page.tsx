'use client';

import { Spin, Avatar, Empty, Button } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/community/ChatInterface';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import Link from 'next/link';

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
        <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] flex gap-6 pb-4">
            {/* Sidebar List */}
            <div className="w-80 glass rounded-2xl flex flex-col overflow-hidden border border-white/5">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-lg font-bold text-foreground m-0">My Communities</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center p-4"><Spin /></div>
                    ) : myClubs?.length === 0 ? (
                        <div className="text-center p-6 text-gray-400">
                            <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            <p className="mb-4 text-sm">You haven't joined any clubs yet.</p>
                            <Link href="/discover">
                                <Button type="primary" ghost size="small">Discover Artists</Button>
                            </Link>
                        </div>
                    ) : (
                        myClubs?.map((club: any) => (
                            <div
                                key={club.id}
                                onClick={() => setSelectedClub(club)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${selectedClub?.id === club.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <Avatar
                                    src={club.bannerUrl}
                                    icon={<TeamOutlined />}
                                    shape="square"
                                    size={48}
                                    className="bg-gray-800"
                                />
                                <div className="overflow-hidden">
                                    <div className={`font-bold truncate ${selectedClub?.id === club.id ? 'text-foreground' : 'text-muted-foreground'}`}>{club.name}</div>
                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">{club.role === 'owner' ? 'Owner' : 'Member'}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass rounded-2xl overflow-hidden border border-white/5">
                {selectedClub ? (
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Avatar src={selectedClub.bannerUrl} icon={<TeamOutlined />} className="bg-primary" />
                                <div>
                                    <h3 className="font-bold text-foreground m-0">{selectedClub.name}</h3>
                                    <span className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        Live Chat
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <ChatInterface clubId={selectedClub.id} clubName={selectedClub.name} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                            <TeamOutlined style={{ fontSize: 32, opacity: 0.5 }} />
                        </div>
                        <span className="text-lg">Select a community to start chatting</span>
                    </div>
                )}
            </div>
        </div>
    );
}
