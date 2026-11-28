import { afterEach, beforeEach, expect, vi } from "vite-plus/test";

let failures: string[];
beforeEach(() => {
  failures = [];
  for (const method of ["log", "warn", "error"] as const) {
    const original = console[method].bind(console);
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      const line = args.map(String).join(" ");
      if (/ failed /.test(line)) failures.push(line);
      original(...args);
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  expect(failures).toEqual([]);
});
