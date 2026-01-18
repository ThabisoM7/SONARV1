'use client';

import { Modal, Input, Button, Upload, message, Select, Image } from 'antd';
import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useReadContract } from 'wagmi';
import contractJson from "../../artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json";

interface CreatePostModalProps {
    open: boolean;
    onClose: () => void;
}

export function CreatePostModal({ open, onClose }: CreatePostModalProps) {
    const { getAccessToken, user } = usePrivy();
    const queryClient = useQueryClient();
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [embeddedTrackId, setEmbeddedTrackId] = useState<string | null>(null);
    const [tierId, setTierId] = useState<string | null>(null);

    // Determines if user is artist (check local logic or role from DB API ideally)
    const isArtist = (user?.customMetadata as any)?.role === 'artist';

    // Fetch My Fan Club Tiers
    const { data: fanClub } = useQuery({
        queryKey: ['myFanClub', user?.wallet?.address],
        queryFn: async () => {
            if (!user?.wallet?.address) return null;
            return (await fetch(`/api/community/fan-club?artistWallet=${user.wallet.address}`)).json();
        },
        enabled: isArtist && !!user?.wallet?.address
    });

    // Fetch Artist's Tracks
    const { data: allTracks } = useReadContract({
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi: contractJson.abi,
        functionName: 'getAllTracks',
    }) as { data: any[] };

    const artistTracks = allTracks?.filter((t: any) => t.artist.toLowerCase() === user?.wallet?.address?.toLowerCase()) || [];

    const { mutateAsync: createPost, isPending } = useMutation({
        mutationFn: async () => {
            const token = await getAccessToken();
            const res = await fetch('/api/social/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    content,
                    mediaUrl,
                    embeddedTrackId,
                    tierId
                })
            });
            if (!res.ok) throw new Error('Failed to create post');
            return res.json();
        },
        onSuccess: () => {
            message.success('Post created!');
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            setContent('');
            setEmbeddedTrackId(null);
            onClose();
        },
        onError: () => message.error('Failed to post')
    });

    return (
        <Modal
            title="Create Post"
            open={open}
            onCancel={onClose}
            onOk={() => createPost()}
            okText="Post"
            confirmLoading={isPending}
            okButtonProps={{ disabled: !content.trim() }}
        >
            <Input.TextArea
                rows={4}
                placeholder="What's on your mind?"
                value={content}
                onChange={e => setContent(e.target.value)}
                className="mb-4"
            />

            <Input
                placeholder="Image URL (Optional)"
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                className="mb-4"
            />
            {mediaUrl && <Image src={mediaUrl} height={100} className="mb-4 rounded" />}

            {isArtist && (
                <div className="mb-4">
                    <div className="font-bold mb-2 text-xs uppercase text-gray-500">Visibility</div>
                    <Select
                        style={{ width: '100%' }}
                        value={tierId}
                        onChange={setTierId}
                        options={[
                            { label: 'Public (Everyone)', value: null },
                            ...(fanClub?.tiers?.map((t: any) => ({
                                label: `${t.name} Only`,
                                value: t.id
                            })) || [])
                        ]}
                    />
                </div>
            )}

            {isArtist && artistTracks.length > 0 && (
                <div>
                    <div className="font-bold mb-2 text-xs uppercase text-gray-500">Attach a Song</div>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Select a song to embed"
                        allowClear
                        onChange={setEmbeddedTrackId}
                        options={artistTracks.filter((t: any) => t?.id).map((t: any) => ({
                            label: `Token #${t.id.toString()} (Details need metadata fetch)`,
                            value: t.id.toString()
                        }))}
                    />
                </div>
            )}
        </Modal>
    );
}
