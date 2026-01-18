'use client';

import { usePlayer } from './PlayerContext';
import { Button, Avatar, Typography, Slider } from 'antd';
import { PlayCircleFilled, PauseCircleFilled, StepBackwardOutlined, StepForwardOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';

const { Text } = Typography;

export function GlobalPlayer() {
    const { currentTrack, isPlaying, togglePlay } = usePlayer();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Helper to resolve Gateway URL
    const getGatewayUrl = (ipfsUri: string) => {
        if (!ipfsUri) return '';
        const cid = ipfsUri.replace('ipfs://', '');
        return `https://gateway.pinata.cloud/ipfs/${cid}`;
    };

    useEffect(() => {
        if (!currentTrack) return;

        // We need to fetch the metadata to find the animation_url (audio)
        // For MVP, we pass metadata in track object, or we fetch it here.
        // Assuming currentTrack.metadata has the audio details.

        // But wait, the URI in contract is for Metadata JSON.
        // So currentTrack.uri is `ipfs://QmMetadata...`
        // We need to fetch that JSON first to get the Audio CID (`animation_url`).
        // This fetching should ideally happen at the Card level or handled cleanly.
        // For now, let's assume `currentTrack.metadata` is populated by the SongCard before playing.

    }, [currentTrack]);

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

    // Resolve Audio URL from Metadata
    // user.metadata.animation_url should contain ipfs://QmAudio...
    const audioSrc = currentTrack.metadata?.animation_url ? getGatewayUrl(currentTrack.metadata.animation_url) : '';
    const imageSrc = currentTrack.metadata?.image ? getGatewayUrl(currentTrack.metadata.image) : '';

    return (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-white border-t border-gray-200 px-6 flex items-center justify-between z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">

            {/* Track Info */}
            <div className="flex items-center gap-4 w-1/4">
                <Avatar shape="square" size={64} src={imageSrc} className="bg-gray-200" />
                <div className="flex flex-col">
                    <Text strong className="text-lg leading-tight">{currentTrack.metadata?.name || 'Unknown Track'}</Text>
                    <Text type="secondary" className="text-sm">{currentTrack.metadata?.attributes?.[0]?.value || 'Unknown Artist'}</Text>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center w-2/4">
                <div className="flex items-center gap-6 mb-2">
                    <Button type="text" icon={<StepBackwardOutlined style={{ fontSize: '20px' }} />} />
                    <button onClick={togglePlay} className="text-blue-600 hover:scale-105 transition-transform">
                        {isPlaying ? (
                            <PauseCircleFilled style={{ fontSize: '48px' }} />
                        ) : (
                            <PlayCircleFilled style={{ fontSize: '48px' }} />
                        )}
                    </button>
                    <Button type="text" icon={<StepForwardOutlined style={{ fontSize: '20px' }} />} />
                </div>
                <div className="w-full flex items-center gap-3">
                    <Text type="secondary" className="text-xs">{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</Text>
                    <Slider
                        value={(currentTime / (duration || 1)) * 100}
                        onChange={(val) => {
                            if (audioRef.current) audioRef.current.currentTime = (val / 100) * duration;
                        }}
                        tooltip={{ open: false }}
                        className="w-full m-0"
                    />
                    <Text type="secondary" className="text-xs">{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</Text>
                </div>
            </div>

            {/* Volume / Extra */}
            <div className="w-1/4 flex justify-end">
                {/* Placeholder for Volume */}
            </div>

            <audio
                ref={audioRef}
                src={audioSrc}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => togglePlay()} // Simple stop at end
                autoPlay={isPlaying}
            />
        </div>
    );
}
