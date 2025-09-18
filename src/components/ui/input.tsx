import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground", 
        "flex h-9 w-full min-w-0 rounded-md border-2 border-gray-300 bg-white px-3 py-1 text-base text-gray-900 shadow-sm transition-all outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-gray-500",
        "hover:border-gray-400",
        "focus:border-primary focus:ring-2 focus:ring-primary/30",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
