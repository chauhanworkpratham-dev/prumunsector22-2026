import { DelegatesTab } from "./DelegatesTab";

export const ExecutiveBoardTab = ({ editionId }: { editionId: string }) => (
  <DelegatesTab editionId={editionId} roleFilter="executive_board" />
);
