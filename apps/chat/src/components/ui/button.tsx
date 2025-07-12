import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 relative group overflow-hidden active:scale-[0.98] active:duration-75 active:ease-in-out",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-orange-500 to-orange-600 border border-orange-700 shadow-md text-white hover:opacity-95 transition-opacity duration-200",
        primary:
          "bg-[length:100%_200%] bg-[position:0%_0%] bg-gradient-to-b from-orange-500 dark:from-orange-600 to-orange-600 dark:to-orange-700 border border-orange-600 shadow-sm text-white hover:bg-[position:0%_100%] transition-all ",
        green:
          "bg-gradient-to-b dark:from-green-700 dark:to-green-800 from-green-400 to-green-500 border dark:border-green-600 border-green-400 shadow-md text-white hover:opacity-95 transition-opacity duration-200",
        foreground:
          "bg-foreground text-background border border-gray-300 shadow transition-opacity duration-200 hover:opacity-80",
        destructive:
          "bg-red-500 text-destructive-foreground hover:bg-red-600 border-destructive border",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        outlineDestructive:
          "border border-red-500 bg-transparent hover:bg-red-500/10 hover:text-red-500 text-red-500",
        secondary:
          "bg-secondary border border-input text-secondary-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "size-8",
        xs: "h-7 px-2 text-xs",
        us: "h-6 px-1.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size, asChild = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    if (asChild) {
      // When using asChild, we can't add additional children
      return (
        <Comp
          className={cn(
            buttonVariants({ variant, size, className }),
            variant === "default" ? "group relative overflow-hidden" : "",
          )}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {variant === "default" && (
          <span className="absolute inset-0 h-[40%] bg-gradient-to-b from-white/60 to-transparent transition-all duration-300 group-hover:h-[50%]"></span>
        )}
        {props.children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
