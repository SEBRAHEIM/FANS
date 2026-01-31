'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react'

interface TrainingVideoPlayerProps {
    videoUrl: string
    onComplete: () => void
}

export default function TrainingVideoPlayer({ videoUrl, onComplete }: TrainingVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const lastTimeRef = useRef(0)

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause()
            else videoRef.current.play()
            setIsPlaying(!isPlaying)
        }
    }

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime
            const duration = videoRef.current.duration
            setProgress((current / duration) * 100)

            // Prevent skipping forward
            if (current > lastTimeRef.current + 2) {
                videoRef.current.currentTime = lastTimeRef.current
            } else {
                lastTimeRef.current = current
            }
        }
    }

    const handleEnded = () => {
        setIsCompleted(true)
        setIsPlaying(false)
        onComplete()
    }

    return (
        <div className="relative group rounded-3xl overflow-hidden bg-black aspect-video border border-zinc-800 shadow-2xl">
            <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
            />

            {/* Custom Overlay Controls */}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-all text-white shadow-lg"
                    >
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </button>

                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {isCompleted && (
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" />
                            Completed
                        </div>
                    )}
                </div>
            </div>

            {/* Lock Overlay when not playing */}
            {!isPlaying && !isCompleted && progress === 0 && (
                <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer backdrop-blur-[2px]">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 animate-pulse text-white">
                        <Play className="w-10 h-10 fill-current ml-2" />
                    </div>
                </div>
            )}
        </div>
    )
}
