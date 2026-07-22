import { useApprovalContainer } from "./Approval.container.hook";
import { ApprovalComponent } from "./Approval.component";

export function ApprovalContainer() {
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
  } = useApprovalContainer();

  return (
    <ApprovalComponent
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
