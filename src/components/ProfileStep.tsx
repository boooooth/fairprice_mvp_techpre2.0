"use client";

import { useState } from "react";

interface ProfileStepProps {
  user: {
    id: string;
    phoneNumber?: string | null;
    telegramId?: string | null;
    telegramUsername?: string | null;
    firstName?: string | null;
    canReceiveNotifications?: boolean;
    authProvider?: string;
  };
  onRequestNotificationPermission?: () => void;
  onProfileSaved: (updatedUser: any) => void;
}

export default function ProfileStep({
  user,
  onRequestNotificationPermission,
  onProfileSaved,
}: ProfileStepProps) {
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTelegram = user.authProvider === "telegram" || !!user.telegramId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setError("Please enter an age between 1 and 120");
      return;
    }

    if (!gender) {
      setError("Please select a gender");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          age: parsedAge,
          gender,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save profile");
      }

      onProfileSaved(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-card"
      style={{
        maxWidth: "440px",
        width: "100%",
        padding: "36px 28px",
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
      }}
    >
      {/* Brand Logo & Header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "24px" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "10px 22px",
            borderRadius: "14px",
            border: "1px solid #e4e4e7",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "14px",
          }}
        >
          <img
            src="/fairprice-logo.webp"
            alt="FairPrice"
            decoding="async"
            style={{
              height: "36px",
              width: "auto",
              display: "block",
              objectFit: "contain",
            }}
          />
        </div>

        {/* Verification Status Badge */}
        <div style={{ marginBottom: "10px" }}>
          {isTelegram ? (
            <span
              className="mono"
              style={{
                fontSize: "0.72rem",
                padding: "3px 10px",
                borderRadius: "9999px",
                fontWeight: 700,
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                letterSpacing: "0.03em",
              }}
            >
              <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                <circle cx="3" cy="3" r="3" />
              </svg>
              Telegram Connected
            </span>
          ) : (
            <span
              className="mono"
              style={{
                fontSize: "0.72rem",
                padding: "3px 10px",
                borderRadius: "9999px",
                fontWeight: 700,
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                letterSpacing: "0.03em",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Verified: {user.phoneNumber}</span>
            </span>
          )}
        </div>

        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#0f172a",
            marginBottom: "6px",
            lineHeight: 1.2,
          }}
        >
          {isTelegram ? `Welcome, ${user.firstName || "Telegram User"}` : "Member Details"}
        </h1>
        <p
          style={{
            fontSize: "0.88rem",
            color: "#64748b",
            lineHeight: 1.5,
            maxWidth: "320px",
          }}
        >
          Provide your demographic details to activate your digital member card and personalised offers.
        </p>
      </div>



      {error && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "var(--radius-sm)",
            color: "#b91c1c",
            fontSize: "0.85rem",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Age Input */}
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="ageInput"
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#18181b",
            }}
          >
            Age
          </label>
          <input
            id="ageInput"
            type="number"
            min="1"
            max="120"
            placeholder="e.g. 25"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            disabled={loading}
            autoFocus
            style={{
              width: "100%",
              padding: "12px 14px",
              backgroundColor: "#ffffff",
              border: "1px solid var(--input-border)",
              borderRadius: "10px",
              color: "#0f172a",
              fontSize: "1rem",
              fontWeight: 600,
              outline: "none",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#dc2626";
              e.target.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.12)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--input-border)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Gender Selection */}
        <div style={{ marginBottom: "28px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: "10px",
              color: "#334155",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Gender
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
            }}
          >
            {["Male", "Female", "Other"].map((g) => {
              const isSelected = gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  style={{
                    padding: "11px 8px",
                    backgroundColor: isSelected ? "#dc2626" : "#ffffff",
                    border: `1.5px solid ${isSelected ? "#dc2626" : "var(--input-border)"}`,
                    borderRadius: "10px",
                    color: isSelected ? "#ffffff" : "#0f172a",
                    fontWeight: isSelected ? 700 : 600,
                    fontSize: "0.9rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !age || !gender}
          className="btn-primary"
          style={{
            width: "100%",
            padding: "13px 18px",
            fontSize: "0.95rem",
            fontWeight: 700,
            borderRadius: "10px",
            backgroundColor: "#dc2626",
            borderColor: "#dc2626",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTopColor: "#ffffff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span>Activating Pass...</span>
            </>
          ) : (
            <>
              <span>Activate FairPrice Member Pass</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
