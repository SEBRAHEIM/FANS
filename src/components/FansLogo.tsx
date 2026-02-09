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
            viewBox="0 0 1000 380"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* F */}
            <path
                d="M30 70 H200 V130 H110 V180 H185 V240 H110 V350 H30 Z"
                fill={blue}
            />

            {/* A (red) with inner cutout */}
            <path
                d="M240 350 L320 70 H400 L480 350 H400 L385 290 H335 L320 350 H240 Z M350 220 H370 L360 150 Z"
                fill={red}
            />

            {/* Blue streak line behind A */}
            <path
                d="M280 320 Q380 200 520 80"
                stroke={blue}
                strokeWidth="25"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
            />

            {/* Red streak line (airplane trail) */}
            <path
                d="M300 340 Q400 220 540 100"
                stroke={red}
                strokeWidth="18"
                strokeLinecap="round"
                fill="none"
            />

            {/* Airplane icon */}
            <path
                d="M535 95 L550 100 L535 105 L542 100 Z"
                fill={red}
            />

            {/* A (blue overlay part) */}
            <path
                d="M440 70 L520 350 H600 L680 70 H600 L585 130 H535 L520 70 H440 Z M550 200 H570 L560 130 Z"
                fill={blue}
            />

            {/* N */}
            <path
                d="M700 70 H780 L880 270 V70 H960 V350 H880 L780 150 V350 H700 Z"
                fill={blue}
            />

            {/* S */}
            <path
                d="M1030 280 Q1030 350 1130 350 Q1230 350 1230 280 Q1230 210 1130 190 Q1030 170 1030 100 Q1030 30 1130 30 Q1230 30 1230 100 H1150 Q1150 70 1130 70 Q1110 70 1110 100 Q1110 130 1210 150 Q1310 170 1310 280 Q1310 390 1130 390 Q950 390 950 280 H1030 Z"
                fill={blue}
            />
        </svg>
    )
}
