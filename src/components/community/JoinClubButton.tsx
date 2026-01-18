'use client';

import { Button, Modal, message, Card, Typography } from 'antd';
import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CrownOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface JoinClubButtonProps {
    club: any;
    userMemberships: any[];
}

export function JoinClubButton({ club, userMemberships }: JoinClubButtonProps) {
    const { getAccessToken, user } = usePrivy();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Find if already a member of any tier
    const existingMembership = userMemberships?.find(m => m.clubId === club.id);
    const currentTierId = existingMembership?.tierId;

    const { mutateAsync: joinTier, isPending } = useMutation({
        mutationFn: async (tierId: string) => {
            const token = await getAccessToken();
            const res = await fetch('/api/community/join-tier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    clubId: club.id,
                    tierId
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.details || err.error || 'Join failed');
            }
            return res.json();
        },
        onSuccess: () => {
            message.success('Welcome to the club!');
            queryClient.invalidateQueries({ queryKey: ['user'] }); // Refresh profile/memberships
            setIsModalOpen(false);
        },
        onError: () => message.error('Failed to join')
    });

    if (!club || !club.tiers) return null;

    // Filter out free ties if logic demands, or show all.
    // Assuming Tier 0 is Free, Tier 1 is Paid.
    const paidTiers = club.tiers.filter((t: any) => t.price > 0);

    if (paidTiers.length === 0) return null;

    return (
        <>
            <Button
                type={currentTierId ? "default" : "primary"}
                icon={<CrownOutlined />}
                onClick={() => setIsModalOpen(true)}
                className={currentTierId ? "border-purple-500 text-purple-500" : "bg-purple-600"}
            >
                {currentTierId ? "Manage Membership" : "Join Fan Club"}
            </Button>

            <Modal
                title={`Join ${club.name}`}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <div className="space-y-4 py-4">
                    {club.tiers.map((tier: any) => {
                        const isCurrent = currentTierId === tier.id;
                        return (
                            <Card key={tier.id} className={`border-2 ${isCurrent ? 'border-purple-500 bg-purple-50' : 'hover:border-purple-200'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <Title level={5} style={{ margin: 0 }}>{tier.name}</Title>
                                        <Text type="secondary">{tier.price > 0 ? `${tier.price} MATIC` : 'Free'}</Text>
                                    </div>
                                    <Button
                                        type="primary"
                                        disabled={isCurrent}
                                        loading={isPending}
                                        onClick={() => joinTier(tier.id)}
                                    >
                                        {isCurrent ? 'Current' : 'Join'}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </Modal>
        </>
    );
}
