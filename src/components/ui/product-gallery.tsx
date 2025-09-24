import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
    images: string[];
    alt: string;
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
    const [selected, setSelected] = React.useState(0);
    const [zoom, setZoom] = React.useState(false);

    return (
        <div className="w-full">
            <div
                className={cn(
                    "relative aspect-square overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center cursor-zoom-in group",
                    zoom && "fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-zoom-out"
                )}
                onClick={() => setZoom((z) => !z)}
                aria-label={zoom ? "Fechar zoom" : "Ampliar imagem"}
            >
                <Image
                    src={Array.isArray(images) && images.length > 0 && images[selected] ? images[selected] : "/file.svg"}
                    alt={alt}
                    width={zoom ? 900 : 600}
                    height={zoom ? 900 : 600}
                    className={cn(
                        "object-contain transition-all duration-300",
                        zoom ? "max-h-[90vh] max-w-[90vw] shadow-2xl" : "w-full h-full"
                    )}
                    priority
                />
                {zoom && (
                    <button
                        className="absolute top-4 right-4 bg-white/80 rounded-full p-2 shadow-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            setZoom(false);
                        }}
                        aria-label="Fechar zoom"
                    >
                        <span className="text-lg font-bold">×</span>
                    </button>
                )}
            </div>
            {Array.isArray(images) && images.length > 1 && (
                <div className="flex gap-2 mt-3 justify-center">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            className={cn(
                                "aspect-square w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                                selected === i ? "border-primary scale-105" : "border-gray-200 opacity-80 hover:opacity-100"
                            )}
                            onClick={() => setSelected(i)}
                            aria-label={`Selecionar imagem ${i + 1}`}
                        >
                            <Image
                                src={img}
                                alt={alt + ` miniatura ${i + 1}`}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
