"use client";

import { useEffect, useCallback, useRef } from "react";

/**
 * Hook that warns users about unsaved form changes before navigating away.
 * Adds a `beforeunload` event listener when the form has been modified.
 *
 * @param isDirty - Whether the form has unsaved changes
 * @param message - Optional custom warning message (browser may override this)
 */
export function useFormUnsaved(isDirty: boolean, message?: string) {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        // Modern browsers ignore custom messages and show their own dialog
        // but returnValue assignment is still required for the prompt to show
        e.returnValue = message || "You have unsaved changes. Are you sure you want to leave?";
      }
    },
    [message]
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [handleBeforeUnload]);
}
