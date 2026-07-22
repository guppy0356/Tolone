import { useTravelRequestContainer } from "./TravelRequest.container.hook";
import { TravelRequestComponent } from "./TravelRequest.component";

export function TravelRequestContainer() {
  const {
    requests,
    isRequestsPending,
    isRequestsRefetching,
    selectedRequestId,
    selectRequest,
    detail,
    isDetailPending,
    superiors,
    isSuperiorsPending,
    approve,
    reject,
  } = useTravelRequestContainer();

  return (
    <TravelRequestComponent
      requests={requests}
      isRequestsPending={isRequestsPending}
      isRequestsRefetching={isRequestsRefetching}
      selectedRequestId={selectedRequestId}
      selectRequest={selectRequest}
      detail={detail}
      isDetailPending={isDetailPending}
      superiors={superiors}
      isSuperiorsPending={isSuperiorsPending}
      approve={approve}
      reject={reject}
    />
  );
}
