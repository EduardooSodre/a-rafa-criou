import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Política de Privacidade - A Rafa Criou',
    description: 'Política de privacidade e proteção de dados.',
}

export default function PrivacidadePage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Política de Privacidade</h1>

            <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                    A <strong>A Rafa Criou</strong> respeita sua privacidade e está comprometida em proteger seus dados pessoais.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Informações Coletadas</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Coletamos as seguintes informações:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                    <li>Nome completo</li>
                    <li>E-mail</li>
                    <li>Dados de pagamento (processados com segurança por nossos parceiros)</li>
                    <li>Histórico de compras</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Uso das Informações</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Utilizamos seus dados para:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                    <li>Processar e entregar seus pedidos</li>
                    <li>Enviar atualizações sobre seus produtos</li>
                    <li>Melhorar nossos serviços</li>
                    <li>Comunicar promoções (com seu consentimento)</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Segurança</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                    Utilizamos criptografia SSL de 256 bits e parceiros certificados para processar pagamentos.
                    Seus dados nunca são compartilhados com terceiros sem autorização.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Seus Direitos (LGPD)</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                    <li>Acessar seus dados pessoais</li>
                    <li>Corrigir dados incompletos ou desatualizados</li>
                    <li>Solicitar exclusão de seus dados</li>
                    <li>Revogar consentimento a qualquer momento</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Cookies</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                    Utilizamos cookies para melhorar sua experiência de navegação. Você pode desativá-los
                    nas configurações do seu navegador.
                </p>

                <div className="bg-orange-50 border-l-4 border-[#FD9555] p-4 mt-8">
                    <p className="text-sm text-gray-700">
                        <strong>Contato:</strong> Para exercer seus direitos ou tirar dúvidas sobre privacidade,
                        entre em contato através do email: <a href="mailto:arafacriou@gmail.com" className="text-[#FD9555] hover:underline">arafacriou@gmail.com</a>
                    </p>
                </div>
            </div>
        </div>
    )
}
