'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { http, fallback } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App as AntdApp, theme } from 'antd';

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
    chains: [polygonAmoy],
    [polygonAmoy.id]: fallback([
        http("https://polygon-amoy.drpc.org"),       // High perf public node
        http("https://rpc.ankr.com/polygon_amoy"),   // Backup 1
        http("https://rpc-amoy.polygon.technology"), // Backup 2 (Official but flaky)
        http(),
    ]),
});

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
            config={{
                loginMethods: ['email', 'wallet', 'google'],
                appearance: {
                    theme: 'light',
                    accentColor: '#1677ff',
                    showWalletLoginFirst: true,
                },
                embeddedWallets: {
                    createOnLogin: 'users-without-wallets',
                },
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={wagmiConfig}>
                    <AntdRegistry>
                        <ConfigProvider
                            theme={{
                                algorithm: theme.defaultAlgorithm,
                                token: {
                                    colorPrimary: '#1677ff', // Ant Design Blue
                                    fontFamily: 'var(--font-geist-sans)',
                                    borderRadius: 6,
                                },
                                components: {
                                    Button: {
                                        controlHeight: 40,
                                    },
                                    Card: {
                                        borderRadius: 12,
                                    }
                                }
                            }}
                        >
                            <AntdApp>
                                {children}
                            </AntdApp>
                        </ConfigProvider>
                    </AntdRegistry>
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    );
}
