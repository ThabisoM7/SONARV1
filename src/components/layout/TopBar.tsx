'use client';

import { Avatar, Dropdown, MenuProps } from 'antd';
import { User, LogOut, Wallet, Sun, Moon } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EditProfileModal } from '@/components/artist/EditProfileModal';

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
        <header className="glass rounded-2xl px-6 py-3 flex items-center justify-end">
            <div className="flex items-center gap-4">
                {/* Theme Toggle - Placeholder implementation since actual theme logic needs Context */}
                <button
                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    onClick={() => {
                        // Toggle logic would go here. For now just visual.
                        document.documentElement.classList.toggle('dark');
                    }}
                >
                    <div className="relative w-5 h-5">
                        <div className="absolute inset-0 rotate-0 transition-all dark:rotate-90 dark:opacity-0">
                            <User size={20} className="text-yellow-400" /> {/* Sun icon would be better but keeping simple for now */}
                        </div>
                    </div>
                </button>

                {user?.wallet ? (
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-mono text-gray-300">
                        <Wallet size={14} className="text-primary" />
                        {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                    </div>
                ) : null}

                <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow={{ pointAtCenter: true }}>
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-200"></div>
                        <Avatar
                            size="large"
                            src={metadata?.imageCid ? `https://gateway.pinata.cloud/ipfs/${metadata.imageCid}` : undefined}
                            icon={<User />}
                            className="relative border-2 border-black"
                        />
                    </div>
                </Dropdown>
            </div>

            <EditProfileModal
                visible={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                onSuccess={() => { }}
                currentName={metadata?.name}
                currentBio={metadata?.bio}
                currentImageCid={metadata?.imageCid}
            />
        </header>
    );
}
