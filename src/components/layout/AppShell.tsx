'use client';

import { Layout, Menu, theme } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import {
    PieChartOutlined,
    UploadOutlined,
    UserOutlined,
    CustomerServiceOutlined,
    CalendarOutlined,
    TeamOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import { TopBar } from './TopBar';
import { useEffect, useState } from 'react';

const { Sider, Content } = Layout;

export function AppShell({ children }: { children: React.ReactNode }) {
    const { user, ready } = usePrivy();
    const router = useRouter();
    const pathname = usePathname();
    const [role, setRole] = useState<'artist' | 'fan' | null>(null);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    useEffect(() => {
        if (ready && user) {
            const metadata = user.customMetadata as any;
            setRole(metadata?.role || null);
        }
    }, [ready, user]);

    if (!ready || !role) return <>{children}</>; // Or loading spinner

    const artistItems = [
        { key: '/artist/dashboard', icon: <PieChartOutlined />, label: 'Dashboard' },
        { key: '/artist/upload', icon: <UploadOutlined />, label: 'Upload Track' },
        { key: '/artist/events', icon: <CalendarOutlined />, label: 'Events' },
        { key: '/community', icon: <TeamOutlined />, label: 'Community' },
    ];

    const fanItems = [
        { key: '/discover', icon: <AppstoreOutlined />, label: 'Discover' },
        { key: '/collection', icon: <CustomerServiceOutlined />, label: 'My Collection' },
        { key: '/community', icon: <TeamOutlined />, label: 'Community' },
        { key: '/events-feed', icon: <CalendarOutlined />, label: 'Events' },
    ];

    const items = role === 'artist' ? artistItems : fanItems;

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                breakpoint="lg"
                collapsedWidth="0"
                theme="light"
                width={240}
                style={{ borderRight: '1px solid #f0f0f0' }}
            >
                <div className="h-16 flex items-center justify-center border-b border-gray-100">
                    <h1 className="text-xl font-bold tracking-tight text-slate-800">CR8TE</h1>
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={items}
                    onClick={({ key }) => router.push(key)}
                    style={{ borderRight: 0, padding: '12px 0' }}
                />
            </Sider>
            <Layout>
                <TopBar />
                <Content style={{ margin: '24px 16px 0' }}>
                    <div
                        style={{
                            padding: 24,
                            minHeight: 360,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}
