import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Handles Android hardware back button and edge-swipe back gesture.
 * 1. Dispatches 'app:android-back' so open modals can intercept and dismiss cleanly.
 * 2. Checks fallback open modal elements.
 * 3. If on a sub-page (e.g. /trains/:id, /pnr, /favorites), navigates to previous page via navigate(-1).
 * 4. If on the root page ('/'), implements double-tap back to exit within 2 seconds.
 */
export default function AndroidBackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPressTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let isSubscribed = true;

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (!isSubscribed) return;

      // 1. Dispatch custom event so any open modal (e.g., Alerts & Preferences, Guide, Cockpit) can consume it
      const backEvent = new CustomEvent('app:android-back', { cancelable: true });
      const wasConsumed = !window.dispatchEvent(backEvent);
      if (wasConsumed) {
        // Modal or view consumed the back event; do not navigate or exit
        return;
      }

      // 2. Fallback check for any active modal dialog with close button
      const openModals = document.querySelectorAll<HTMLElement>('[data-modal-open="true"]');
      if (openModals.length > 0) {
        const topModal = openModals[openModals.length - 1];
        const closeBtn = topModal.querySelector<HTMLElement>(
          '[data-modal-close="true"], button[aria-label="Close"], button[title="Close"]'
        );
        if (closeBtn) {
          closeBtn.click();
          return;
        }
      }

      // 3. If user is on a nested page, navigate back to previous view
      if (location.pathname !== '/') {
        navigate(-1);
        return;
      }

      // 4. At the root page '/', implement safe double-tap back to exit
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        CapacitorApp.exitApp();
      } else {
        lastBackPressTimeRef.current = now;
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: {
              message: 'Press back again to exit RailTrack India',
              type: 'info'
            }
          })
        );
      }
    });

    return () => {
      isSubscribed = false;
      listenerPromise
        .then((handle) => {
          handle.remove();
        })
        .catch((err) => {
          console.warn('Error removing backButton listener', err);
        });
    };
  }, [location.pathname, navigate]);

  return null;
}
