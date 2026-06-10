import React, { useEffect } from 'react';
import Toast from 'react-native-toast-message';

type Notice = { type: 'success' | 'error' | 'info'; text: string } | null;

export default function NoticeBox({ notice }: { notice: Notice }) {
  useEffect(() => {
    if (notice) {
      const toastType = notice.type === 'success' ? 'success' : notice.type === 'error' ? 'error' : 'info';
      Toast.show({
        type: toastType,
        text1: notice.text,
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 50,
      });
    }
  }, [notice]);

  return null;
}