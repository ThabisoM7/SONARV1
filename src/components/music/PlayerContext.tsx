'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Track {
    tokenId: string;
    artist: string;
    uri: string;
    metadata?: any; // To store name, image from IPFS JSON
}

interface PlayerContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    playTrack: (track: Track) => void;
    pauseTrack: () => void;
    togglePlay: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const playTrack = (track: Track) => {
        if (currentTrack?.tokenId === track.tokenId) {
            setIsPlaying(true);
        } else {
            setCurrentTrack(track);
            setIsPlaying(true);
        }
    };

    const pauseTrack = () => setIsPlaying(false);

    const togglePlay = () => {
        if (currentTrack) setIsPlaying(!isPlaying);
    };

    return (
        <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, pauseTrack, togglePlay }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
}
