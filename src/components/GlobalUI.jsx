import React from 'react';
import { useAppContext } from '../context/AppContext';
import Toast from './ui/Toast';
import ConfirmDialog from './ConfirmDialog';

export default function GlobalUI() {
 const { toast, hideToast } = useAppContext();

 return (
 <>
 <Toast toast={toast} onClose={hideToast} />
 <ConfirmDialog />
 </>
 );
}
