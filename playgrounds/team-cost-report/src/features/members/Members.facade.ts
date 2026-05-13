import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { membersApi, type Member } from "./Members.api";

export interface MembersFacadeProps {
  q: string;
}

export interface MembersFacade {
  members: Member[];
  isPending: boolean;
  isFetching: boolean;
}

const memberKeys = {
  all: ["members"] as const,
  search: (q: string) => [...memberKeys.all, { q }] as const,
};

export function useMembersFacade({ q }: MembersFacadeProps): MembersFacade {
  const { data, isPending, isFetching } = useQuery({
    queryKey: q ? memberKeys.search(q) : memberKeys.all,
    queryFn: () => membersApi.getAll(q || undefined),
    placeholderData: keepPreviousData,
  });

  return {
    members: data ?? [],
    isPending,
    isFetching,
  };
}
