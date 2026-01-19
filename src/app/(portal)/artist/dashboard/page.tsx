'use client';

import { withArtistAuth } from "@/lib/auth-guards";
import { Card, Row, Col, Statistic, Button, Avatar, Spin, Empty } from "antd";
import { UserOutlined, EditOutlined, SoundOutlined } from "@ant-design/icons";
import { usePrivy } from "@privy-io/react-auth"; // For user metadata
import { useState, useMemo } from "react";
import { EditProfileModal } from "@/components/artist/EditProfileModal";
import { useQuery } from "@tanstack/react-query";
import { getGatewayUrl } from "@/lib/utils";
import { useAccount } from "wagmi";
// import contractJson from "../../../../../src/artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json";
import { SongCard } from "@/components/music/SongCard";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

function ArtistDashboard() {
    const { user } = usePrivy();
    const { address } = useAccount();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Fetch User Data from DB (includes tracks)
    const { data: dbUser, isLoading: dbLoading } = useQuery({
        queryKey: ['dashboard-user', address],
        queryFn: async () => {
            if (!address) return null;
            const res = await fetch(`/api/users/${address}`);
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        enabled: !!address
    });

    const myTracks = useMemo(() => dbUser?.tracks || [], [dbUser]);

    // Parse Metadata (Prefer DB data if available, fallback to Privy)
    const displayName = dbUser?.name || user?.customMetadata?.name || "Anonymous Artist";
    const bio = dbUser?.bio || user?.customMetadata?.bio || "No bio yet.";
    const pfpUrl = dbUser?.imageCid
        ? getGatewayUrl(dbUser.imageCid)
        : (user?.customMetadata?.imageCid ? getGatewayUrl(user.customMetadata.imageCid) : undefined);

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Profile Section */}
            <div className="glass p-8 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <Avatar
                    size={120}
                    src={pfpUrl}
                    icon={<UserOutlined />}
                    className="border-2 border-white/10 shadow-xl bg-gray-900"
                />
                <div className="flex-1 text-center md:text-left space-y-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                        <h1 className="text-3xl font-bold text-foreground tracking-tight m-0">{displayName}</h1>
                        <div className="flex gap-3">
                            <Button
                                icon={<EditOutlined />}
                                shape="round"
                                className="bg-white/5 border-border text-foreground hover:bg-white/10 hover:border-foreground/20"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                Edit Profile
                            </Button>
                            <Button
                                type="primary"
                                icon={<UserOutlined />}
                                shape="round"
                                href="/artist/community"
                                className="bg-primary hover:bg-primary/90 border-none shadow-lg shadow-primary/20"
                            >
                                Manage Fan Club
                            </Button>
                        </div>
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-mono text-gray-400">
                        {user?.wallet?.address}
                    </div>
                    <p className="text-gray-300 max-w-2xl font-light leading-relaxed">{bio}</p>
                </div>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <div className="glass p-6 rounded-2xl border border-white/5">
                        <Statistic
                            title={<span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Tracks</span>}
                            value={myTracks.length}
                            prefix={<SoundOutlined className="text-primary mr-2" />}
                            valueStyle={{ color: 'white', fontWeight: 'bold' }}
                            loading={dbLoading}
                        />
                    </div>
                </Col>
            </Row>

            {/* My Catalog */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">My Catalog</h2>
                {dbLoading ? (
                    <div className="text-center py-20"><Spin size="large" /></div>
                ) : myTracks.length === 0 ? (
                    <div className="text-center py-20 glass rounded-2xl border border-white/5">
                        <Empty description={<span className="text-gray-400">No tracks uploaded yet</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        <Button type="primary" href="/artist/upload" className="mt-6 bg-white text-black hover:bg-gray-200 border-none h-12 px-8 rounded-full font-bold">
                            Upload First Track
                        </Button>
                    </div>
                ) : (
                    <Row gutter={[24, 24]}>
                        {myTracks.map((track: any) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={track.id}>
                                <SongCard
                                    track={{
                                        ...track,
                                        artist: displayName, // We know it's me
                                        artistId: user?.id, // For ownership check
                                        imageSrc: getGatewayUrl(track.collection?.coverUrl || dbUser?.imageCid),
                                        audioSrc: getGatewayUrl(track.audioUrl),
                                        streamCount: track.streamCount
                                    }}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            <EditProfileModal
                visible={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => window.location.reload()} // Simple reload to refresh Privy data
                currentName={displayName}
                currentBio={bio}
                currentImageCid={dbUser?.imageCid || (user?.customMetadata as any)?.imageCid}
            />
        </div>
    );
}

export default withArtistAuth(ArtistDashboard);
