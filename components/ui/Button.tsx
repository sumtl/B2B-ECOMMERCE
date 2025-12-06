import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary: Black background - main actions (Checkout, Add to Cart, Submit, Create, Save, Order)
        primary:
          "bg-black text-white hover:bg-gray-800 focus-visible:ring-black",

        // Secondary: Gray background - less important actions (Back, Cancel, Continue Shopping, View Details)
        secondary:
          "bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:ring-gray-400",

        // Danger: Red background - destructive actions (Delete, Remove, Cancel Order)
        danger:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",

        // Ghost: Transparent - minimal/link-style actions
        ghost: "hover:bg-gray-100 text-gray-900 focus-visible:ring-gray-400",

        // Outline: Border style - secondary option
        outline:
          "border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 focus-visible:ring-gray-400",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6 py-2 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  fullWidth = false,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    fullWidth?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        fullWidth && "w-full"
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
