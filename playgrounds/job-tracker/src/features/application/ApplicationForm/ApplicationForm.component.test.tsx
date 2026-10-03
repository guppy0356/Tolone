import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { RouterProvider } from "@tanstack/react-router";
import type { ApplicationFormContainerState } from "./ApplicationForm.container.hook";
import { createApplicationRouter } from "../../../test/application-router";
import { ApplicationFormComponent } from "./ApplicationForm.component";

const created = {
  id: "a9",
  companyId: "c1",
  companyName: "Acme",
  position: "Frontend Engineer",
  status: "applied" as const,
  appliedAt: "2026-09-01",
  notes: "",
};

async function renderForm(props: Partial<ApplicationFormContainerState> = {}) {
  const router = createApplicationRouter({
    initialUrl: "/applications/new",
    children: (
      <ApplicationFormComponent
        companies={[{ id: "c1", name: "Acme" }]}
        companyKeyword="Ac"
        setCompanyKeyword={vi.fn()}
        isFetching={false}
        addApplication={vi.fn(async () => created)}
        {...props}
      />
    ),
  });
  return { router, screen: await render(<RouterProvider router={router} />) };
}

test("cannot submit until every required field is valid", async () => {
  const { screen } = await renderForm();
  const save = screen.getByRole("button", { name: "Save application" });
  await expect.element(save).toBeDisabled();

  await screen.getByLabelText("Position").fill("x");
  await screen.getByLabelText("Position").fill("");
  await expect.element(screen.getByText("Position is required")).toBeVisible();
});

test("submits the parsed values and navigates to the new application", async () => {
  const addApplication = vi.fn(async () => created);
  const { router, screen } = await renderForm({ addApplication });

  await screen.getByLabelText("Company").click();
  await screen.getByRole("option", { name: "Acme" }).click();
  await screen.getByLabelText("Position").fill("  Frontend Engineer  ");
  await screen.getByLabelText("Applied on").fill("2026-09-01");
  await screen.getByRole("button", { name: "Save application" }).click();

  await vi.waitFor(() =>
    expect(addApplication).toHaveBeenCalledWith({
      companyId: "c1",
      position: "Frontend Engineer",
      appliedAt: "2026-09-01",
      notes: "",
    }),
  );
  await vi.waitFor(() => expect(router.state.location.pathname).toBe("/applications/a9"));
});
