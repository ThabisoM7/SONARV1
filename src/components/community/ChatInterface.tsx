'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { Input, Button, Avatar, Spin, message, Upload, Empty } from 'antd';
import { SendOutlined, PictureOutlined, UserOutlined } from '@ant-design/icons';
import { RcFile } from 'antd/es/upload';

interface ChatInterfaceProps {
    clubId: string;
    clubName: string;
}

export function ChatInterface({ clubId, clubName }: ChatInterfaceProps) {
    const { user, getAccessToken } = usePrivy();
    const queryClient = useQueryClient();
    const [content, setContent] = useState('');
    const [file, setFile] = useState<RcFile | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Fetch Messages (Poll every 3s for real-time feel)
    const { data: messages, isLoading } = useQuery({
        queryKey: ['chat', clubId],
        queryFn: async () => (await fetch(`/api/community/chat?clubId=${clubId}`)).json(),
        refetchInterval: 3000
    });

    // Auto-scroll to bottom
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Send Mutation
    const { mutateAsync: sendMessage, isPending } = useMutation({
        mutationFn: async () => {
            if (!content.trim() && !file) return;

            let imageCid = undefined;
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/ipfs/upload', { method: 'POST', body: formData });
                const data = await res.json();
                imageCid = data.IpfsHash;
            }

            const token = await getAccessToken();
            await fetch('/api/community/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    clubId,
                    content,
                    imageCid
                })
            });
        },
        onSuccess: () => {
            setContent('');
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ['chat', clubId] });
        },
        onError: () => {
            message.error("Failed to send");
        }
    });

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-lg m-0">#{clubName}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center pt-10"><Spin /></div>
                ) : !Array.isArray(messages) || messages.length === 0 ? (
                    <div className="flex justify-center pt-20 text-gray-400">
                        {messages?.error ? <span className="text-red-400">{messages.error}</span> : <Empty description="No messages yet. Say hello!" />}
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = msg.user?.walletAddress === user?.wallet?.address;
                        return (
                            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <Avatar
                                    src={msg.user?.imageCid ? `https://gateway.pinata.cloud/ipfs/${msg.user.imageCid}` : undefined}
                                    icon={<UserOutlined />}
                                />
                                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="font-bold text-xs text-gray-700">
                                            {msg.user?.name || (msg.user?.walletAddress ? `${msg.user.walletAddress.slice(0, 6)}...${msg.user.walletAddress.slice(-4)}` : 'Unknown')}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`p-3 rounded-xl text-sm ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                                        {msg.imageCid && (
                                            <img
                                                src={`https://gateway.pinata.cloud/ipfs/${msg.imageCid}`}
                                                className="rounded-lg mb-2 max-w-full"
                                                alt="attachment"
                                            />
                                        )}
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
                {file && (
                    <div className="mb-2 flex items-center gap-2 bg-gray-50 p-2 rounded-lg w-fit">
                        <span className="text-xs text-gray-500">Image attached</span>
                        <Button size="small" type="text" danger onClick={() => setFile(null)}>X</Button>
                    </div>
                )}
                <div className="flex gap-2">
                    <Upload
                        beforeUpload={(f) => { setFile(f); return false; }}
                        showUploadList={false}
                        accept="image/*"
                    >
                        <Button icon={<PictureOutlined />} />
                    </Upload>
                    <Input
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        onPressEnter={() => sendMessage()}
                        placeholder={`Message #${clubName}`}
                        disabled={isPending}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={() => sendMessage()}
                        loading={isPending}
                        className="bg-purple-600"
                    />
                </div>
            </div>
        </div>
    );
}
