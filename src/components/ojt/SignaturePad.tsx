'use client'

import { useRef, useEffect, useState } from 'react'

interface SignaturePadProps {
    value?: string
    onChange: (signatureDataUrl: string) => void
    color?: string
}

export default function SignaturePad({ value, onChange, color = '#a855f7' }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)

    // Load initial value if it exists
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        if (!value) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            return
        }

        // Only draw if we aren't currently drawing
        const img = new Image()
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
        }
        img.src = value
    }, [value])

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const x = (e.clientX - rect.left) * scaleX
        const y = (e.clientY - rect.top) * scaleY
        
        ctx.beginPath()
        ctx.moveTo(x, y)
        setIsDrawing(true)
        // ensure touch doesn't scroll
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const x = (e.clientX - rect.left) * scaleX
        const y = (e.clientY - rect.top) * scaleY
        
        ctx.lineTo(x, y)
        ctx.strokeStyle = color
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
    }

    const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return
        setIsDrawing(false)
        const canvas = canvasRef.current
        if (!canvas) return
        onChange(canvas.toDataURL())
        e.currentTarget.releasePointerCapture(e.pointerId)
    }

    const clear = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onChange('')
    }

    return (
        <div className="relative w-full h-32 bg-zinc-950 border border-dashed border-white/10 rounded-xl overflow-hidden group">
            <canvas
                ref={canvasRef}
                width={800}
                height={256}
                className="w-full h-full touch-none cursor-crosshair"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerOut={stopDrawing}
            />
            {/* Clear Button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                    onClick={(e) => { e.preventDefault(); clear() }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-md shadow-lg"
                >
                    Clear
                </button>
            </div>
            {/* Placeholder Text */}
            {!value && !isDrawing && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <span className="text-zinc-700 font-mono text-sm opacity-50">Draw signature here...</span>
                </div>
            )}
        </div>
    )
}
