import { memo } from "react";
import {
  useFamilyTodoFormPresenter,
  type FamilyTodoFormProps,
} from "./FamilyTodoForm.presenter";

export const FamilyTodoForm = memo(function FamilyTodoForm(
  props: FamilyTodoFormProps,
) {
  const { newTitle, setNewTitle, handleSubmit } =
    useFamilyTodoFormPresenter(props);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="mb-4 flex gap-2"
    >
      <input
        type="text"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="flex-1 rounded border px-3 py-2"
      />
      <button
        type="submit"
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Add
      </button>
    </form>
  );
});
