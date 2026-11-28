import { DocsContainer, type DocsContainerProps } from "@storybook/addon-docs/blocks";
import { useEffect, useRef, useSyncExternalStore, type PropsWithChildren } from "react";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import { themes } from "storybook/theming";

/** Keep the docs shell and its inline previews on the same toolbar theme. */
export function ThemedDocsContainer({ context, children }: PropsWithChildren<DocsContainerProps>) {
  const container = useRef<HTMLDivElement>(null);
  const dark = useSyncExternalStore(
    (notify) => {
      context.channel.on(GLOBALS_UPDATED, notify);
      return () => context.channel.off(GLOBALS_UPDATED, notify);
    },
    () => {
      const [story] = context.componentStories();
      return story !== undefined && context.getStoryContext(story).globals.theme === "dark";
    },
    () => false,
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    const root = container.current;
    if (!root) return;
    // Storybook does not forward toolbar globals into iframe docs previews. Share the
    // global HTML theme class too, including when a lazy preview finishes loading.
    const frames = new Set<HTMLIFrameElement>();
    const observed = new WeakSet<HTMLElement>();
    const themeObserver = new MutationObserver(syncFrames);
    function syncFrames() {
      for (const frame of root.querySelectorAll<HTMLIFrameElement>("iframe[id^='iframe--']")) {
        if (!frames.has(frame)) {
          frames.add(frame);
          frame.addEventListener("load", syncFrames);
        }
        const html = frame.contentDocument?.documentElement;
        if (html) {
          if (!observed.has(html)) {
            observed.add(html);
            themeObserver.observe(html, { attributes: true, attributeFilter: ["class"] });
          }
          if (html.classList.contains("dark") !== dark) html.classList.toggle("dark", dark);
        }
      }
      for (const frame of frames) {
        if (!root.contains(frame)) {
          frame.removeEventListener("load", syncFrames);
          frames.delete(frame);
        }
      }
    }
    const structureObserver = new MutationObserver(syncFrames);
    structureObserver.observe(root, { childList: true, subtree: true });
    syncFrames();
    return () => {
      structureObserver.disconnect();
      themeObserver.disconnect();
      for (const frame of frames) frame.removeEventListener("load", syncFrames);
    };
  }, [dark]);
  return (
    <div ref={container}>
      <DocsContainer context={context} theme={dark ? themes.dark : themes.light}>
        {children}
      </DocsContainer>
    </div>
  );
}
