import { useParams } from "@tanstack/react-router";
import { useReadingItemDetailFacade } from "./ReadingItemDetail.facade";
import { ReadingItemDetailComponent } from "./ReadingItemDetail.component";

export function ReadingItemDetailContainer() {
  const { itemId } = useParams({ from: "/reading-list/$itemId" });
  const { detail, isPending, isRefetching, isNotFound, saveNote, changeStatus } =
    useReadingItemDetailFacade({ itemId });

  return (
    <ReadingItemDetailComponent
      detail={detail}
      isPending={isPending}
      isRefetching={isRefetching}
      isNotFound={isNotFound}
      saveNote={saveNote}
      changeStatus={changeStatus}
    />
  );
}
