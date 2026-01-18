'use client';

import { Modal, Input, List, Button, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useUserData } from '@/hooks/useUserData';
import { useState } from 'react';

interface PlaylistManagerProps {
    trackId?: string; // If provided, shows UI to add this track to playlist
    visible: boolean;
    onClose: () => void;
}

export function PlaylistManager({ trackId, visible, onClose }: PlaylistManagerProps) {
    const { playlists, createPlaylist, addToPlaylist, loading } = useUserData();
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { message } = App.useApp();

    const handleCreate = async () => {
        if (!newPlaylistName.trim()) return;
        await createPlaylist(newPlaylistName);
        setNewPlaylistName('');
        setIsCreating(false);
        message.success('Playlist created');
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        if (!trackId) return;
        await addToPlaylist(playlistId, trackId);
        message.success('Added to playlist');
        onClose();
    };

    return (
        <Modal
            title={trackId ? "Add to Playlist" : "My Playlists"}
            open={visible}
            onCancel={onClose}
            footer={null}
        >
            <div className="mb-4">
                {isCreating ? (
                    <div className="flex gap-2">
                        <Input
                            placeholder="Playlist Name"
                            value={newPlaylistName}
                            onChange={e => setNewPlaylistName(e.target.value)}
                            onPressEnter={handleCreate}
                        />
                        <Button type="primary" onClick={handleCreate} loading={loading}>Save</Button>
                        <Button onClick={() => setIsCreating(false)}>Cancel</Button>
                    </div>
                ) : (
                    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setIsCreating(true)}>
                        Create New Playlist
                    </Button>
                )}
            </div>

            <List
                dataSource={playlists}
                renderItem={item => (
                    <List.Item
                        actions={trackId ? [<Button type="link" size="small" onClick={() => handleAddToPlaylist(item.id)}>Add</Button>] : []}
                    >
                        <List.Item.Meta
                            title={item.name}
                            description={`${item.songs.length} songs`}
                        />
                    </List.Item>
                )}
            />
        </Modal>
    );
}
