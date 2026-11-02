import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MemoComponent } from "./Memo.component";

const memos = [
  { id: "1", title: "買い物リスト", status: "draft", createdAt: "2026-10-20T09:00:00Z" },
  { id: "2", title: "会議の議事録", status: "published", createdAt: "2026-10-23T10:15:00Z" },
] as const;

test("各行にステータスの日本語と日付が出る", async () => {
  const screen = await render(
    <MemoComponent memos={[...memos]} isPending={false} isRefetching={false} deleteMemo={vi.fn()} />,
  );
  // The composed string pins exactly what the user sees; the tab also says
  // "下書き" alone, so the query is the row's whole text, not the word.
  await expect.element(screen.getByText("下書き · 2026/10/20", { exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText("公開済み · 2026/10/23", { exact: true })).toBeInTheDocument();
});

test("下書きタブを選ぶと下書きだけが残る", async () => {
  const screen = await render(
    <MemoComponent memos={[...memos]} isPending={false} isRefetching={false} deleteMemo={vi.fn()} />,
  );
  await screen.getByRole("tab", { name: "下書き" }).click();
  await expect.element(screen.getByText("買い物リスト")).toBeInTheDocument();
  await expect.element(screen.getByText("会議の議事録")).not.toBeInTheDocument();
});

test("タブはロード中も表示され、選択を保つ", async () => {
  const screen = await render(
    <MemoComponent memos={[]} isPending={true} isRefetching={false} deleteMemo={vi.fn()} />,
  );
  await screen.getByRole("tab", { name: "公開済み" }).click();
  await expect.element(screen.getByRole("tab", { name: "公開済み" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("削除を押すとその id で deleteMemo が呼ばれる", async () => {
  const deleteMemo = vi.fn();
  const screen = await render(
    <MemoComponent memos={[...memos]} isPending={false} isRefetching={false} deleteMemo={deleteMemo} />,
  );
  await screen.getByRole("button", { name: "会議の議事録 を削除" }).click();
  expect(deleteMemo).toHaveBeenCalledWith("2");
});
