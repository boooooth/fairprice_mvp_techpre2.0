"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { MemberUser } from "./types";

interface CardTabProps {
  user: MemberUser;
  points: number;
  vouchersCount: number;
  onRequestNotificationPermission?: () => void | Promise<boolean>;
  onUserUpdate?: (updatedUser: MemberUser) => void;
  onOpenFaq: () => void;
  onOpenLocations: () => void;
}

export default function CardTab({
  user,
  points,
  vouchersCount,
  onRequestNotificationPermission,
  onUserUpdate,
  onOpenFaq,
  onOpenLocations,
}: CardTabProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const isLocked = !user.canReceiveNotifications;

  const handleUnlock = async () => {
    setIsUnlocking(true);
    setUnlockError(null);
    try {
      if (onRequestNotificationPermission) {
        const granted = await onRequestNotificationPermission();
        if (granted) {
          if (onUserUpdate) {
            onUserUpdate({ ...user, canReceiveNotifications: true });
          }
        } else {
          setUnlockError("Please allow notifications in Telegram to unlock");
        }
      }
    } catch (err) {
      console.error("Error unlocking QR pass:", err);
      setUnlockError("Could not request notification permission");
    } finally {
      setIsUnlocking(false);
    }
  };

  // Format a realistic 16-digit card number derived from user.id
  const formattedCardNumber = (() => {
    let cleanId = user.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    while (cleanId.length < 16) {
      cleanId += "8888999911112222";
    }
    const part1 = cleanId.slice(0, 4);
    const part2 = cleanId.slice(4, 8);
    const part3 = cleanId.slice(8, 12);
    const part4 = cleanId.slice(12, 16);
    return `${part1} ${part2} ${part3} ${part4}`;
  })();

  useEffect(() => {
    const payload = JSON.stringify({
      id: user.id,
      auth: user.authProvider || "web",
      phone: user.phoneNumber || undefined,
      tg: user.telegramId || undefined,
      issuedAt: new Date().toISOString(),
    });

    QRCode.toDataURL(payload, {
      width: 230,
      margin: 1,
      color: {
        dark: "#dc2626",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, [user]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* 1. Digital Membership Card */}
      <div
        style={{
          width: "100%",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
          color: "#ffffff",
          padding: "20px 22px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 24px -4px rgba(220, 38, 38, 0.3)",
          border: "1px solid #f87171",
        }}
      >
        {/* Subtle decorative card shine/pattern */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Card Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "26px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Official FairPrice Logo Matching Promotional Banners */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "5px 12px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              <img
                src="/fairprice-logo.webp"
                alt="FairPrice"
                decoding="async"
                style={{
                  height: "26px",
                  width: "auto",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            </div>

            <div
              style={{
                fontSize: "0.68rem",
                color: "rgba(255, 255, 255, 0.92)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              MEMBER PASS
            </div>
          </div>
        </div>

        {/* EMV Chip and Contactless indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "26px",
              borderRadius: "4px",
              background: "linear-gradient(135deg, #fef08a 0%, #ca8a04 100%)",
              border: "1px solid #eab308",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "40%",
                left: 0,
                right: 0,
                height: "1px",
                backgroundColor: "#a16207",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "48%",
                width: "1px",
                backgroundColor: "#a16207",
              }}
            />
          </div>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255, 255, 255, 0.65)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 9c1.5 2 1.5 4 0 6" />
            <path d="M8.5 6.5c3 3.5 3 7.5 0 11" />
            <path d="M12 4c4.5 5 4.5 11 0 16" />
          </svg>
        </div>

        {/* Card Number & User Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            className="mono"
            style={{
              fontSize: "0.95rem",
              letterSpacing: "2.5px",
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            {formattedCardNumber}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.9)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {user.firstName || "Member"}
            </div>
            <div
              className="mono"
              style={{
                fontSize: "0.7rem",
                color: "rgba(255, 255, 255, 0.55)",
              }}
            >
              EXP: 12/29
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stats Row: Points Balance & Vouchers (Matching Image 2 & 4) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        {/* Points Balance Box */}
        <div
          style={{
            backgroundColor: "#fafafa",
            border: "1px solid var(--card-border)",
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div
            style={{
              fontSize: "0.76rem",
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            Points Balance
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="#f59e0b"
              stroke="#f59e0b"
              strokeWidth="1.5"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#dc2626",
                lineHeight: 1,
              }}
            >
              {points.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Vouchers Box */}
        <div
          style={{
            backgroundColor: "#fafafa",
            border: "1px solid var(--card-border)",
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div
            style={{
              fontSize: "0.76rem",
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            Vouchers
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
            <span
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#dc2626",
                lineHeight: 1,
              }}
            >
              {vouchersCount}
            </span>
          </div>
        </div>
      </div>

      {/* 3. QR Code Section (Merged into Card Tab, matching Image 2) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid var(--card-border)",
          borderRadius: "var(--radius-md)",
          padding: "20px 16px",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div
          style={{
            fontSize: "1rem",
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: "4px",
          }}
        >
          My Member QR
        </div>

        {/* Prominent instruction text between heading and QR card */}
        <p
          style={{
            fontSize: "0.96rem",
            color: isLocked ? "#dc2626" : "#1e293b",
            fontWeight: isLocked ? 700 : 600,
            marginBottom: "14px",
            textAlign: "center",
          }}
        >
          {isLocked
            ? "Tap Unlock below to show QR code to Cashier"
            : "Please show this QR code to Cashier"}
        </p>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "14px",
            border: `1.5px solid ${isLocked ? "#fecaca" : "var(--card-border-subtle)"}`,
            borderRadius: "14px",
            display: "inline-block",
            marginBottom: "12px",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s ease",
            boxShadow: isLocked
              ? "0 4px 16px rgba(220, 38, 38, 0.08)"
              : "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* QR Container */}
          <div
            style={{
              position: "relative",
              width: "190px",
              height: "190px",
              margin: "0 auto",
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Member Pass QR"
                style={{
                  width: "190px",
                  height: "190px",
                  display: "block",
                  filter: isLocked ? "blur(9px)" : "blur(0px)",
                  transform: isLocked ? "scale(0.96)" : "scale(1)",
                  opacity: isLocked ? 0.45 : 1,
                  transition: "filter 0.4s ease, transform 0.4s ease, opacity 0.4s ease",
                  userSelect: "none",
                  pointerEvents: isLocked ? "none" : "auto",
                }}
              />
            ) : (
              <div
                style={{
                  width: "190px",
                  height: "190px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                Loading QR...
              </div>
            )}

            {/* Frosted Glass Overlay with Unlock Button when notifications are not allowed */}
            {isLocked && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.55)",
                  backdropFilter: "blur(2px)",
                  borderRadius: "10px",
                  padding: "8px",
                  zIndex: 10,
                }}
              >
                {/* Lock Icon Badge */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    border: "2px solid #fecaca",
                    boxShadow: "0 4px 14px rgba(220, 38, 38, 0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#dc2626",
                    marginBottom: "10px",
                  }}
                >
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                {/* Unlock Button */}
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={isUnlocking}
                  className="btn-primary"
                  style={{
                    padding: "8px 20px",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    borderRadius: "20px",
                    backgroundColor: "#dc2626",
                    borderColor: "#dc2626",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
                    cursor: isUnlocking ? "wait" : "pointer",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isUnlocking) (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  }}
                >
                  {isUnlocking ? (
                    <>
                      <div
                        style={{
                          width: "14px",
                          height: "14px",
                          border: "2px solid rgba(255, 255, 255, 0.3)",
                          borderTopColor: "#ffffff",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      <span>Unlocking...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                      </svg>
                      <span>Unlock</span>
                    </>
                  )}
                </button>

                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "#991b1b",
                    fontWeight: 600,
                    marginTop: "6px",
                    textAlign: "center",
                    lineHeight: 1.25,
                  }}
                >
                  Allow notification to reveal QR
                </div>

                {unlockError && (
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "#b91c1c",
                      marginTop: "4px",
                      textAlign: "center",
                      fontWeight: 600,
                      maxWidth: "170px",
                    }}
                  >
                    {unlockError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="mono"
            style={{
              marginTop: "8px",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: isLocked ? "#94a3b8" : "#dc2626",
              letterSpacing: "0.5px",
              filter: isLocked ? "blur(3px)" : "none",
              transition: "filter 0.35s ease, color 0.35s ease",
            }}
          >
            PASS ID: {user.id.slice(-8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* 4. Quick Action Links (Matching Image 4) */}
      <div
        style={{
          border: "1px solid var(--card-border)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* FAQs & Contact Us */}
        <button
          type="button"
          onClick={onOpenFaq}
          style={{
            width: "100%",
            padding: "15px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "transparent",
            borderBottom: "1px solid var(--card-border-subtle)",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#000000" }}>
                FAQs & Contact Us
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                Help, support, and Telegram bot updates
              </div>
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#71717a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Store Locations */}
        <button
          type="button"
          onClick={onOpenLocations}
          style={{
            width: "100%",
            padding: "15px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "transparent",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#000000" }}>
                Store Locations
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                Find partner stores and opening hours
              </div>
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#71717a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
