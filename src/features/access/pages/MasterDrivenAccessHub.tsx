import React, { useState } from "react";
import { ApplicantProfile, RequisitionRecord, UserRole } from "@/types";
import { MasterDrivenQuickApplyModal } from "@/features/applicant/forms/MasterDrivenQuickApplyModal";
import { StaticAccessCatalog, STATIC_ACCESS_ITEMS, type StaticAccessItem } from "@/features/access/components/StaticAccessCatalog";

type Props = {
  applicantProfile: ApplicantProfile;
  currentRole?: UserRole;
  requisitions: RequisitionRecord[];
  onSelectRequisition: (req: RequisitionRecord) => void;
  onSubmitRequisition?: (req: RequisitionRecord) => void;
  onNavigateTab?: (tab: string) => void;
};

type ModalState = { item: StaticAccessItem; mode: "new" | "renewal" } | null;

export const MasterDrivenAccessHub: React.FC<Props> = ({ applicantProfile, requisitions, onSubmitRequisition }) => {
  const [modal, setModal] = useState<ModalState>(null);

  const handleApply = (item: StaticAccessItem) => setModal({ item, mode: "new" });

  return (
    <div className="max-w-[1220px] mx-auto pb-8">
      <StaticAccessCatalog onApply={handleApply} />
      {modal && (
        <MasterDrivenQuickApplyModal
          isOpen={true}
          onClose={() => setModal(null)}
          serviceScope={modal.item.scope}
          mode={modal.mode}
          applicantProfile={applicantProfile}
          existingRequisitions={requisitions}
          onSubmitRequisition={(req) => onSubmitRequisition?.(req)}
          service={modal.item.kind === "service" ? ({ id: modal.item.key, name: modal.item.title, quota: modal.item.subtitle, status: "active" } as any) : undefined}
          facility={modal.item.kind === "facility" ? ({ id: modal.item.key, name: modal.item.title, description: modal.item.subtitle, status: "active" } as any) : undefined}
        />
      )}
    </div>
  );
};

export { STATIC_ACCESS_ITEMS };
