# Form Schema

`{Page}.schema.ts` — form pages only

## Responsibility

The page's form-validation contract: a zod schema, its messages, and the form-values type
derived from it. Validation rules and their wording are UI concerns of one page, so the
file lives in that page's directory — never in `src/api/`, which stays free of UI
wording.

This is the *form's* contract. A page can also keep state in the URL, which has a
contract of its own in a separate file ([URL state](../url-state.md)); neither covers the
other, and a page may need one, both, or neither.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this page validate a form? | No → the file does not exist | — |
| Where does normalization live? | In the schema (`.trim()`). The submit handler receives the schema's **parsed output**, so it never re-normalizes | ↓ Consuming it from the component hook |
| How much does `satisfies` actually check? | Renamed field, wrong type, dropped required field → caught. A server widening an enum → **not** caught | ↓ What `satisfies` does and does not catch |
| Is this field a text input? | Any input is a controlled field. A non-text one computes its next value in a handler and calls the controller's `onChange` | ↓ Consuming it from the component hook |

## Rules

- The form-values type is `z.infer` of the schema. The schema itself is the published
  contract here, so deriving the type is the point — the named-interface rule targets
  hook contracts, not this
- Pin the schema's output to the API input type with `satisfies z.ZodType<...>`, so
  contract drift surfaces at the schema definition rather than at the submit call site
- Fields cross the hook boundary as **plain field objects**. The Component and the
  returned `{Page}ComponentState` never import react-hook-form
- The component hook consumes the schema through `zodResolver` in `onChange` mode;
  `formState.isValid` is the can-submit condition and `isSubmitting` the in-flight flag

```ts
// ReportForm/ReportForm.schema.ts
import { z } from "zod";
import type { CreateReportInput } from "@api/Report.api";

export const reportFormSchema = z.object({
  name: z.string().trim().min(1, "Report name is required"),
  teamIds: z.array(z.string()).min(1, "Select at least one team"),
}) satisfies z.ZodType<CreateReportInput>;

export type ReportFormValues = z.infer<typeof reportFormSchema>;
```

## What `satisfies` does and does not catch

It asserts that the schema's output is *assignable to* the API input — so it catches a
renamed field, a wrong type, a dropped required field.

It does **not** catch the server **widening** a union, because a narrower type is
assignable to a wider one: add `archived` to a status enum server-side and a schema
listing only the old three still compiles. The frontend narrowing the server's options is
legitimate and common — a select whose choices depend on another field — which is exactly
why the check cannot flag it.

New members reach the UI only when someone adds them by hand. A contract change that
widens an enum is a manual follow-up, not a compiler-caught one. The URL schema's
`satisfies` has the same limit, and [URL state](../url-state.md) covers what makes it
harmless there.

## Consuming it from the component hook

The library's `formState` replaces hand-written form mechanics, and the submit handler
receives the schema's parsed output — so `name` arrives already trimmed.

```ts
// ReportForm/ReportForm.component.hook.ts (excerpt)
export interface ReportFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

const {
  control,
  handleSubmit: rhfHandleSubmit,
  reset,
  formState: { isValid, isSubmitting },
} = useForm<ReportFormValues>({
  resolver: zodResolver(reportFormSchema),
  mode: "onChange",
  defaultValues: { name: "", teamIds: [] },
});

const nameCtrl = useController({ name: "name", control });
const nameField: ReportFormField = {
  value: nameCtrl.field.value,
  onChange: (v) => nameCtrl.field.onChange(v),
  onBlur: nameCtrl.field.onBlur,
  error: nameCtrl.fieldState.error?.message,
};

// The parsed output — `name` arrives already trimmed.
const onSubmit = useCallback(
  async (data: ReportFormValues) => {
    const created = await addReport(data);
    reset({ name: "", teamIds: [] });
    onSaved(created);
  },
  [addReport, reset, onSaved],
);
```

A non-text input is still a controlled field: ReportForm's team checkboxes drive a
`teamIds: string[]` field through a `toggleTeam(id)` handler that computes the next array
and calls the controller's `onChange`.

`zod` and `react-hook-form` are not scaffolded — add them with the first form page
([Setup](../setup.md)).
