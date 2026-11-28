import { BrowserHost } from "@effect/ui/html";
import { useCallback, useState } from "react";
import { FrontDesk, type SampleProposal } from "./calendar/front-desk";
import { frontDeskProps, type BoardProps } from "./calendar/props";
import { EffectMount } from "./effect-mount";

export function CalendarExample({
  boardProps,
  createProps = frontDeskProps,
  onProposal,
}: {
  readonly boardProps?: BoardProps;
  readonly createProps?: () => BoardProps;
  readonly onProposal?: (proposal: SampleProposal) => void;
}) {
  const [initialProps] = useState(createProps);
  const mount = useCallback(
    (element: HTMLElement) =>
      BrowserHost.mount(FrontDesk, boardProps ?? initialProps, element, {
        onEmit: (event) => onProposal?.(event.proposal),
      }),
    [boardProps, initialProps, onProposal],
  );
  return <EffectMount mount={mount} />;
}
