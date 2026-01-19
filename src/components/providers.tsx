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
    transports: {
        [polygonAmoy.id]: fallback([
            http(process.env.NEXT_PUBLIC_ALCHEMY_AMOY_URL),
            http("https://rpc-amoy.polygon.technology"),
            http(),
        ]),
    },
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
                defaultChain: polygonAmoy,
                supportedChains: [polygonAmoy]
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={wagmiConfig}>
                    <AntdRegistry>
                        <ConfigProvider
                            theme={{
                                algorithm: theme.defaultAlgorithm,
                                token: {
                                    colorPrimary: '#1677ff',
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
