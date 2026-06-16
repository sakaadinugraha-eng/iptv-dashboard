"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [levels, setLevels] = useState<{ height: number; bitrate: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLevels([]);
    setCurrentLevel(-1);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const availableLevels = data.levels.map((level) => ({
          height: level.height,
          bitrate: level.bitrate,
        }));
        
        if (availableLevels.length > 1) {
          setLevels(availableLevels);
        }
      });
      
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = parseInt(e.target.value, 10);
    setCurrentLevel(newLevel);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = newLevel; 
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg group">
      <video
        ref={videoRef}
        controls
        autoPlay
        className="w-full h-full object-contain"
      />
      {levels.length > 1 && (
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1.5 rounded-lg flex items-center gap-2 shadow-md">
          <label className="text-[10px] font-bold uppercase tracking-wider text-black">Quality:</label>
          <select 
            value={currentLevel} 
            onChange={handleQualityChange}
            className="text-xs bg-transparent border-none outline-none cursor-pointer text-black font-semibold"
          >
            <option value={-1}>Auto</option>
            {levels.map((level, index) => (
              <option key={index} value={index}>
                {level.height ? `${level.height}p` : `Level ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}