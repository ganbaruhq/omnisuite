import { Data, Result, Schema, SchemaIssue } from "effect";

export interface TimelineInputIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

/** The timeline input breaks the structural rules; `issues` locate each problem. */
export class TimelineInputError extends Data.TaggedError("TimelineInputError")<{
  readonly message: string;
  readonly issues: readonly TimelineInputIssue[];
}> {}

const formatIssue = SchemaIssue.makeFormatterStandardSchemaV1();

export function inputError(issues: readonly TimelineInputIssue[]) {
  const [first] = issues;
  return new TimelineInputError({
    message: first
      ? `Invalid timeline input at ${first.path.join(".") || "root"}: ${first.message}`
      : "Invalid timeline input.",
    issues,
  });
}

/** Decodes untrusted input, reporting every issue found rather than the first. */
export function decodeInput<S extends Schema.Decoder<unknown>>(
  schema: S,
  input: unknown,
): Result.Result<S["Type"], TimelineInputError> {
  const decoded = Schema.decodeUnknownResult(schema)(input, { errors: "all" });
  if (Result.isSuccess(decoded)) return Result.succeed(decoded.success);
  return Result.fail(
    inputError(
      formatIssue(decoded.failure.issue).issues.map(({ path, message }) => ({
        path: (path ?? []).map((segment) => (typeof segment === "object" ? segment.key : segment)),
        message,
      })),
    ),
  );
}
