import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "flex min-h-16 w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm transition-all outline-none resize-y",
                "placeholder:text-gray-500",
                "hover:border-gray-400",
                "focus:border-primary focus:ring-2 focus:ring-primary/30",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
                "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
                "md:text-sm",
                className
            )}
            {...props}
        />
    )
}

export { Textarea }
