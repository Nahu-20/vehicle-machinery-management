import React from 'react';
import { AlertEditorForm } from '../../../components/admin/alerts/AlertEditorForm';

export const AdminAlertCreatePage: React.FC = () => {
  return (
    <div className="py-2">
      <AlertEditorForm isEditMode={false} />
    </div>
  );
};

