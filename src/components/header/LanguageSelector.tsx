'use client'

interface LanguageSelectorProps {
    selectedLanguage: string
    setSelectedLanguage: (language: string) => void
    isScrolled: boolean
}

export function LanguageSelector({ selectedLanguage, setSelectedLanguage, isScrolled }: LanguageSelectorProps) {
    return (
        <div className={`bg-[#FED466] transition-all duration-500 ease-in-out overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
            <div className="container mx-auto px-2 sm:px-4 flex justify-center items-center py-2 sm:py-3">
                <span className="text-black font-medium mr-3 sm:mr-4 text-xs sm:text-sm">Selecione seu idioma</span>
                <div className="flex bg-white/30 rounded-full p-1 backdrop-blur-sm border border-white/20 shadow-sm">
                    <button
                        onClick={() => setSelectedLanguage('Portuguese')}
                        className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 min-w-[70px] sm:min-w-[80px] cursor-pointer ${selectedLanguage === 'Portuguese'
                            ? 'bg-white text-[#FD9555] shadow-md transform scale-105'
                            : 'text-black hover:bg-white/40'
                            }`}
                    >
                        Portuguese
                    </button>
                    <button
                        onClick={() => setSelectedLanguage('Spanish')}
                        className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 min-w-[70px] sm:min-w-[80px] cursor-pointer ${selectedLanguage === 'Spanish'
                            ? 'bg-white text-[#FD9555] shadow-md transform scale-105'
                            : 'text-black hover:bg-white/40'
                            }`}
                    >
                        Spanish
                    </button>
                    <button
                        onClick={() => setSelectedLanguage('English')}
                        className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 min-w-[70px] sm:min-w-[80px] cursor-pointer ${selectedLanguage === 'English'
                            ? 'bg-white text-[#FD9555] shadow-md transform scale-105'
                            : 'text-black hover:bg-white/40'
                            }`}
                    >
                        English
                    </button>
                </div>
            </div>
        </div>
    )
}