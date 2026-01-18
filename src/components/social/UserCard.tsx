'use client';

import { Card, Avatar, Typography, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { FollowButton } from '@/components/social/FollowButton';

const { Meta } = Card;
const { Text } = Typography;

interface UserCardProps {
    user: {
        id: string;
        walletAddress?: string;
        name: string;
        bio: string;
        imageCid: string;
        role: string;
    };
}

export function UserCard({ user }: UserCardProps) {
    const imageUrl = user.imageCid ? `https://gateway.pinata.cloud/ipfs/${user.imageCid}` : undefined;
    const displayName = user.name || (user.walletAddress ? `${user.walletAddress.slice(0, 6)}...` : 'Unknown');

    return (
        <Card hoverable className="w-full">
            <div className="flex flex-col items-center space-y-4 text-center">
                <Link href={user.walletAddress ? `/profile/${user.walletAddress}` : '#'} className="cursor-pointer">
                    <Avatar
                        size={80}
                        src={imageUrl}
                        icon={<UserOutlined />}
                        className="bg-gradient-to-br from-blue-400 to-purple-500"
                    />
                </Link>

                <div className="w-full">
                    <Link href={user.walletAddress ? `/profile/${user.walletAddress}` : '#'} className="hover:text-blue-500 transition-colors">
                        <Text strong className="text-lg block truncate">{displayName}</Text>
                    </Link>

                    <div className="flex justify-center gap-2 mt-1 mb-2">
                        <Tag color={user.role === 'artist' ? 'purple' : 'blue'}>
                            {user.role ? user.role.toUpperCase() : 'FAN'}
                        </Tag>
                    </div>

                    <Text type="secondary" className="block text-sm line-clamp-2 h-10">
                        {user.bio || 'No bio yet'}
                    </Text>
                </div>

                {user.walletAddress && (
                    <div className="w-full pt-2">
                        <FollowButton targetAddress={user.walletAddress} />
                    </div>
                )}
            </div>
        </Card>
    );
}
