'use client';

/**
 * Página de Checkout PIX (Stripe)
 * 
 * Exibe instruções para pagamento PIX via Stripe
 * NOTA: PIX só funciona em produção com conta Stripe brasileira ativada
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, QrCode } from 'lucide-react';

interface PixData {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

export default function CheckoutPixPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pixData, setPixData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCreatedPayment, setHasCreatedPayment] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Dados do cliente
  const email = searchParams.get('email') || '';
  const name = searchParams.get('name') || '';

  // Criar Payment Intent PIX
  const createPixPayment = useCallback(async () => {
    if (hasCreatedPayment) {
      return;
    }

    try {
      setLoading(true);
      setHasCreatedPayment(true);

      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

      if (cartItems.length === 0) {
        router.push('/carrinho');
        return;
      }

      const response = await fetch('/api/stripe/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          email,
          name,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pagamento PIX');
      }

      const data: PixData = await response.json();
      setPixData(data);
      
      setLoading(false);

      // Iniciar polling de status
      startPolling(data.paymentIntentId);

    } catch {
      setError('Erro ao gerar QR Code PIX. Tente novamente.');
      setLoading(false);
      setHasCreatedPayment(false); // Permitir tentar novamente em caso de erro
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, name, router, hasCreatedPayment]);

  useEffect(() => {
    if (!email || !name) {
      router.push('/carrinho');
      return;
    }

    if (!hasCreatedPayment) {
      createPixPayment();
    }

    // Cleanup: parar polling quando componente desmontar
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [email, name, router, createPixPayment, hasCreatedPayment, pollingInterval]);

  // Iniciar polling
  const startPolling = (paymentIntentId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/stripe/payment-status?id=${paymentIntentId}`);
        const data = await response.json();

        if (data.status === 'succeeded') {
          clearInterval(interval);
          setPollingInterval(null);
          setPaid(true);
          
          // Limpar carrinho
          localStorage.removeItem('cart');

          // Redirecionar com payment_intent na URL (igual ao cartão)
          setTimeout(() => {
            router.push(`/obrigado?payment_intent=${paymentIntentId}&payment_intent_client_secret=${pixData?.clientSecret}`);
          }, 1000);
        }

      } catch {
        // Silencioso em produção
      }
    }, 3000); // Verificar a cada 3 segundos

    setPollingInterval(interval);

    // Timeout após 5 minutos
    setTimeout(() => {
      clearInterval(interval);
      setPollingInterval(null);
    }, 5 * 60 * 1000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#FED466]" />
        <p className="mt-4 text-gray-600">Gerando QR Code PIX...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/carrinho')} className="w-full">
              Voltar ao Carrinho
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h1>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <QrCode className="w-12 h-12 text-[#FED466]" />
          </div>
          <CardTitle className="text-2xl">Pagamento PIX em Processamento</CardTitle>
          <CardDescription>
            Seu pagamento foi iniciado e está aguardando confirmação
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Valor */}
          <div className="text-center">
            <p className="text-sm text-gray-500">Valor a pagar</p>
            <p className="text-3xl font-bold text-[#FD9555]">
              R$ {pixData?.amount.toFixed(2)}
            </p>
          </div>

          {/* Aviso sobre PIX */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Pagamento PIX - Stripe
            </h3>
            <p className="text-sm text-orange-800">
              O pagamento via PIX está sendo processado pela Stripe. 
              Você receberá as instruções de pagamento por e-mail em instantes.
            </p>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Próximos passos:</h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Verifique seu e-mail <strong>{email}</strong></li>
              <li>Você receberá as instruções de pagamento PIX da Stripe</li>
              <li>Escaneie o QR Code ou copie o código PIX</li>
              <li>Realize o pagamento no app do seu banco</li>
              <li>Após confirmação, você será redirecionado automaticamente</li>
            </ol>
          </div>

          {/* Status */}
          <div className="text-center text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
            Aguardando confirmação do pagamento...
          </div>

          {/* Informação sobre Payment Intent */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 text-center">
              ID do Pagamento: <code className="bg-gray-200 px-2 py-1 rounded">{pixData?.paymentIntentId}</code>
            </p>
          </div>

          {/* Botão Cancelar */}
          <Button
            onClick={() => router.push('/carrinho')}
            variant="outline"
            className="w-full"
          >
            Cancelar e voltar ao carrinho
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
