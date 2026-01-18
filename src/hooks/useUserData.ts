import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';

export interface Playlist {
    id: string;
    name: string;
    songs: string[]; // Token IDs
    createdAt: number;
}

export interface UserData {
    likedSongs: string[]; // Token IDs
    playlists: Playlist[];
}

export function useUserData() {
    const { user, getAccessToken } = usePrivy();
    const [likedSongs, setLikedSongs] = useState<string[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(false);

    // Sync state with Privy User object on load/update
    useEffect(() => {
        if (user?.customMetadata) {
            const meta = user.customMetadata as any;
            setLikedSongs(meta.likedSongs || []);
            setPlaylists(meta.playlists || []);
        }
    }, [user]);

    const saveData = async (newData: Partial<UserData>) => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            if (!token) throw new Error("No auth token");

            const res = await fetch('/api/privy/update-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken: token, update: newData })
            });

            if (!res.ok) throw new Error('Failed to save data');

            // Privy hook usually auto-updates user object via socket/polling, 
            // but we might want optimistic UI updates in the components.
        } catch (error) {
            console.error(error);
            message.error('Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    const toggleLike = async (trackId: string) => {
        const isLiked = likedSongs.includes(trackId);
        let newLiked;
        if (isLiked) {
            newLiked = likedSongs.filter(id => id !== trackId);
        } else {
            newLiked = [...likedSongs, trackId];
        }

        setLikedSongs(newLiked); // Optimistic Update
        await saveData({ likedSongs: newLiked });
    };

    const createPlaylist = async (name: string) => {
        const newPlaylist: Playlist = {
            id: crypto.randomUUID(),
            name,
            songs: [],
            createdAt: Date.now()
        };
        const newPlaylists = [...playlists, newPlaylist];
        setPlaylists(newPlaylists);
        await saveData({ playlists: newPlaylists });
    };

    const addToPlaylist = async (playlistId: string, trackId: string) => {
        const newPlaylists = playlists.map(p => {
            if (p.id === playlistId) {
                if (p.songs.includes(trackId)) return p; // Already in playlist
                return { ...p, songs: [...p.songs, trackId] };
            }
            return p;
        });
        setPlaylists(newPlaylists);
        await saveData({ playlists: newPlaylists });
    };

    return {
        likedSongs,
        playlists,
        toggleLike,
        createPlaylist,
        addToPlaylist,
        loading
    };
}
