import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api-client";

export function Scratch() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["memos"],
    queryFn: () => api.get("/api/memos"),
  });

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>読み込みに失敗しました</p>;

  return (
    <ul>
      {data.map((memo) => (
        <li key={memo.id}>{memo.title}</li>
      ))}
    </ul>
  );
}
