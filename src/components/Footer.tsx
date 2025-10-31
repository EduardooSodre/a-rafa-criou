'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Mail, Phone, Shield } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-gradient-to-br from-[#FD9555] to-[#FED466] text-white mt-auto">
            <div className="container mx-auto px-4 py-8 sm:py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Logo e Descrição */}
                    <div className="flex flex-col items-center md:items-start">
                        <Link href="/" className="mb-4">
                            <Image
                                src="/logo.webp"
                                alt="A Rafa Criou"
                                width={180}
                                height={60}
                                className="h-auto w-auto max-w-[180px]"
                                priority
                            />
                        </Link>
                        <p className="text-white/90 text-sm text-center md:text-left leading-relaxed">
                            Produtos digitais de qualidade para facilitar seu dia a dia.
                        </p>
                    </div>

                    {/* Links Importantes */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="font-bold text-lg mb-4">Institucional</h3>
                        <nav className="flex flex-col space-y-2 text-center md:text-left">
                            <Link 
                                href="/sobre" 
                                className="text-white/90 hover:text-white transition-colors text-sm"
                            >
                                Sobre
                            </Link>
                            <Link 
                                href="/direitos-autorais" 
                                className="text-white/90 hover:text-white transition-colors text-sm"
                            >
                                Direitos Autorais
                            </Link>
                            <Link 
                                href="/trocas-devolucoes" 
                                className="text-white/90 hover:text-white transition-colors text-sm"
                            >
                                Trocas, Devoluções e Reembolsos
                            </Link>
                            <Link 
                                href="/privacidade" 
                                className="text-white/90 hover:text-white transition-colors text-sm"
                            >
                                Política de Privacidade
                            </Link>
                        </nav>
                    </div>

                    {/* Contato */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="font-bold text-lg mb-4">Contato</h3>
                        <div className="flex flex-col space-y-3 text-center md:text-left">
                            <a 
                                href="https://wa.me/5511998274504" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm justify-center md:justify-start"
                            >
                                <Phone className="w-4 h-4" />
                                +55 (11) 99827-4504
                            </a>
                            <a 
                                href="mailto:arafacriou@gmail.com"
                                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm justify-center md:justify-start"
                            >
                                <Mail className="w-4 h-4" />
                                arafacriou@gmail.com
                            </a>
                            <div className="flex items-center gap-2 text-white/90 text-sm justify-center md:justify-start">
                                <MapPin className="w-4 h-4" />
                                Guarulhos - SP
                            </div>
                        </div>
                    </div>

                    {/* Pagamentos e Segurança */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="font-bold text-lg mb-4">Pagamento Seguro</h3>
                        
                        {/* Métodos de Pagamento */}
                        <div className="mb-4">
                            <p className="text-xs text-white/80 mb-2 text-center md:text-left">Aceitamos:</p>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {/* Stripe */}
                                <div className="bg-white rounded px-2 py-1 flex items-center gap-1">
                                    <Image 
                                        src="/payments/visa.svg" 
                                        alt="Visa" 
                                        width={32} 
                                        height={20}
                                        className="h-5 w-auto"
                                    />
                                </div>
                                <div className="bg-white rounded px-2 py-1 flex items-center gap-1">
                                    <Image 
                                        src="/payments/mastercard.svg" 
                                        alt="Mastercard" 
                                        width={32} 
                                        height={20}
                                        className="h-5 w-auto"
                                    />
                                </div>
                                <div className="bg-white rounded px-2 py-1 flex items-center gap-1">
                                    <Image 
                                        src="/payments/amex.svg" 
                                        alt="American Express" 
                                        width={32} 
                                        height={20}
                                        className="h-5 w-auto"
                                    />
                                </div>
                                
                                {/* PIX - Mercado Pago */}
                                <div className="bg-white rounded px-2 py-1 flex items-center gap-1">
                                    <Image 
                                        src="/payments/pix.svg" 
                                        alt="PIX" 
                                        width={32} 
                                        height={20}
                                        className="h-5 w-auto"
                                    />
                                </div>
                                
                                {/* PayPal */}
                                <div className="bg-white rounded px-2 py-1 flex items-center gap-1">
                                    <Image 
                                        src="/payments/paypal.svg" 
                                        alt="PayPal" 
                                        width={32} 
                                        height={20}
                                        className="h-5 w-auto"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Selo de Segurança */}
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                            <Shield className="w-5 h-5 text-green-300" />
                            <div>
                                <p className="text-xs font-semibold">Site Seguro</p>
                                <p className="text-[10px] text-white/80">Criptografia SSL 256-bit</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Linha divisória */}
                <div className="border-t border-white/20 mt-8 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                        <p className="text-white/90 text-center md:text-left">
                            © {new Date().getFullYear()} A Rafa Criou. Todos os direitos reservados.
                        </p>
                        <a 
                            href="https://dev-eduardo-phi.vercel.app/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-white/90 hover:text-white transition-colors text-center md:text-right"
                        >
                            Desenvolvido por <span className="font-semibold">Eduardo Sodré</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
