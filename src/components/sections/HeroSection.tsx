import Image from 'next/image';

export default function HeroSection() {
    return (
        <section className="relative w-full flex items-center justify-center bg-[#F4F4F4] overflow-hidden">
            <div className="relative w-full max-w-none">
                <Image
                    src="/Banner_principal.gif"
                    alt="Hero Background Animation"
                    width={1920}
                    height={600}
                    className="w-full h-auto block min-h-[240px] md:min-h-[400px] object-cover transform scale-110 sm:scale-105 md:scale-108 lg:scale-108 xl:scale-100"
                    priority
                    unoptimized={true}
                    quality={100}
                    style={{
                        maxWidth: '100%',
                        height: 'auto',
                        display: 'block'
                    }}
                />

                {/* Texto sobreposto ao GIF */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <h1
                        className="font-scripter text-2xl sm:text-3xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-3 sm:mb-4 md:mb-5 lg:mb-5 xl:mb-6 uppercase text-center"
                        style={{
                            color: '#FD9555',
                            fontFamily: 'Scripter, sans-serif',
                        }}
                    >
                        BEM-VINDA <br /> OVELHINHA!
                    </h1>

                    <p
                        className="text-[#FD9555] text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl max-w-xs sm:max-w-md md:max-w-lg lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl leading-relaxed text-center mx-auto"
                        style={{
                            fontFamily: 'Times New Roman, serif',
                        }}
                    >
                        Descubra uma coleção de arquivos<br />
                        teocráticos digitais para ajudar você<br />
                        a dar seu melhor a Jeová!
                    </p>
                </div>
            </div>
        </section>
    );
}