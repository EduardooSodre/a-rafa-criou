'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { User, Heart } from 'lucide-react'

export function MobileHeader() {
    return (
        <div className="bg-[#FED466] py-2 sm:py-3 md:py-4">
            <div className="container mx-auto px-2 sm:px-4">
                <div className="flex items-center justify-between md:hidden">
                    {/* Mobile: User Icon - primeiro */}
                    <Button asChild variant="ghost" size="sm" className="hover:bg-white/10 p-6 flex flex-col items-center gap-1">
                        <Link href="/auth/login" className="no-underline">
                            <User className="w-6 h-6 text-white" strokeWidth={2.5} />
                            <span className="text-[10px] font-bold text-white">CONTA</span>
                        </Link>
                    </Button>

                    {/* Mobile: Logo centralizada */}
                    <Link href="/" className="flex items-center justify-center gap-2 no-underline">
                        <Image
                            src="/logo.webp"
                            alt="A Rafa Criou"
                            width={200}
                            height={60}
                            className="h-14 sm:h-16 w-auto"
                        />
                    </Link>

                    {/* Mobile: Favoritos Icon */}
                    <Button asChild variant="ghost" size="sm" className="hover:bg-white/10 p-6 flex flex-col items-center gap-1">
                        <Link href="/favoritos" className="no-underline">
                            <Heart className="w-6 h-6 text-white" strokeWidth={2.5} />
                            <span className="text-[10px] font-bold text-white">FAVORITOS</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}