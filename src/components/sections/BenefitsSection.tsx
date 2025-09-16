import Image from 'next/image';

const benefits = [
    {
        id: 'automatico',
        title: 'AUTOMÁTICO',
        icon: '/automatico.webp',
        mobileText: 'ARQUIVO LIBERADO',
        desktopText: 'ARQUIVO LIBERADO\nAUTOMATICAMENTE APÓS\nCONFIRMAÇÃO DE PAGAMENTO'
    },
    {
        id: 'pratico',
        title: 'PRÁTICO',
        icon: '/pratico.webp',
        mobileText: 'BAIXE E MONTE',
        desktopText: 'BAIXE SEU ARQUIVO E MONTE EM CASA, NÃO PRECISA PAGAR FRETE'
    },
    {
        id: 'economico',
        title: 'ECONÔMICO',
        icon: '/economico.webp',
        mobileText: 'IMPRIMA VÁRIAS VEZES',
        desktopText: 'IMPRIMA O MESMO ARQUIVO QUANTAS VEZES QUISER'
    }
];

export default function BenefitsSection() {
    return (
        <section className="py-12 md:py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
                    {benefits.map((benefit) => (
                        <div key={benefit.id} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                            <div className="w-20 h-20 sm:w-20 sm:h-20 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 bg-[#FD9555] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 lg:mb-6 group-hover:shadow-lg transition-shadow">
                                <Image
                                    src={benefit.icon}
                                    alt={benefit.title}
                                    width={100}
                                    height={100}
                                    className="w-12 h-12 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 object-contain"
                                />
                            </div>
                            <h3 className="text-xs md:text-sm lg:text-lg xl:text-xl font-semibold text-gray-800 mb-1 sm:mb-2 md:mb-3 lg:mb-4">
                                {benefit.title}
                            </h3>
                            <p className="text-gray-600 text-center px-1 sm:px-2 md:px-3 lg:px-4 text-xs md:text-sm lg:text-sm leading-tight sm:leading-relaxed">
                                <span className="md:hidden">{benefit.mobileText}</span>
                                <span className="hidden md:inline">
                                    {benefit.desktopText.split('\n').map((line, index, array) => (
                                        <span key={index}>
                                            {line}
                                            {index < array.length - 1 && <br />}
                                        </span>
                                    ))}
                                </span>
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}