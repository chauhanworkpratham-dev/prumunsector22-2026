import { DelegatesTab } from "./DelegatesTab";

export const OrganisingCommitteeTab = ({ editionId }: { editionId: string }) => (
  <DelegatesTab editionId={editionId} roleFilter="organising_committee" />
);
