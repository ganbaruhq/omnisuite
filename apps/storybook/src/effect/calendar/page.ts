import type { Html } from "@effect/ui/html";
import { FrontDesk } from "./front-desk";
import { frontDeskProps, housekeepingProps } from "./props";

/** Each workspace mount owns independent event-window and resource query clients. */
export const CalendarPage = <Msg>(h: Html.H<Msg>) =>
  h.div
    .class("space-y-6 p-4 sm:p-8")
    .children(
      FrontDesk(h, { props: frontDeskProps() }),
      FrontDesk(h, { key: "housekeeping", props: housekeepingProps() }),
    );
