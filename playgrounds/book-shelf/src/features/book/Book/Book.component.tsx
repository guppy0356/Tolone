import { useBookComponent } from "./Book.component.hook";
import type { BookContainerState } from "./Book.container.hook";

export function BookComponent({ registerBook }: BookContainerState) {
  const { isbn13Field, canSubmit, isSubmitting, isRegistered, handleSubmit } =
    useBookComponent({ registerBook });

  return (
    <section className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">Register a book</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-2"
      >
        <label htmlFor="isbn13" className="block text-sm font-medium">
          ISBN-13
        </label>
        <input
          id="isbn13"
          type="text"
          inputMode="numeric"
          value={isbn13Field.value}
          onChange={(e) => isbn13Field.onChange(e.target.value)}
          onBlur={isbn13Field.onBlur}
          placeholder="9784873119045"
          className="w-full rounded border px-3 py-2"
        />
        {isbn13Field.error && (
          <p className="text-sm text-red-600">{isbn13Field.error}</p>
        )}
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-300"
        >
          {isSubmitting ? "Registering…" : "Register"}
        </button>
      </form>

      {isRegistered && (
        <p role="status" className="mt-4 text-sm text-green-700">
          Registered.
        </p>
      )}
    </section>
  );
}
