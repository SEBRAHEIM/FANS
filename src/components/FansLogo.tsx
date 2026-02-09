'use client'

import React from 'react'

interface FansLogoProps {
    className?: string
    variant?: 'default' | 'white'
}

export default function FansLogo({ className = "h-8", variant = 'default' }: FansLogoProps) {
    const blue = variant === 'white' ? '#FFFFFF' : '#7BB8E0'
    const red = variant === 'white' ? '#FFFFFF' : '#E21E26'

    return (
        <svg
            viewBox="0 0 500 150"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* F */}
            <path
                d="M30 40H110V60H55V85H100V105H55V140H30V40Z"
                fill={blue}
            />

            {/* A and Airplane Streak */}
            <path
                d="M130 140L170 40H190L230 140H205L195 115H155L145 140H130ZM162 95H188L175 62L162 95Z"
                fill={red}
            />

            {/* Airplane Streak - stylized trail */}
            <path
                d="M165 140C180 120 230 80 270 40"
                stroke={red}
                strokeWidth="4"
                strokeLinecap="round"
            />
            {/* Airplane icon at the end of the streak */}
            <path
                d="M265 35L275 40L265 45L270 40L265 35Z"
                fill={red}
            />

            {/* N */}
            <path
                d="M260 40H285L325 110V40H350V140H325L285 70V140H260V40Z"
                fill={blue}
            />

            {/* S */}
            <path
                d="M380 120C380 135 400 145 425 145C450 145 470 135 470 115C470 95 450 90 425 85C400 80 385 75 385 60C385 45 405 35 430 35C455 35 475 45 475 60H450C450 50 440 45 430 45C420 45 410 50 410 60C410 70 420 75 445 80C470 85 495 90 495 115C495 140 465 155 425 155C385 155 355 140 355 115H380Z"
                fill={blue}
            />
        </svg>
    )
}
