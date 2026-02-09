'use client'

import React from 'react'
import Image from 'next/image'

interface FansLogoProps {
    className?: string
    variant?: 'default' | 'white'
}

export default function FansLogo({ className = "h-8", variant = 'default' }: FansLogoProps) {
    return (
        <Image
            src="/fans-logo.png"
            alt="FANS Logo"
            width={200}
            height={80}
            className={className}
            priority
            style={{
                objectFit: 'contain',
                filter: variant === 'white' ? 'brightness(0) invert(1)' : 'none'
            }}
        />
    )
}
