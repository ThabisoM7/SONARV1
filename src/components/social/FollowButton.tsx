'use client';

import { useState } from 'react';
import { Button, App } from 'antd';
import { UserAddOutlined, UserDeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useSocialGraph } from '@/hooks/useSocialGraph';
import { useChainId, useSwitchChain, useAccount } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { usePrivy } from '@privy-io/react-auth';

interface FollowButtonProps {
    targetAddress: string;
}

export function FollowButton({ targetAddress }: FollowButtonProps) {
    const { isFollowing, follow, unfollow, refetch } = useSocialGraph(targetAddress);
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const { isConnected } = useAccount();
    const { login } = usePrivy();

    const handleToggle = async () => {
        if (!isConnected) {
            login();
            return;
        }

        if (chainId !== polygonAmoy.id) {
            try {
                switchChain({ chainId: polygonAmoy.id });
                return;
            } catch (error) {
                message.error("Failed to switch network");
                return;
            }
        }

        setLoading(true);
        try {
            if (isFollowing) {
                await unfollow();
                message.success('Unfollowed');
            } else {
                await follow();
                message.success('Followed');
            }
            // allow onSuccess of mutation to handle refetch, no need for manual timeout
        } catch (error: any) {
            console.error(error);
            message.error(error.shortMessage || "Action failed");
        } finally {
            setLoading(false);
        }
    };

    if (isFollowing) {
        return (
            <Button
                onClick={handleToggle}
                loading={loading}
                icon={<CheckOutlined />}
                className="hover:border-red-500 hover:text-red-500 group"
            >
                <span className="group-hover:hidden">Following</span>
                <span className="hidden group-hover:inline"><UserDeleteOutlined /> Unfollow</span>
            </Button>
        );
    }

    return (
        <Button
            type="primary"
            onClick={handleToggle}
            loading={loading}
            icon={<UserAddOutlined />}
        >
            Follow
        </Button>
    );
}
