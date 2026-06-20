import React from 'react';
import { BaseToast, ErrorToast } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#28a745', backgroundColor: '#f0fff4' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: 'bold', color: '#155724' }}
      text2Style={{ fontSize: 13, color: '#155724' }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#dc3545', backgroundColor: '#fff5f5' }}
      text1Style={{ fontSize: 15, fontWeight: 'bold', color: '#721c24' }}
      text2Style={{ fontSize: 13, color: '#721c24' }}
    />
  ),
};
