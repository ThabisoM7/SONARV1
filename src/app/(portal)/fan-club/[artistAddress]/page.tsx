'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Typography, Button, Card, Spin, Row, Col, Avatar } from 'antd';
import { UserOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function FanClubPage() {
    const params = useParams();
    const artistAddress = params.artistAddress as string;

    const { data: club, isLoading } = useQuery({
        queryKey: ['fanClub', artistAddress],
        queryFn: async () => (await fetch(`/api/community/fan-club?artistWallet=${artistAddress}`)).json()
    });

    if (isLoading) return <div className="text-center p-20"><Spin size="large" /></div>;
    if (!club) return <div className="text-center p-20">This artist has not started a fan club yet.</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Banner */}
            <div className="h-48 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl mb-8 relative overflow-hidden">
                {club.bannerUrl && <img src={club.bannerUrl} className="w-full h-full object-cover opacity-50" />}
                <div className="absolute bottom-6 left-8 text-white">
                    <Title level={1} style={{ color: 'white', margin: 0 }}>{club.name}</Title>
                    <Paragraph className="text-white/80 text-lg">{club.description}</Paragraph>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                {/* Tiers */}
                <Col xs={24} md={16}>
                    <Title level={3}>Membership Tiers</Title>
                    <div className="space-y-4">
                        {club.tiers?.map((tier: any) => (
                            <Card key={tier.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <Title level={4} style={{ margin: 0 }}>{tier.name}</Title>
                                        <Text type="secondary">{tier.price > 0 ? `${tier.price} USDC / month` : 'Free Forever'}</Text>
                                    </div>
                                    <Button type="primary" size="large">
                                        {tier.price > 0 ? 'Mint Access Pass' : 'Join Now'}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Col>

                {/* Sidebar */}
                <Col xs={24} md={8}>
                    <Card title="About the Club">
                        <Paragraph>
                            Join <b>{club.name}</b> to get exclusive access to {artistAddress.slice(0, 6)}...{artistAddress.slice(-4)}'s content.
                        </Paragraph>
                        <div className="space-y-2">
                            <div className="flex gap-2 items-center text-gray-600"><CheckCircleOutlined className="text-green-500" /> Exclusive Posts</div>
                            <div className="flex gap-2 items-center text-gray-600"><CheckCircleOutlined className="text-green-500" /> Early Access</div>
                            <div className="flex gap-2 items-center text-gray-600"><CheckCircleOutlined className="text-green-500" /> Community Chat</div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
