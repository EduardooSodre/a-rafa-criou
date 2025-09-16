import Image from 'next/image';

const benefits = [
    {
        id: 'automatico',
        title: 'AUTOMÁTICO',
        icon: '/automatico.webp',
        desktopText: 'ARQUIVO LIBERADO\nAUTOMATICAMENTE APÓS\nCONFIRMAÇÃO DE PAGAMENTO'
    },
    {
        id: 'pratico',
        title: 'PRÁTICO',
        icon: '/pratico.webp',
        desktopText: 'BAIXE SEU ARQUIVO E MONTE EM CASA, NÃO PRECISA PAGAR FRETE'
    },
    {
        id: 'economico',
        title: 'ECONÔMICO',
        icon: '/economico.webp',
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
                            <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-22 lg:h-22 xl:w-24 xl:h-24 bg-[#FD9555] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 lg:mb-6 group-hover:shadow-lg transition-shadow">
                                <Image
                                    src={benefit.icon}
                                    alt={benefit.title}
                                    width={140}
                                    height={140}
                                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 object-contain"
                                />
                            </div>
                            <h3 className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 md:mb-3 lg:mb-4">
                                {benefit.title}
                            </h3>
                            <p className="text-gray-600 text-center px-1 sm:px-2 md:px-3 lg:px-4 text-xs sm:text-xs md:text-sm lg:text-base leading-tight sm:leading-normal md:leading-relaxed">
                                {benefit.desktopText.split('\n').map((line, index, array) => (
                                    <span key={index}>
                                        {line}
                                        {index < array.length - 1 && <br />}
                                    </span>
                                ))}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}