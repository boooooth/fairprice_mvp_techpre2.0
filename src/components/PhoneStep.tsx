"use client";

import { useState } from "react";

interface PhoneStepProps {
  onOtpSent: (phoneNumber: string, debugCode?: string) => void;
}

function formatCambodianNumber(digits: string): string {
  if (!digits) return "+855 ";
  if (digits.length <= 2) {
    return `+855 ${digits}`;
  }
  if (digits.length <= 5) {
    return `+855 ${digits.slice(0, 2)} ${digits.slice(2)}`;
  }
  if (digits.length <= 8) {
    return `+855 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  const capped = digits.slice(0, 9);
  return `+855 ${capped.slice(0, 2)} ${capped.slice(2, 5)} ${capped.slice(5)}`;
}

function formatPhoneNumberInput(input: string, prev: string): string {
  if (!input) return "";

  // If user was backspacing and cleared below or at "+855":
  if (input.length < prev.length) {
    if (input === "+855" || input === "+85" || input === "+8" || input === "+" || input === "+855 ") {
      return "";
    }
    const remainingDigits = input.startsWith("+855")
      ? input.slice(4).replace(/\D/g, "")
      : input.replace(/\D/g, "");
    if (!remainingDigits) return "";
    return formatCambodianNumber(remainingDigits);
  }

  // If user typed '0' or starts with '0'
  if (input.startsWith("0")) {
    const digits = input.replace(/^0+/, "").replace(/\D/g, "");
    if (!digits) return "+855 ";
    return formatCambodianNumber(digits);
  }

  // If starts with +855
  if (input.startsWith("+855")) {
    const digits = input.slice(4).replace(/^0+/, "").replace(/\D/g, "");
    if (!digits) return "+855 ";
    return formatCambodianNumber(digits);
  }

  // If starts with 855 without +
  if (input.startsWith("855")) {
    const digits = input.slice(3).replace(/^0+/, "").replace(/\D/g, "");
    if (!digits) return "+855 ";
    return formatCambodianNumber(digits);
  }

  // If user started with another country code like +1 or +44
  if (input.startsWith("+")) {
    return input;
  }

  // Otherwise, user typed digits directly (e.g. '1', '9')
  const digits = input.replace(/\D/g, "");
  return formatCambodianNumber(digits);
}

export default function PhoneStep({ onOtpSent }: PhoneStepProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setPhoneNumber((prev) => formatPhoneNumberInput(nextVal, prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = phoneNumber.trim();
    if (clean.length < 7) {
      setError("Please enter a valid phone number (at least 7 digits)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: clean }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send verification code");
      }

      onOtpSent(clean, data.debugCode);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error, please try again");
    } finally {
      setLoading(false);
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
          Sign in to FairPrice
        </h1>
        <p
          style={{
            fontSize: "0.88rem",
            color: "#64748b",
            lineHeight: 1.5,
            maxWidth: "320px",
          }}
        >
          Enter your mobile number to receive a secure SMS verification code.
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

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="phoneInput"
            style={{
              display: "block",
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: "8px",
              color: "#334155",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Mobile Number
          </label>
          <input
            id="phoneInput"
            type="tel"
            placeholder="+855 12 345 678"
            value={phoneNumber}
            onChange={handlePhoneChange}
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

        <button
          type="submit"
          disabled={loading || !phoneNumber.trim()}
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
              <span>Sending Code...</span>
            </>
          ) : (
            <>
              <span>Continue with SMS OTP</span>
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
