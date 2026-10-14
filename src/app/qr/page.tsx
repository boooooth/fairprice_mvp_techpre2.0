"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function QRBridgePage() {
  const [triedDeepLink, setTriedDeepLink] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const botUsername =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "FairPriceRewards_bot";
  const appName = process.env.NEXT_PUBLIC_TELEGRAM_APP_NAME || "myapp";

  const telegramTgUrl = `tg://resolve?domain=${botUsername}&appname=${appName}&startapp=pass`;
  const telegramWebUrl = `https://t.me/${botUsername}/${appName}?startapp=pass`;

  useEffect(() => {
    // Detect mobile device
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    setIsMobileDevice(isMobile);

    // If scanned directly by a phone camera accessing this URL, auto-launch Telegram
    if (isMobile) {
      const timer = setTimeout(() => {
        try {
          window.location.href = telegramTgUrl;
        } catch (e) {
          console.error("Deep link trigger failed:", e);
        }
        setTriedDeepLink(true);
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [telegramTgUrl]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#09090b",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "#18181b",
          borderRadius: "24px",
          border: "1px solid #27272a",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          padding: "36px 28px",
          textAlign: "center",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            backgroundColor: "#229ED9",
            color: "#ffffff",
            margin: "0 auto 16px auto",
            boxShadow: "0 8px 24px rgba(34, 158, 217, 0.35)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "1.45rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            margin: "0 0 6px 0",
          }}
        >
          FairPrice Rewards
        </h1>

        <p
          style={{
            fontSize: "0.88rem",
            color: "#a1a1aa",
            margin: "0 0 24px 0",
            lineHeight: 1.5,
          }}
        >
          Scan the QR code with any phone camera to instantly launch the Telegram Mini App
        </p>

        {/* QR Code Container */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "20px",
            display: "inline-block",
            margin: "0 auto 24px auto",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
            border: "4px solid #3f3f46",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/fairprice-qr-code.png"
            alt="FairPrice Rewards Telegram QR Code"
            style={{
              width: "240px",
              height: "240px",
              display: "block",
              borderRadius: "8px",
            }}
          />
          <div
            style={{
              marginTop: "10px",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: "#09090b",
              letterSpacing: "0.02em",
            }}
          >
            {`t.me/${botUsername}/${appName}?startapp=pass`}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Primary: Open Directly in Telegram */}
          <a
            href={telegramTgUrl}
            onClick={() => {
              setTimeout(() => {
                window.location.href = telegramWebUrl;
              }, 500);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "13px 20px",
              backgroundColor: "#229ED9",
              color: "#ffffff",
              borderRadius: "12px",
              fontSize: "0.95rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(34, 158, 217, 0.3)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
            </svg>
            Open in Telegram App
          </a>

          {/* Download QR for In-Store Printing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <a
              href="/fairprice-qr-code.png"
              download="fairprice-rewards-qr.png"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px 14px",
                backgroundColor: "#27272a",
                color: "#e4e4e7",
                borderRadius: "10px",
                fontSize: "0.82rem",
                fontWeight: 600,
                textDecoration: "none",
                border: "1px solid #3f3f46",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              PNG Image
            </a>
            <a
              href="/fairprice-qr-code.svg"
              download="fairprice-rewards-qr.svg"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px 14px",
                backgroundColor: "#27272a",
                color: "#e4e4e7",
                borderRadius: "10px",
                fontSize: "0.82rem",
                fontWeight: 600,
                textDecoration: "none",
                border: "1px solid #3f3f46",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              SVG Vector (Print)
            </a>
          </div>

          {/* Fallback to Web */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "11px 20px",
              backgroundColor: "transparent",
              color: "#a1a1aa",
              borderRadius: "10px",
              fontSize: "0.84rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Continue in Web Browser
          </Link>
        </div>

        {/* Footer info */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid #27272a",
            fontSize: "0.75rem",
            color: "#71717a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Instant 1-Tap Telegram Mini App Launch
        </div>
      </div>
    </div>
  );
}
