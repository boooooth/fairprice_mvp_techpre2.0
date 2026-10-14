"use client";

import MemberApp from "./MemberApp/MemberApp";
import { MemberUser } from "./MemberApp/types";

interface SuccessStepProps {
  user: MemberUser;
  isTelegram?: boolean;
  onRequestNotificationPermission?: () => void | Promise<boolean>;
  onRequestPhoneNumber?: () => void;
  onReset: () => void;
  onUserUpdate?: (updatedUser: MemberUser) => void;
}

export default function SuccessStep({
  user,
  isTelegram = false,
  onRequestNotificationPermission,
  onRequestPhoneNumber,
  onReset,
  onUserUpdate,
}: SuccessStepProps) {
  return (
    <MemberApp
      user={user}
      isTelegram={isTelegram}
      onRequestNotificationPermission={onRequestNotificationPermission}
      onRequestPhoneNumber={onRequestPhoneNumber}
      onReset={onReset}
      onUserUpdate={onUserUpdate}
    />
  );
}
