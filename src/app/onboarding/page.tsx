'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Card, Typography, Button, App, Spin } from 'antd';
import { User, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

export default function OnboardingPage() {
    const { user, authenticated, ready, getAccessToken } = usePrivy();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();

    useEffect(() => {
        if (!ready) return;
        if (!authenticated) {
            router.push('/');
            return;
        }

        // Check if role exists in metadata
        const metadata = user?.customMetadata as any;
        if (metadata?.role) {
            const role = metadata.role;
            if (role === 'artist') router.replace('/artist/dashboard');
            else router.replace('/discover');
        }
    }, [ready, authenticated, user, router]);

    const handleSelectRole = async (role: 'artist' | 'fan') => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            if (!token) throw new Error('No access token');

            const res = await fetch('/api/privy/update-role', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update role');
            }

            message.success('Welcome to CR8TE!');
            window.location.href = role === 'artist' ? '/artist/dashboard' : '/discover';
        } catch (err: any) {
            console.error(err);
            message.error(err.message || 'Something went wrong');
            setLoading(false);
        }
    };

    if (!ready || !authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full text-center space-y-8">
                <div className="space-y-2">
                    <Title level={1} style={{ margin: 0 }}>Choose Your Path</Title>
                    <Text type="secondary" className="text-lg">How will you participate in the CR8TE ecosystem?</Text>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card
                        hoverable
                        className={`cursor-pointer border-2 transition-all text-left ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ borderColor: 'transparent' }}
                        onClick={() => handleSelectRole('fan')}
                        styles={{ body: { padding: '2rem' } }}
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <User size={40} className="text-blue-500" />
                            </div>
                            <Title level={3}>I am a Fan</Title>
                            <Text type="secondary">
                                Discover new music, collect unique NFTs, and support your favorite artists directly.
                            </Text>
                            <Button type="primary" size="large" className="w-full mt-6" loading={loading} onClick={(e) => { e.stopPropagation(); handleSelectRole('fan'); }}>
                                Join as Fan
                            </Button>
                        </div>
                    </Card>

                    <Card
                        hoverable
                        className={`cursor-pointer border-2 transition-all text-left ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ borderColor: 'transparent' }}
                        onClick={() => handleSelectRole('artist')}
                        styles={{ body: { padding: '2rem' } }}
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                                <Music size={40} className="text-purple-500" />
                            </div>
                            <Title level={3}>I am an Artist</Title>
                            <Text type="secondary">
                                Upload your tracks, mint NFTs, manage royalties, and build your community.
                            </Text>
                            <Button size="large" className="w-full mt-6 text-purple-600 border-purple-200 hover:border-purple-500 hover:text-purple-500" loading={loading} onClick={(e) => { e.stopPropagation(); handleSelectRole('artist'); }}>
                                Join as Artist
                            </Button>
                        </div>
                    </Card>
                </div>
                <div className="pt-8">
                    <Text type="secondary" className="text-xs">
                        Verified by Privy. This role cannot be changed in the MVP.
                    </Text>
                </div>
            </div>
        </div>
    );
}
