'use client';

import { usePlayer } from './PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';



export function GlobalPlayer() {
    const { currentTrack, isPlaying, togglePlay } = usePlayer();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const getGatewayUrl = (ipfsUri: string) => {
        if (!ipfsUri) return '';
        const cid = ipfsUri.replace('ipfs://', '');
        return `https://gateway.pinata.cloud/ipfs/${cid}`;
    };

    useEffect(() => {
        if (isPlaying) {
            audioRef.current?.play();
        } else {
            audioRef.current?.pause();
        }
    }, [isPlaying]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    if (!currentTrack) return null;

    const audioSrc = currentTrack.metadata?.animation_url ? getGatewayUrl(currentTrack.metadata.animation_url) : '';
    const imageSrc = currentTrack.metadata?.image ? getGatewayUrl(currentTrack.metadata.image) : '';

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[600px] h-20 glass rounded-full z-50 flex items-center px-2 pr-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">

            {/* Album Art (Spinning if playing) */}
            <div className={`relative h-16 w-16 rounded-full overflow-hidden border-2 border-white/10 shrink-0 ${isPlaying ? 'animate-spin-slow' : ''}`}>
                {imageSrc ? (
                    <img src={imageSrc} alt="Album Art" className="h-full w-full object-cover" />
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
                <span className="text-foreground font-bold truncate text-sm">{currentTrack.metadata?.name || 'Unknown Track'}</span>
                <span className="text-gray-400 text-xs truncate">{currentTrack.metadata?.attributes?.[0]?.value || 'Unknown Artist'}</span>

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
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <SkipBack size={20} />
                </button>

                <button
                    onClick={togglePlay}
                    className="h-10 w-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
                >
                    {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
                </button>

                <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <SkipForward size={20} />
                </button>
            </div>

            <audio
                ref={audioRef}
                src={audioSrc}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => togglePlay()}
                autoPlay={isPlaying}
            />
        </div>
    );
}
