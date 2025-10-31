import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Trocas, Devoluções e Reembolsos - A Rafa Criou',
    description: 'Política de trocas, devoluções e reembolsos para produtos digitais.',
}

export default function TrocasDevolucoesPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Trocas, Devoluções e Reembolsos</h1>

            <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                    Entendemos que a satisfação do cliente é fundamental. Por isso, oferecemos uma política clara
                    de trocas e reembolsos para produtos digitais.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Produtos Digitais</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Por se tratar de produtos digitais (arquivos PDF), as trocas e devoluções seguem regras específicas:
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900">Direito de Arrependimento</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Você tem até <strong>7 dias</strong> após a compra para solicitar reembolso, conforme previsto
                    no Código de Defesa do Consumidor (Art. 49).
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900">Casos de Reembolso</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                    <li>Erro técnico no download do arquivo</li>
                    <li>Arquivo corrompido ou ilegível</li>
                    <li>Produto diferente do descrito</li>
                    <li>Cobrança duplicada</li>
                    <li>Desistência dentro do prazo de 7 dias</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900">Como Solicitar Reembolso</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
                    <li>Entre em contato através do email: <a href="mailto:arafacriou@gmail.com" className="text-[#FD9555] hover:underline">arafacriou@gmail.com</a></li>
                    <li>Informe o número do pedido e motivo da solicitação</li>
                    <li>Aguarde nossa análise (até 2 dias úteis)</li>
                    <li>Reembolso processado em até 5-7 dias úteis após aprovação</li>
                </ol>

                <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900">Importante</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                    O reembolso será feito através do mesmo método de pagamento utilizado na compra.
                    Em caso de PIX, informe seus dados bancários para transferência.
                </p>

                <div className="bg-orange-50 border-l-4 border-[#FD9555] p-4 mt-8">
                    <p className="text-sm text-gray-700">
                        <strong>Dúvidas?</strong> Entre em contato conosco através do WhatsApp
                        <a href="https://wa.me/5511998274504" className="text-[#FD9555] hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                            +55 (11) 99827-4504
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
