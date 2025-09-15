'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react'

export default function ContatoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Entre em Contato
          </h1>
          <p className="text-gray-600 text-lg">
            Estamos aqui para ajudar! Escolha a melhor forma de falar conosco.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>E-mail</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Para dúvidas sobre produtos ou suporte técnico
              </p>
              <Button asChild variant="outline" className="w-full">
                <a href="mailto:suporte@arafacriou.com.br">
                  suporte@arafacriou.com.br
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Atendimento rápido de segunda a sexta, 9h às 18h
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
              <CardTitle>Telefone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Atendimento telefônico de segunda a sexta
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
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                São Paulo, SP - Brasil<br />
                Atendimento 100% digital
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button asChild className="bg-primary hover:bg-secondary text-black">
            <Link href="/produtos">
              Voltar aos Produtos
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}