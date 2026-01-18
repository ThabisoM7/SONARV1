'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button, Typography, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const { Title, Text } = Typography;

export default function Home() {
  const { login, ready, authenticated, user } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      const metadata = user?.customMetadata as any;
      if (metadata?.role === 'artist') {
        router.push('/artist/dashboard');
      } else if (metadata?.role === 'fan') {
        router.push('/discover');
      } else {
        router.push('/onboarding');
      }
    }
  }, [ready, authenticated, user, router]);

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white text-center p-4">
      <main className="flex flex-col items-center gap-8 max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter text-slate-900">
            CR8TE
          </h1>
          <Text className="text-xl text-slate-600 block">
            The decentralized music platform where you own what you stream.
          </Text>
        </div>

        <div className="flex gap-4">
          <Button type="primary" size="large" onClick={login} className="px-10 h-14 text-lg rounded-full font-semibold shadow-xl shadow-blue-500/20">
            Connect Wallet
          </Button>
        </div>
        <div className="mt-12 text-slate-400 text-sm">
          Powered by Privy & Polygon Amoy
        </div>
      </main>
    </div>
  );
}
