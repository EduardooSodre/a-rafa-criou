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
                    className="w-full h-auto md:h-auto block min-h-[240px] md:min-h-0 object-cover md:object-contain"
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
                        className="font-scripter text-2xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bold mb-4 md:mb-6 uppercase text-center"
                        style={{
                            color: '#FD9555',
                            fontFamily: 'Scripter, sans-serif',
                        }}
                    >
                        BEM-VINDA <br /> OVELHINHA!
                    </h1>

                    <p
                        className="text-[#FD9555] text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl leading-relaxed text-center mx-auto"
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