'use client';

import { withArtistAuth } from "@/lib/auth-guards";
import { Typography, Card, Row, Col, Statistic, Button, Avatar, Spin, Empty } from "antd";
import { UserOutlined, EditOutlined, SoundOutlined } from "@ant-design/icons";
import { usePrivy } from "@privy-io/react-auth"; // For user metadata
import { useState, useMemo } from "react";
import { EditProfileModal } from "@/components/artist/EditProfileModal";
import { useReadContract, useAccount } from "wagmi";
import contractJson from "../../../../../src/artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json";
import { SongCard } from "@/components/music/SongCard";

const { Title, Text } = Typography;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

function ArtistDashboard() {
    const { user } = usePrivy();
    const { address } = useAccount();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Fetch Tracks
    const { data: rawTracks, isLoading: tracksLoading } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: contractJson.abi,
        functionName: 'getAllTracks',
    });

    // Parse and Filter Tracks
    const myTracks = useMemo(() => {
        if (!rawTracks || !Array.isArray(rawTracks) || !address) return [];
        return rawTracks
            .map((t: any) => ({
                id: t.id, // Keep as bigint or string? SongCard expects bigint usually but let's see. t.id from contract is bigint.
                artist: t.artist,
                uri: t.uri
            }))
            .filter(t => t.artist.toLowerCase() === address.toLowerCase());
    }, [rawTracks, address]);

    // Parse Privy Metadata
    const customMeta = user?.customMetadata as any || {};
    const displayName = customMeta.name || "Anonymous Artist";
    const bio = customMeta.bio || "No bio yet.";
    const pfpUrl = customMeta.imageCid ? `https://gateway.pinata.cloud/ipfs/${customMeta.imageCid}` : undefined;

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Profile Section */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8">
                <Avatar
                    size={120}
                    src={pfpUrl}
                    icon={<UserOutlined />}
                    className="border-4 border-gray-50 shadow-md"
                />
                <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <Title level={2} style={{ margin: 0 }}>{displayName}</Title>
                        <div className="flex gap-2">
                            <Button
                                icon={<EditOutlined />}
                                shape="round"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                Edit Profile
                            </Button>
                            <Button
                                type="primary"
                                icon={<UserOutlined />}
                                shape="round"
                                href="/artist/community"
                                className="bg-purple-600"
                            >
                                Manage Fan Club
                            </Button>
                        </div>
                    </div>
                    <Text type="secondary" className="block text-lg">{user?.wallet?.address}</Text>
                    <p className="text-gray-600 max-w-2xl">{bio}</p>
                </div>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title="Total Tracks"
                            value={myTracks.length}
                            prefix={<SoundOutlined />}
                            loading={tracksLoading}
                        />
                    </Card>
                </Col>
            </Row>

            {/* My Catalog */}
            <div className="space-y-4">
                <Title level={3}>My Catalog</Title>
                {tracksLoading ? (
                    <div className="text-center py-20"><Spin size="large" /></div>
                ) : myTracks.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl">
                        <Empty description="No tracks uploaded yet" />
                        <Button type="primary" href="/artist/upload" className="mt-4">Upload First Track</Button>
                    </div>
                ) : (
                    <Row gutter={[24, 24]}>
                        {myTracks.map((track) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={track.id.toString()}>
                                <SongCard track={track} />
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
                currentImageCid={customMeta.imageCid}
            />
        </div>
    );
}

export default withArtistAuth(ArtistDashboard);
