'use client';

import { withArtistAuth } from "@/lib/auth-guards";
import { FanClubManager } from '@/components/community/FanClubManager';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

function ArtistCommunityPage() {
    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-8">
                <Title level={2}>Community & Fan Club</Title>
                <Paragraph className="text-lg text-gray-500">
                    Create and manage your exclusive fan club to monetize your superfans.
                </Paragraph>
            </div>

            <FanClubManager />
        </div>
    );
}

export default withArtistAuth(ArtistCommunityPage);
