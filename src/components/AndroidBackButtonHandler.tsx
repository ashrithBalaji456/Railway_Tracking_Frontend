import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Handles Android hardware back button and edge-swipe back gesture.
 * Only active on native Capacitor platforms to ensure web/Vercel is untouched.
 */
export default function AndroidBackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let isSubscribed = true;

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (!isSubscribed) return;

      // If user is on a nested page, navigate back using in-app history (same as visible back button)
      if (location.pathname !== '/') {
        navigate(-1);
      } else {
        // At the root page '/', perform intentional root-level exit
        CapacitorApp.exitApp();
      }
    });

    return () => {
      isSubscribed = false;
      listenerPromise.then(handle => {
        handle.remove();
      }).catch(err => {
        console.warn('Error removing backButton listener', err);
      });
    };
  }, [location.pathname, navigate]);

  return null;
}
