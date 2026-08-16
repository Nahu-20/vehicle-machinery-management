import React from 'react';
import { NewsEditorForm } from '../../../components/admin/news/NewsEditorForm';

export const AdminNewsCreatePage: React.FC = () => {
  return (
    <div className="py-2">
      <NewsEditorForm isEditMode={false} />
    </div>
  );
};
