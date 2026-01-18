'use client';

import { useState } from 'react';
import { Card, Button, Input, Form, Upload, message, Typography, Divider } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { RcFile } from 'antd/es/upload';
import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const { Title, Text } = Typography;

export function FanClubManager() {
    const { user, getAccessToken } = usePrivy();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [bannerFile, setBannerFile] = useState<RcFile | null>(null);

    const { data: club, isLoading } = useQuery({
        queryKey: ['fanClub', user?.wallet?.address],
        queryFn: async () => {
            if (!user?.wallet?.address) return null;
            return (await fetch(`/api/community/fan-club?artistWallet=${user.wallet.address}`)).json();
        },
        enabled: !!user?.wallet?.address
    });

    const { mutateAsync: saveClub, isPending } = useMutation({
        mutationFn: async (values: any) => {
            let bannerUrl = values.bannerUrl || initialValues.bannerUrl;

            // Upload Banner if new file
            if (bannerFile) {
                const formData = new FormData();
                formData.append('file', bannerFile);
                const res = await fetch('/api/ipfs/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (!data.IpfsHash) throw new Error("Banner upload failed");
                bannerUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
            }

            const token = await getAccessToken();
            const res = await fetch('/api/community/fan-club', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    ...values,
                    bannerUrl,
                    tiers: [
                        { name: 'Free Member', price: 0 },
                        { name: 'VIP Member', price: 5, nftContract: '0x...' }
                    ]
                })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("Save failed:", errData);
                throw new Error(errData.error || errData.details || 'Failed to save');
            }
            return res.json();
        },
        onSuccess: () => {
            messageApi.success('Fan Club updated!');
            queryClient.invalidateQueries({ queryKey: ['fanClub'] });
        }
    });

    if (isLoading) return <div>Loading club data...</div>;

    const initialValues = club || { name: `${user?.customMetadata?.name || 'Artist'}'s Club` };

    return (
        <Card title="Manage Fan Club" className="max-w-2xl mx-auto shadow-sm">
            {contextHolder}
            <Form form={form} layout="vertical" onFinish={saveClub} initialValues={initialValues}>
                {/* ... (rest of form) ... */}
                <Form.Item name="name" label="Club Name" rules={[{ required: true }]}>
                    <Input placeholder="e.g. The Rockstars" size="large" />
                </Form.Item>

                <Form.Item name="description" label="Description">
                    <Input.TextArea rows={3} placeholder="What is this club about?" />
                </Form.Item>

                <Form.Item label="Club Banner">
                    <div className="space-y-4">
                        {(bannerFile || initialValues.bannerUrl) && (
                            <img
                                src={bannerFile ? URL.createObjectURL(bannerFile) : initialValues.bannerUrl}
                                alt="Banner"
                                className="w-full h-48 object-cover rounded-xl"
                            />
                        )}
                        <Upload
                            beforeUpload={(f) => { setBannerFile(f); return false; }}
                            showUploadList={false}
                            accept="image/*"
                        >
                            <Button icon={<UploadOutlined />}>
                                {bannerFile || initialValues.bannerUrl ? 'Change Banner' : 'Upload Banner'}
                            </Button>
                        </Upload>
                    </div>
                </Form.Item>

                <Divider>Membership Tiers</Divider>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card size="small" title="Free Tier" className="bg-gray-50">
                        <Text className="text-gray-500">Access to public chat and updates</Text>
                        <div className="mt-2 font-bold">Free</div>
                    </Card>
                    <Card size="small" title="VIP Tier (NFT)" className="bg-purple-50 border-purple-100">
                        <Text className="text-purple-600">Exclusive content & badge</Text>
                        <div className="mt-2 font-bold text-purple-700">5 USDC (Mint)</div>
                    </Card>
                </div>

                <Button type="primary" htmlType="submit" size="large" loading={isPending} block>
                    {club ? 'Update Fan Club' : 'Create Fan Club'}
                </Button>
            </Form>
        </Card>
    );
}
