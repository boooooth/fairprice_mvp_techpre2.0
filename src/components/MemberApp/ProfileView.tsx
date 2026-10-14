"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MemberUser } from "./types";

interface ProfileViewProps {
  user: MemberUser;
  onBack: () => void;
  onRequestNotificationPermission?: () => void;
  onRequestPhoneNumber?: () => void;
  onSignOut: () => void;
  onUserUpdate?: (updatedUser: MemberUser) => void;
}

export default function ProfileView({
  user,
  onBack,
  onRequestNotificationPermission,
  onRequestPhoneNumber,
  onSignOut,
  onUserUpdate,
}: ProfileViewProps) {
  const isTelegramUser = user.authProvider === "telegram" || Boolean(user.telegramId);

  // Username editing state (for Web/OTP users)
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>(user.firstName || "");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    setUsernameInput(user.firstName || "");
  }, [user.firstName]);

  const handleSaveUsername = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = usernameInput.trim();
    if (!cleanName || cleanName.length < 2) {
      setSaveError("Username must be at least 2 characters");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/user/save-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, username: cleanName }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update username");
      }

      setSaveSuccess(true);
      if (onUserUpdate && data.user) {
        onUserUpdate({
          ...user,
          firstName: data.user.firstName,
        });
      }

      setTimeout(() => {
        setIsEditingUsername(false);
        setSaveSuccess(false);
      }, 600);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error updating username");
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic display name below avatar
  const avatarDisplayName = isTelegramUser
    ? user.firstName || (user.telegramUsername ? `@${user.telegramUsername}` : "Member")
    : user.firstName || "Member";

  // Dynamic value for Username row
  const usernameRowDisplay = isTelegramUser
    ? user.firstName || (user.telegramUsername ? `@${user.telegramUsername}` : "Telegram User")
    : user.firstName;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Header Bar matching Image 5 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--card-border)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Back to App"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <h1
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#000000",
            margin: 0,
          }}
        >
          My Profile
        </h1>

        <div style={{ width: "36px" }} />
      </div>

      {/* 2. Avatar with Crown Badge (Dynamic photo from Telegram or Initial) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 0 6px 0",
        }}
      >
        <div style={{ position: "relative" }}>
          {/* Gold / Black Crown SVG */}
          <div
            style={{
              position: "absolute",
              top: "-18px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2,
            }}
          >
            <svg
              width="28"
              height="20"
              viewBox="0 0 24 24"
              fill="#eab308"
              stroke="#ca8a04"
              strokeWidth="1.2"
            >
              <path d="M2 19h20L19 7l-4.5 4.5L12 3l-2.5 8.5L5 7 2 19z" />
            </svg>
          </div>

          {/* User Avatar Circle */}
          <div
            style={{
              width: "78px",
              height: "78px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              border: "3px solid #dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc2626",
              fontWeight: 800,
              fontSize: "1.75rem",
              boxShadow: "0 4px 14px rgba(220, 38, 38, 0.15)",
              position: "relative",
            }}
          >
            <span>{user.firstName ? user.firstName.charAt(0).toUpperCase() : "M"}</span>
          </div>
        </div>

        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#000000" }}>
            {avatarDisplayName}
          </div>
          <div
            className="mono"
            style={{ fontSize: "0.72rem", color: "#dc2626", fontWeight: 700, marginTop: "2px" }}
          >
            PASS ID: {user.id.slice(-8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* 3. Profile Information List (matching Image 5 with Dynamic Username) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid var(--card-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        {/* Mobile Number */}
        <div
          style={{
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--card-border-subtle)",
            fontSize: "0.88rem",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>My Mobile Number</span>
          <span style={{ fontWeight: 600, color: "#000000" }}>
            {user.phoneNumber || "Not linked"}
          </span>
        </div>

        {/* Dynamic Username row with inline editing on the exact same row */}
        <div
          style={{
            padding: "12px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--card-border-subtle)",
            fontSize: "0.88rem",
            minHeight: "52px",
            gap: "10px",
          }}
        >
          <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>Username</span>
          {isTelegramUser ? (
            <span style={{ fontWeight: 600, color: "#000000" }}>
              {usernameRowDisplay}
            </span>
          ) : isEditingUsername ? (
            <form
              onSubmit={handleSaveUsername}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flex: 1,
                justifyContent: "flex-end",
              }}
            >
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. Seyhaboth"
                maxLength={25}
                autoFocus
                style={{
                  width: "100%",
                  maxWidth: "140px",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  border: "1.5px solid #dc2626",
                  fontSize: "0.85rem",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsEditingUsername(false);
                    setSaveError(null);
                  }
                }}
              />
              <button
                type="submit"
                disabled={isSaving || !usernameInput.trim()}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  border: "none",
                  cursor: isSaving || !usernameInput.trim() ? "not-allowed" : "pointer",
                  opacity: isSaving || !usernameInput.trim() ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                {isSaving ? "..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingUsername(false);
                  setSaveError(null);
                }}
                style={{
                  padding: "5px 8px",
                  borderRadius: "6px",
                  backgroundColor: "#f4f4f5",
                  border: "1px solid #e4e4e7",
                  color: "#71717a",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Cancel"
                aria-label="Cancel editing"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </form>
          ) : (
            <div>
              {usernameRowDisplay ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 600, color: "#000000" }}>
                    {usernameRowDisplay}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameInput(user.firstName || "");
                      setIsEditingUsername(true);
                      setSaveError(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: "#fef2f2",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="Change username"
                  >
                    <span>Edit</span>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUsernameInput("");
                    setIsEditingUsername(true);
                    setSaveError(null);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    backgroundColor: "#fef2f2",
                    border: "1px dashed #dc2626",
                    borderRadius: "14px",
                    padding: "4px 12px",
                    color: "#dc2626",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>Please fill in</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Validation / Save Error Notice (if any) */}
        {!isTelegramUser && isEditingUsername && saveError && (
          <div
            style={{
              padding: "4px 18px 8px 18px",
              backgroundColor: "#fff1f2",
              color: "#dc2626",
              fontSize: "0.75rem",
              textAlign: "right",
              borderBottom: "1px solid var(--card-border-subtle)",
            }}
          >
            {saveError}
          </div>
        )}

        {/* Gender */}
        <div
          style={{
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--card-border-subtle)",
            fontSize: "0.88rem",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>Gender</span>
          <span style={{ fontWeight: 600, color: "#000000" }}>
            {user.gender || "Not set"}
          </span>
        </div>

        {/* Birthday / Age */}
        <div
          style={{
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: user.telegramId ? "1px solid var(--card-border-subtle)" : "none",
            fontSize: "0.88rem",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>Age / Demographics</span>
          <span style={{ fontWeight: 600, color: "#000000" }}>
            {user.age ? `${user.age} yrs` : "Not specified"}
          </span>
        </div>

        {/* Telegram account if available */}
        {user.telegramId && (
          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.88rem",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>Telegram Account</span>
            <span style={{ fontWeight: 600, color: "#000000" }}>
              {user.telegramUsername ? `@${user.telegramUsername}` : user.telegramId}
            </span>
          </div>
        )}
      </div>

      {/* 4. Telegram-specific prompt cards (strictly for Telegram users) */}
      {isTelegramUser && (!user.canReceiveNotifications || !user.phoneNumber) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Notifications Card */}
          {!user.canReceiveNotifications && (
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "#f4f4f5",
                border: "1px solid #e4e4e7",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "#000000", fontSize: "0.85rem" }}>
                  Telegram Notifications
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  Allow the bot to send you receipt updates
                </div>
              </div>
              {onRequestNotificationPermission && (
                <button
                  type="button"
                  onClick={onRequestNotificationPermission}
                  className="btn-primary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.82rem",
                    flexShrink: 0,
                  }}
                >
                  Allow
                </button>
              )}
            </div>
          )}

          {/* Phone Card */}
          {!user.phoneNumber && (
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "#f4f4f5",
                border: "1px solid #e4e4e7",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "#000000", fontSize: "0.85rem" }}>
                  Phone Number
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  Link your mobile number to your member pass
                </div>
              </div>
              {onRequestPhoneNumber && (
                <button
                  type="button"
                  onClick={onRequestPhoneNumber}
                  className="btn-primary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.82rem",
                    flexShrink: 0,
                  }}
                >
                  Share
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Admin Panel Link (if user is admin) */}
      {user.role === "admin" && (
        <Link
          href="/admin"
          className="btn-secondary"
          style={{
            width: "100%",
            padding: "12px 18px",
            fontSize: "0.92rem",
            justifyContent: "center",
          }}
        >
          Open Admin Dashboard
        </Link>
      )}

      {/* 6. Sign Out Button (Strictly for Web users) */}
      {!isTelegramUser && (
        <button
          type="button"
          onClick={onSignOut}
          className="btn-primary"
          style={{
            width: "100%",
            padding: "12px 18px",
            fontSize: "0.95rem",
          }}
        >
          Sign Out
        </button>
      )}
    </div>
  );
}
