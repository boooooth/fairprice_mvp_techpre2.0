"use client";

import { useState } from "react";

interface OtpStepProps {
  phoneNumber: string;
  debugCode?: string;
  onBack: () => void;
  onOtpVerified: (user: any, isNew: boolean) => void;
}

export default function OtpStep({
  phoneNumber,
  debugCode,
  onBack,
  onOtpVerified,
}: OtpStepProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [currentDebugCode, setCurrentDebugCode] = useState<string | undefined>(debugCode);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (cleanCode.length < 4) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code: cleanCode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid verification code");
      }

      onOtpVerified(data.user, data.isNew);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (data.success && data.debugCode) {
        setCurrentDebugCode(data.debugCode);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="auth-card"
      style={{
        maxWidth: "420px",
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

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            padding: "3px 12px",
            borderRadius: "9999px",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#dc2626",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Security Verification
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
          Enter 6-Digit Code
        </h1>
        <p
          style={{
            fontSize: "0.88rem",
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Sent via SMS to{" "}
          <strong style={{ color: "#0f172a", fontWeight: 700 }}>{phoneNumber}</strong>
        </p>
      </div>

      {/* Dev helper box */}
      {currentDebugCode && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              DEMO CODE:{" "}
            </span>
            <span className="mono" style={{ fontWeight: 800, color: "#dc2626", letterSpacing: "2px", fontSize: "0.95rem" }}>
              {currentDebugCode}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCode(currentDebugCode)}
            style={{
              padding: "5px 10px",
              fontSize: "0.75rem",
              fontWeight: 700,
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              borderRadius: "6px",
            }}
          >
            Auto Fill
          </button>
        </div>
      )}

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
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleVerify}>
        <div style={{ marginBottom: "24px" }}>
          <label
            htmlFor="otpInput"
            style={{
              display: "block",
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: "8px",
              color: "#334155",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              textAlign: "center",
            }}
          >
            SMS Verification Code
          </label>
          <input
            id="otpInput"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={loading}
            autoFocus
            className="mono"
            style={{
              width: "100%",
              padding: "14px 12px",
              backgroundColor: "#ffffff",
              border: "1px solid var(--input-border)",
              borderRadius: "10px",
              color: "#0f172a",
              fontSize: "1.4rem",
              fontWeight: 700,
              letterSpacing: "8px",
              textAlign: "center",
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

        <button
          type="submit"
          disabled={loading || code.trim().length < 4}
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
            marginBottom: "16px",
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
              <span>Verifying Code...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Verify &amp; Continue</span>
            </>
          )}
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              backgroundColor: "transparent",
              color: "#64748b",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Change Number
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{
              backgroundColor: "transparent",
              color: "#dc2626",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {resending ? (
              <>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid #fecaca",
                    borderTopColor: "#dc2626",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span>Sending...</span>
              </>
            ) : (
              <span>Resend Code</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
