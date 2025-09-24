"use client";

import SessionExpiredModal from "./SessionExpiredModal";
import useSessionExpiredModal from "@/hooks/useSessionExpiredModal";

const SessionExpiredModalWrapper: React.FC = () => {
  const { isOpen, close } = useSessionExpiredModal();

  return (
    <SessionExpiredModal
      isOpen={isOpen}
      onClose={close}
    />
  );
};

export default SessionExpiredModalWrapper;
