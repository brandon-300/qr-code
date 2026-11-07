import * as SliderPrimitive from "@radix-ui/react-slider";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SliderProps = ComponentProps<typeof SliderPrimitive.Root>;

export function Slider({ className, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex h-11 w-full touch-none items-center select-none",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-bg">
        <SliderPrimitive.Range className="absolute h-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-labelledby={props["aria-labelledby"]}
        aria-valuetext={props["aria-valuetext"]}
        className="block size-6 rounded-full border border-border bg-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
    </SliderPrimitive.Root>
  );
}
