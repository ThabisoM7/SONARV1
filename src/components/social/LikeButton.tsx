'use client';

import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { Button } from 'antd';
import { useUserData } from '@/hooks/useUserData';

interface LikeButtonProps {
    trackId: string;
    showCount?: boolean; // Future proofing
}

export function LikeButton({ trackId }: LikeButtonProps) {
    const { likedSongs, toggleLike } = useUserData();
    const isLiked = likedSongs.includes(trackId);

    const handleLike = (e: any) => {
        e.stopPropagation(); // Prevent card click
        toggleLike(trackId);
    };

    return (
        <Button
            type="text"
            shape="circle"
            icon={isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={handleLike}
            className="hover:bg-red-50"
        />
    );
}
