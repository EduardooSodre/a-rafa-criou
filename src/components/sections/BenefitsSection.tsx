import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export default function BenefitsSection() {
    const { t } = useTranslation('common');

    const benefits = [
        {
            id: 'automatico',
            title: t('benefits.automatico.title', 'AUTOMÁTICO'),
            icon: '/automatico.webp',
            desktopText: t('benefits.automatico.text', 'ARQUIVO LIBERADO\nAUTOMATICAMENTE\nAPÓS CONFIRMAÇÃO DE\n PAGAMENTO')
        },
        {
            id: 'pratico',
            title: t('benefits.pratico.title', 'PRÁTICO'),
            icon: '/pratico.webp',
            desktopText: t('benefits.pratico.text', 'BAIXE SEU ARQUIVO E \n MONTE EM CASA, NÃO \nPRECISA PAGAR FRETE')
        },
        {
            id: 'economico',
            title: t('benefits.economico.title', 'ECONÔMICO'),
            icon: '/economico.webp',
            desktopText: t('benefits.economico.text', 'IMPRIMA O MESMO\n ARQUIVO QUANTAS\n VEZES QUISER')
        }
    ];

    return (
        <section className="py-8 sm:py-10 md:py-12 bg-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 max-w-5xl mx-auto">
                    {benefits.map((benefit) => (
                        <div key={benefit.id} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-[#FD9555] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:shadow-lg transition-shadow">
                                <Image
                                    src={benefit.icon}
                                    alt={benefit.title}
                                    width={96}
                                    height={96}
                                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
                                />
                            </div>
                            <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-800 mb-1 sm:mb-2 md:mb-3">
                                {benefit.title}
                            </h3>
                            <p className="text-gray-600 text-center px-1 sm:px-2 md:px-3 text-[9px] sm:text-xs md:text-sm leading-tight sm:leading-normal">
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