'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Mail, Phone, Shield } from 'lucide-react'
import { PaymentMethods } from '@/components/icons/PaymentIcon'

export function Footer() {
    return (
        <footer className="bg-gradient-to-br from-[#FD9555] to-[#FED466] text-white mt-auto pb-5 lg:pb-0">
            <div className="container mx-auto px-4 py-8 sm:py-10 lg:py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {/* Logo e Descrição */}
                    <div className="flex flex-col items-center sm:items-start">
                        <Link href="/" className="mb-3 sm:mb-4">
                            <Image
                                src="/logo.webp"
                                alt="A Rafa Criou"
                                width={160}
                                height={53}
                                className="h-auto w-auto max-w-[160px] sm:max-w-[180px]"
                                priority
                            />
                        </Link>
                        <p className="text-white/90 text-sm sm:text-sm text-center sm:text-left leading-relaxed">
                            Produtos digitais de qualidade para facilitar seu dia a dia.
                        </p>
                    </div>

                    {/* Links Importantes */}
                    <div className="flex flex-col items-center sm:items-start">
                        <h3 className="font-bold text-lg sm:text-lg mb-3 sm:mb-4">Institucional</h3>
                        <nav className="flex flex-col space-y-1.5 sm:space-y-2 text-center sm:text-left">
                            <Link
                                href="/sobre"
                                className="text-white/90 hover:text-white transition-colors text-sm sm:text-sm"
                            >
                                Sobre
                            </Link>
                            <Link
                                href="/direitos-autorais"
                                className="text-white/90 hover:text-white transition-colors text-sm sm:text-sm"
                            >
                                Direitos Autorais
                            </Link>
                            <Link
                                href="/trocas-devolucoes"
                                className="text-white/90 hover:text-white transition-colors text-sm sm:text-sm"
                            >
                                Trocas e Reembolsos
                            </Link>
                            <Link
                                href="/privacidade"
                                className="text-white/90 hover:text-white transition-colors text-sm sm:text-sm"
                            >
                                Privacidade
                            </Link>
                        </nav>
                    </div>

                    {/* Contato */}
                    <div className="flex flex-col items-center sm:items-start">
                        <h3 className="font-bold text-lg sm:text-lg mb-3 sm:mb-4">Contato</h3>
                        <div className="flex flex-col space-y-2 sm:space-y-3 text-center sm:text-left">
                            <a
                                href="https://wa.me/5511998274504"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm sm:text-sm justify-center sm:justify-start"
                            >
                                <Phone className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="break-all">(11) 99827-4504</span>
                            </a>
                            <a
                                href="mailto:arafacriou@gmail.com"
                                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm sm:text-sm justify-center sm:justify-start"
                            >
                                <Mail className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="break-all">arafacriou@gmail.com</span>
                            </a>
                            <div className="flex items-center gap-2 text-white/90 text-sm sm:text-sm justify-center sm:justify-start">
                                <MapPin className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                                Guarulhos - SP
                            </div>
                        </div>
                    </div>

                    {/* Pagamentos e Segurança */}
                    <div className="flex flex-col items-center sm:items-start">
                        <h3 className="font-bold text-lg sm:text-lg mb-3 sm:mb-4">Pagamento Seguro</h3>

                        {/* Métodos de Pagamento */}
                        <div className="mb-3 sm:mb-4 w-full">
                            <p className="text-xs sm:text-sm text-white/90 mb-2.5 text-center sm:text-left font-medium">Aceitamos:</p>
                            <PaymentMethods
                                className="flex flex-wrap gap-2 sm:gap-2.5 justify-center sm:justify-start"
                                iconSize="default"
                            />
                        </div>

                        {/* Selo de Segurança */}
                        <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 w-full sm:w-auto border border-white/20 shadow-lg">
                            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-green-300 flex-shrink-0" />
                            <div>
                                <p className="text-sm sm:text-sm font-bold">Site Seguro</p>
                                <p className="text-xs sm:text-xs text-white/90">Criptografia SSL 256-bit</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Linha divisória */}
                <div className="border-t border-white/20 mt-6 sm:mt-8 pt-4 sm:pt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-sm sm:text-sm">
                        <p className="text-white/90 text-center sm:text-left">
                            © {new Date().getFullYear()} A Rafa Criou. Todos os direitos reservados.
                        </p>
                        <a
                            href="https://dev-eduardo-phi.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/90 hover:text-white transition-colors text-center sm:text-right font-medium"
                        >
                            Desenvolvido por <span className="font-bold">Eduardo Sodré</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
