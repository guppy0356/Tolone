import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BookComponent } from "./Book.component";

test("registers a book from its ISBN-13", async () => {
  const registerBook = vi.fn().mockResolvedValue(undefined);
  const screen = await render(<BookComponent registerBook={registerBook} />);

  await screen.getByLabelText("ISBN-13").fill("9784873119045");
  await screen.getByRole("button", { name: "Register" }).click();

  expect(registerBook).toHaveBeenCalledWith({ isbn13: "9784873119045" });
  await expect.element(screen.getByRole("status")).toHaveTextContent("Registered.");
});

test("keeps the form from submitting until the ISBN-13 has 13 digits", async () => {
  const registerBook = vi.fn().mockResolvedValue(undefined);
  const screen = await render(<BookComponent registerBook={registerBook} />);

  await screen.getByLabelText("ISBN-13").fill("123");

  await expect
    .element(screen.getByText("An ISBN-13 is 13 digits"))
    .toBeVisible();
  expect(registerBook).not.toHaveBeenCalled();
});
