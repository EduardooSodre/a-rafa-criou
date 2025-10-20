"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ContatoPage() {
    const { t } = useTranslation('common');
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {t('contact.title')}
                    </h1>
                    <p className="text-gray-600 text-lg">
                        {t('contact.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="text-center">
                        <CardHeader>
                            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                            <CardTitle>{t('contact.email', 'E-mail')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 mb-4">
                                {t('contact.subtitle')}
                            </p>
                            <Button asChild variant="outline" className="w-full">
                                <a href="mailto:arafacriou@gmail.com">
                                    arafacriou@gmail.com
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="text-center">
                        <CardHeader>
                            <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
                            <CardTitle>{t('contact.whatsapp', 'WhatsApp')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 mb-4">
                                {t('contact.whatsappHours', 'Atendimento rápido de segunda a sexta, 9h às 18h')}
                            </p>
                            <Button asChild variant="outline" className="w-full">
                                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener">
                                    (11) 99999-9999
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="text-center">
                        <CardHeader>
                            <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
                            <CardTitle>{t('contact.phone', 'Telefone')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 mb-4">
                                {t('contact.phoneHours', 'Atendimento telefônico de segunda a sexta')}
                            </p>
                            <Button asChild variant="outline" className="w-full">
                                <a href="tel:+551140000000">
                                    (11) 4000-0000
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-12 text-center">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2">
                                <MapPin className="w-5 h-5" />
                                {t('contact.address', 'Endereço')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                {t('contact.addressLine1', 'São Paulo, SP - Brasil')}<br />
                                {t('contact.digitalSupport', 'Atendimento 100% digital')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8 text-center">
                    <Button asChild className="bg-primary hover:bg-secondary text-black">
                        <Link href="/produtos">
                            {t('contact.backToProducts')}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}