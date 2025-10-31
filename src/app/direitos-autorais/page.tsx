import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Direitos Autorais - A Rafa Criou',
    description: 'Informações sobre direitos autorais e uso dos produtos digitais.',
}

export default function DireitosAutoraisPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Direitos Autorais</h1>
            
            <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                    Todos os produtos digitais disponibilizados pela <strong>A Rafa Criou</strong> são protegidos por direitos autorais.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Uso Permitido</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Ao adquirir nossos produtos digitais, você tem direito a:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                    <li>Uso pessoal ilimitado do material adquirido</li>
                    <li>Imprimir para uso próprio</li>
                    <li>Utilizar em seus projetos pessoais</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Uso Proibido</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    É expressamente proibido:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                    <li>Revender, redistribuir ou compartilhar os arquivos</li>
                    <li>Modificar e comercializar como produto próprio</li>
                    <li>Disponibilizar em sites de compartilhamento</li>
                    <li>Utilizar para fins comerciais sem autorização</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">Proteção Legal</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                    Todos os nossos produtos são protegidos pela Lei de Direitos Autorais (Lei nº 9.610/98). 
                    O uso indevido está sujeito às penalidades previstas em lei.
                </p>

                <div className="bg-orange-50 border-l-4 border-[#FD9555] p-4 mt-8">
                    <p className="text-sm text-gray-700">
                        <strong>Importante:</strong> Respeitar os direitos autorais é fundamental para que possamos continuar 
                        criando e oferecendo produtos de qualidade. Agradecemos sua compreensão e colaboração!
                    </p>
                </div>
            </div>
        </div>
    )
}
