import React from 'react';
import { RequisitionRecord, UserRole } from '../../types/requisition';
import { RequisitionList } from '@/features/requisition/pages/RequisitionListPage';

interface ApprovalQueueProps {
  requisitions: RequisitionRecord[];
  currentRole: UserRole;
  onSelectRequisition: (req: RequisitionRecord) => void;
  onUpdateRequisition: (req: RequisitionRecord) => void;
  onCreateNew?: () => void;
  searchQuery?: string;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  requisitions,
  currentRole,
  onSelectRequisition,
  onUpdateRequisition,
  onCreateNew = () => {},
  searchQuery = '',
}) => {
  return (
    <RequisitionList
      requisitions={requisitions}
      currentRole={currentRole}
      onSelectRequisition={onSelectRequisition}
      onUpdateRequisition={onUpdateRequisition}
      onCreateNew={onCreateNew}
      searchQuery={searchQuery}
      initialTab="pending"
    />
  );
};