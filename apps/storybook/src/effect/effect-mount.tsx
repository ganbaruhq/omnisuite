import { Effect, Fiber, Layer } from "effect";
import { useEffect, useRef } from "react";

export type EffectMountProps = {
  readonly mount: (element: HTMLElement) => Layer.Layer<never>;
};

/** Owns the Effect runtime for exactly as long as React keeps this story mounted. */
export function EffectMount({ mount }: EffectMountProps) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (container.current === null) return;
    const fiber = Effect.runFork(Layer.launch(mount(container.current)));
    return () => {
      Effect.runFork(Fiber.interrupt(fiber));
    };
  }, [mount]);
  return <div ref={container} data-effect-story className="w-full" />;
}
