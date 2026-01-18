'use client';

import { Layout, Button, Avatar, Dropdown, MenuProps } from 'antd';
import { User, LogOut, Wallet } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EditProfileModal } from '@/components/artist/EditProfileModal';

const { Header } = Layout;

export function TopBar() {
    const { user, logout } = usePrivy();
    const router = useRouter();

    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const menuItems: MenuProps['items'] = [
        {
            key: 'profile',
            label: 'Edit Profile',
            icon: <User size={14} />,
            onClick: () => setIsEditProfileOpen(true),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            label: 'Disconnect',
            icon: <LogOut size={14} />,
            onClick: handleLogout,
            danger: true,
        },
    ];

    const metadata = user?.customMetadata as any;

    return (
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderBottom: '1px solid #f0f0f0' }}>
            <div className="flex items-center gap-4">
                {user?.wallet ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm font-mono text-gray-600">
                        <Wallet size={14} />
                        {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                    </div>
                ) : null}

                <Dropdown menu={{ items: menuItems }} placement="bottomRight">
                    <Avatar
                        size="large"
                        src={metadata?.imageCid ? `https://gateway.pinata.cloud/ipfs/${metadata.imageCid}` : undefined}
                        icon={<User />}
                        className="cursor-pointer bg-blue-500"
                    />
                </Dropdown>
            </div>

            <EditProfileModal
                visible={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                onSuccess={() => { }} // User data updates automatically via Privy hook usually, or we can force reload
                currentName={metadata?.name}
                currentBio={metadata?.bio}
                currentImageCid={metadata?.imageCid}
            />
        </Header>
    );
}
