import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Sobre - A Rafa Criou',
    description: 'Conheça a A Rafa Criou, sua loja de produtos digitais em PDF.',
}

export default function SobrePage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Sobre a A Rafa Criou</h1>
            
            <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                    Bem-vindo à <strong>A Rafa Criou</strong>, sua loja especializada em produtos digitais de alta qualidade!
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Nossa História</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                    Nascemos da paixão por criar e compartilhar conteúdo digital que facilita o dia a dia das pessoas. 
                    Nossos produtos são desenvolvidos com carinho e atenção aos detalhes para ajudar você a organizar, 
                    planejar e realizar seus projetos.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">O Que Oferecemos</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                    <li>Planners e agendas digitais</li>
                    <li>Templates e organizadores</li>
                    <li>Materiais educativos</li>
                    <li>E muito mais!</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Nosso Compromisso</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                    Trabalhamos constantemente para oferecer produtos de qualidade com o melhor atendimento ao cliente. 
                    Sua satisfação é nossa prioridade!
                </p>
            </div>
        </div>
    )
}
