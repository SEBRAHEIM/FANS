'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react'
import ReactPlayer from 'react-player'

interface Checkpoint {
    id: string
    timestamp_seconds: number
    is_blocking: boolean
    video_id?: string
    question: {
        id: string
        question_text: string
        options: string[]
    }
}

interface InteractivePlayerProps {
    url: string
    isUnskippable?: boolean
    checkpoints?: Checkpoint[]
    initialTimestamp?: number
    onProgressUpdate?: (seconds: number) => void
    onCheckpointReached?: (checkpoint: Checkpoint) => void
    onEnded?: () => void
}

export default function InteractivePlayer({
    url,
    isUnskippable = false,
    checkpoints = [],
    initialTimestamp = 0,
    onProgressUpdate,
    onCheckpointReached,
    onEnded
}: InteractivePlayerProps) {
    const playerRef = useRef<any>(null)
    const [playing, setPlaying] = useState(false)
    const [played, setPlayed] = useState(0)
    const [duration, setDuration] = useState(0)
    const [maxTimeWatched, setMaxTimeWatched] = useState(initialTimestamp)
    const [seeking, setSeeking] = useState(false)
    const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null)
    const [clearedCheckpointIds, setClearedCheckpointIds] = useState<string[]>([])

    // Sync initial timestamp
    useEffect(() => {
        if (playerRef.current && initialTimestamp > 0) {
            playerRef.current.seekTo(initialTimestamp, 'seconds')
            setMaxTimeWatched(initialTimestamp)
        }
    }, [initialTimestamp])

    const handleProgress = (state: any) => {
        if (!seeking) {
            setPlayed(state.played)

            // Check for checkpoints
            const upcomingCheckpoint = checkpoints.find(c =>
                !clearedCheckpointIds.includes(c.id) &&
                Math.floor(state.playedSeconds) === c.timestamp_seconds
            )

            if (upcomingCheckpoint && upcomingCheckpoint.id !== activeCheckpoint?.id) {
                // Ensure the checkpoint belongs to this specific video if video_id is set
                if (!upcomingCheckpoint.video_id || upcomingCheckpoint.video_id === url) {
                    // Note: In Classroom, we filter by video_id before passing to player, 
                    // but this is a secondary safety check.
                    setPlaying(false)
                    setActiveCheckpoint(upcomingCheckpoint)
                    onCheckpointReached?.(upcomingCheckpoint)
                }
            }

            // Track max time if unskippable
            if (state.playedSeconds > maxTimeWatched) {
                setMaxTimeWatched(state.playedSeconds)
                onProgressUpdate?.(Math.floor(state.playedSeconds))
            }
        }
    }

    const handleSeek = (e: any) => {
        const newTime = parseFloat(e.target.value) * duration
        if (isUnskippable && newTime > maxTimeWatched + 2) {
            // Block seeking forward past what's been watched
            return
        }
        setPlayed(parseFloat(e.target.value))
        playerRef.current?.seekTo(parseFloat(e.target.value))
    }

    const handleActionComplete = () => {
        if (activeCheckpoint) {
            setClearedCheckpointIds([...clearedCheckpointIds, activeCheckpoint.id])
            setActiveCheckpoint(null)
            setPlaying(true)
        }
    }

    return (
        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl group">
            <ReactPlayer
                ref={playerRef}
                url={url}
                width="100%"
                height="100%"
                playing={playing && !activeCheckpoint}
                onProgress={handleProgress}
                onDuration={setDuration}
                onEnded={onEnded}
                progressInterval={1000}
                config={{
                    file: { attributes: { controlsList: 'nodownload' } },
                    youtube: { playerVars: { disablekb: isUnskippable ? 1 : 0, modestbranding: 1 } as any }
                }}
                className="pointer-events-none" // Disable native controls if we want strict unskippable
            />

            {/* Custom Overlay Controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => setPlaying(!playing)}
                        className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-xl"
                    >
                        {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    </button>

                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                            <span>{Math.floor(played * duration / 60)}:{(Math.floor(played * duration % 60)).toString().padStart(2, '0')}</span>
                            <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={0.999999}
                            step="any"
                            value={played}
                            onChange={handleSeek}
                            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                {isUnskippable && (
                    <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest bg-orange-500/10 px-3 py-1.5 rounded-full w-fit border border-orange-500/20">
                        <AlertCircle className="w-3 h-3" />
                        Unskippable Progress Active
                    </div>
                )}
            </div>

            {/* Checkpoint Overlay */}
            {activeCheckpoint && (
                <div className="absolute inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-8 animate-in fade-in duration-300">
                    <div className="max-w-md w-full space-y-8 text-center">
                        <div className="inline-flex w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center shadow-xl shadow-blue-500/20 mb-4">
                            <HelpCircle className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-500">Knowledge Check</h3>
                            <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">
                                {activeCheckpoint.question.question_text}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-6">
                            {activeCheckpoint.question.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={handleActionComplete}
                                    className="w-full p-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm font-bold text-zinc-400 hover:border-blue-500 hover:text-white transition-all active:scale-[0.98]"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function HelpCircle(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}
