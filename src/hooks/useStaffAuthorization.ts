import { useContext } from 'react';
import {
  StaffAuthorizationContext,
  StaffAuthorizationContextType,
} from '../context/StaffAuthorizationContext';

export const useStaffAuthorization = (): StaffAuthorizationContextType => {
  const context = useContext(StaffAuthorizationContext);
  if (!context) {
    throw new Error('useStaffAuthorization must be used within a StaffAuthorizationProvider');
  }
  return context;
};
