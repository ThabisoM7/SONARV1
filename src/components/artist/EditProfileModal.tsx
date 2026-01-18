'use client';

import { Modal, Form, Input, Button, Upload, message, Avatar } from 'antd';
import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { RcFile } from 'antd/es/upload';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentName?: string;
    currentBio?: string;
    currentImageCid?: string;
}

export function EditProfileModal({ visible, onClose, onSuccess, currentName, currentBio, currentImageCid }: EditProfileModalProps) {
    const { getAccessToken, user, createWallet } = usePrivy();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<RcFile | null>(null);
    const [messageApi, contextHolder] = message.useMessage();

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            let imageCid = currentImageCid;

            // 1. Upload Image if changed
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/ipfs/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (!data.IpfsHash) throw new Error("Image upload failed");
                imageCid = data.IpfsHash;
            }

            // 2. Update Profile via Privy
            const token = await getAccessToken();
            const res = await fetch('/api/privy/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    name: values.name,
                    bio: values.bio,
                    imageCid: imageCid
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            messageApi.success("Profile updated!");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Profile update error:", error);
            messageApi.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Edit Profile"
            open={visible}
            onCancel={onClose}
            onOk={handleOk}
            confirmLoading={loading}
        >
            {contextHolder}
            <Form
                form={form}
                layout="vertical"
                initialValues={{ name: currentName, bio: currentBio }}
            >
                <div className="text-center mb-6">
                    <Avatar
                        size={80}
                        src={file ? URL.createObjectURL(file) : (currentImageCid ? `https://gateway.pinata.cloud/ipfs/${currentImageCid}` : undefined)}
                        icon={<UserOutlined />}
                        className="mb-4"
                    />
                    <Upload
                        beforeUpload={(f) => { setFile(f); return false; }}
                        showUploadList={false}
                        accept="image/*"
                    >
                        <Button icon={<UploadOutlined />}>Change Picture</Button>
                    </Upload>
                </div>

                <Form.Item name="name" label="Display Name" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="bio" label="Bio">
                    <Input.TextArea rows={3} />
                </Form.Item>

                <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-bold mb-2">Wallet Settings</h4>
                    {user?.wallet ? (
                        <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                            <span className="text-gray-500 text-sm">Active Wallet</span>
                            <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                            </span>
                        </div>
                    ) : (
                        <div className="text-center bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <p className="text-sm text-purple-700 mb-3">
                                You need a wallet to join Fan Clubs and collect music.
                            </p>
                            <Button
                                type="primary"
                                className="bg-purple-600"
                                onClick={async () => {
                                    try {
                                        setLoading(true);
                                        await createWallet();
                                        messageApi.success("Wallet created!");
                                    } catch (e) {
                                        console.error(e);
                                        messageApi.error("Failed to create wallet");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                Create Secure Wallet
                            </Button>
                        </div>
                    )}
                </div>
            </Form>
        </Modal>
    );
}
