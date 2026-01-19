'use client';

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export interface PlayerTrack {
    id: string;       // DB ID (UUID)
    title: string;
    artist: string;
    audioSrc: string; // Full URL (gateway resolved or not)
    imageSrc: string; // Full URL
    collectionId?: string;
    duration?: number;
}

interface PlayerContextType {
    currentTrack: PlayerTrack | null;
    queue: PlayerTrack[];
    isPlaying: boolean;
    playTrack: (track: PlayerTrack) => void;
    playCollection: (tracks: PlayerTrack[], startIndex?: number) => void;
    pauseTrack: () => void;
    togglePlay: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [queue, setQueue] = useState<PlayerTrack[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);

    const currentTrack = useMemo(() => {
        if (currentIndex >= 0 && currentIndex < queue.length) {
            return queue[currentIndex];
        }
        return null;
    }, [queue, currentIndex]);

    const playTrack = (track: PlayerTrack) => {
        if (currentTrack?.id === track.id) {
            setIsPlaying(true);
        } else {
            setQueue([track]);
            setCurrentIndex(0);
            setIsPlaying(true);
        }
    };

    const playCollection = (tracks: PlayerTrack[], startIndex = 0) => {
        setQueue(tracks);
        setCurrentIndex(startIndex);
        setIsPlaying(true);
    };

    const pauseTrack = () => setIsPlaying(false);

    const togglePlay = () => {
        if (currentTrack) setIsPlaying(!isPlaying);
    };

    const nextTrack = () => {
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsPlaying(true);
        } else {
            // End of queue
            setIsPlaying(false);
            setCurrentIndex(0); // Reset or stop?
        }
    };

    const prevTrack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsPlaying(true);
        }
    };

    return (
        <PlayerContext.Provider value={{
            currentTrack,
            queue,
            isPlaying,
            playTrack,
            playCollection,
            pauseTrack,
            togglePlay,
            nextTrack,
            prevTrack
        }}>
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
