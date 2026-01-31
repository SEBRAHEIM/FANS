'use client'

import { useState } from 'react'
import { updatePassword } from '@/app/auth/actions'
import { Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const password = formData.get('password') as string
        const confirm = formData.get('confirm') as string

        if (password !== confirm) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            setLoading(false)
            return
        }

        const result = await updatePassword(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />

                    <header className="mb-8 relative">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6">
                            <ShieldCheck className="w-8 h-8 text-blue-500" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-2">Security Update</h1>
                        <p className="text-zinc-500 font-medium">Please set a new secure password for your account.</p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-6 relative">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-bold animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2" htmlFor="password">
                                <Lock className="w-3 h-3" />
                                New Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2" htmlFor="confirm">
                                <Lock className="w-3 h-3" />
                                Confirm Password
                            </label>
                            <input
                                id="confirm"
                                name="confirm"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Update Password
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
