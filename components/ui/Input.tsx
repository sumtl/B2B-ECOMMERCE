import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full rounded border border-gray-200 bg-white px-3 py-2 text-base placeholder:text-gray-400 transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0",
        className
      )}
      {...props}
    />
  );
}

export { Input };
