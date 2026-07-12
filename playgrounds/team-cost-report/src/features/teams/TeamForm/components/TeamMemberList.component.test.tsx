import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { PickedMember } from "../TeamForm.component.hook";
import {
  TeamMemberList,
  type TeamMemberListProps,
} from "./TeamMemberList.component";

const picked: PickedMember[] = [
  { memberId: "m1", name: "Ada Lovelace", hourlyRate: 120, rateError: undefined },
  { memberId: "m2", name: "Alan Turing", hourlyRate: 0, rateError: undefined },
];

async function renderList(overrides: Partial<TeamMemberListProps> = {}) {
  const props: TeamMemberListProps = {
    picked,
    onRateChange: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  };
  const screen = await render(
    <TeamMemberList
      picked={props.picked}
      onRateChange={props.onRateChange}
      onRemove={props.onRemove}
    />,
  );
  return { screen, props };
}

test("renders nothing when no members are picked", async () => {
  const { screen } = await renderList({ picked: [] });

  expect(screen.container.childElementCount).toBe(0);
});

test("renders a row per member; an unset rate shows an empty input", async () => {
  const { screen } = await renderList();

  await expect.element(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  await expect
    .element(screen.getByLabelText("Hourly rate for Ada Lovelace"))
    .toHaveValue(120);
  await expect
    .element(screen.getByLabelText("Hourly rate for Alan Turing"))
    .toHaveValue(null);
});

test("reports rate edits as numbers", async () => {
  const { screen, props } = await renderList();

  await screen.getByLabelText("Hourly rate for Ada Lovelace").fill("150");

  expect(props.onRateChange).toHaveBeenLastCalledWith("m1", 150);
});

test("reports a cleared rate as 0", async () => {
  const { screen, props } = await renderList();

  await screen.getByLabelText("Hourly rate for Ada Lovelace").fill("");

  expect(props.onRateChange).toHaveBeenLastCalledWith("m1", 0);
});

test("reports the removal of a member", async () => {
  const { screen, props } = await renderList();

  await screen.getByRole("button", { name: "Remove Ada Lovelace" }).click();

  expect(props.onRemove).toHaveBeenCalledWith("m1");
});

test("shows the rate error only on the row that carries it", async () => {
  const { screen } = await renderList({
    picked: [
      { memberId: "m1", name: "Ada Lovelace", hourlyRate: 120, rateError: undefined },
      {
        memberId: "m2",
        name: "Alan Turing",
        hourlyRate: 0,
        rateError: "Hourly rate must be greater than 0",
      },
    ],
  });

  // getByText matching a single element also proves Ada's row omits it.
  await expect
    .element(screen.getByText("Hourly rate must be greater than 0"))
    .toBeInTheDocument();
  await expect
    .element(screen.getByLabelText("Hourly rate for Alan Turing"))
    .toHaveAttribute("aria-invalid", "true");
  await expect
    .element(screen.getByLabelText("Hourly rate for Ada Lovelace"))
    .not.toHaveAttribute("aria-invalid");
});
