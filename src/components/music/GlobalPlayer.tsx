'use client';

import { usePlayer } from './PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export function GlobalPlayer() {
    const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack } = usePlayer();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const { getAccessToken } = usePrivy();

    // Stream Counting State
    const [hasCountedStream, setHasCountedStream] = useState(false);

    useEffect(() => {
        // Reset stream count when track changes
        setHasCountedStream(false);
    }, [currentTrack?.id]);

    useEffect(() => {
        if (isPlaying) {
            audioRef.current?.play();
        } else {
            audioRef.current?.pause();
        }
    }, [isPlaying, currentTrack]); // Added currentTrack dependency to ensure auto-play on switch

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const time = audioRef.current.currentTime;
            setCurrentTime(time);
            setDuration(audioRef.current.duration || 0);

            // Stream Count Logic: Count after 30 seconds
            // Also ensure we haven't counted this session yet
            if (time > 30 && !hasCountedStream && currentTrack?.id) {
                recordStream(currentTrack.id);
                setHasCountedStream(true);
            }
        }
    };

    const recordStream = async (trackId: string) => {
        try {
            const token = await getAccessToken();
            // Fire and forget
            fetch('/api/music/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackId, authToken: token })
            });
        } catch (e) {
            console.error("Stream record failed", e);
        }
    }

    if (!currentTrack) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[600px] h-20 glass rounded-full z-50 flex items-center px-2 pr-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">

            {/* Album Art (Spinning if playing) */}
            <div className={`relative h-16 w-16 rounded-full overflow-hidden border-2 border-white/10 shrink-0 ${isPlaying ? 'animate-spin-slow' : ''}`}>
                {currentTrack.imageSrc ? (
                    <img src={currentTrack.imageSrc} alt="Album Art" className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-gray-800 flex items-center justify-center">
                        <Music size={24} className="text-gray-500" />
                    </div>
                )}
                {/* Center hole for vinyl effect */}
                <div className="absolute inset-0 m-auto h-3 w-3 bg-black rounded-full border border-white/20" />
            </div>

            {/* Track Info */}
            <div className="flex flex-col ml-4 mr-6 flex-1 min-w-0">
                <span className="text-foreground font-bold truncate text-sm">{currentTrack.title}</span>
                <span className="text-gray-400 text-xs truncate">{currentTrack.artist}</span>

                {/* Progress Bar (Mini) */}
                <div className="w-full h-1 bg-white/10 rounded-full mt-2 relative group cursor-pointer"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const pct = x / rect.width;
                        if (audioRef.current) audioRef.current.currentTime = pct * (duration || 0);
                    }}
                >
                    <div
                        className="h-full bg-primary rounded-full relative"
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    >
                        {/* Scrubber Knob (Show on group hover) */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 shrink-0">
                <button onClick={prevTrack} className="text-muted-foreground hover:text-foreground transition-colors">
                    <SkipBack size={20} />
                </button>

                <button
                    onClick={togglePlay}
                    className="h-10 w-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
                >
                    {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
                </button>

                <button onClick={nextTrack} className="text-muted-foreground hover:text-foreground transition-colors">
                    <SkipForward size={20} />
                </button>
            </div>

            <audio
                ref={audioRef}
                src={currentTrack.audioSrc}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => nextTrack()} // Auto-advance
                autoPlay={true}
            />
        </div>
    );
}
