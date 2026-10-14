"use client";

import { useEffect, useState, useRef } from "react";
import PhoneStep from "@/components/PhoneStep";
import OtpStep from "@/components/OtpStep";
import ProfileStep from "@/components/ProfileStep";
import SuccessStep from "@/components/SuccessStep";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            allows_write_to_pm?: boolean;
          };
        };
        requestWriteAccess?: (callback?: (allowed: boolean) => void) => void;
        requestContact?: (callback?: (shared: boolean, event?: any) => void) => void;
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
      };
    };
  }
}

type Step = "phone" | "otp" | "profile" | "success";

export default function Home() {
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [debugCode, setDebugCode] = useState<string | undefined>();
  const [user, setUser] = useState<any>(null);

  const [isTelegram, setIsTelegram] = useState(false);
  const [isCheckingTelegram, setIsCheckingTelegram] = useState(false);

  const authHandledRef = useRef(false);

  // Strict check: only return true if ACTUALLY running inside a Telegram Mini App
  const isRunningInTelegram = () => {
    if (typeof window === "undefined") return false;

    // 1. Launched with Telegram launch params in URL
    const hasHashData = window.location.hash.includes("tgWebAppData=");
    const hasSearchData = window.location.search.includes("tgWebAppData=");

    // 2. Native Telegram app WebView bridge (Android / iOS / Desktop)
    const hasTelegramProxy = Boolean(
      (window as any).TelegramWebviewProxy ||
      (window as any).TelegramGameProxy ||
      (window as any).webkit?.messageHandlers?.TelegramWebviewProxy
    );

    return hasHashData || hasSearchData || hasTelegramProxy;
  };

  // Helper to extract Telegram Data from SDK or URL hash/query
  const extractTelegramData = () => {
    if (typeof window === "undefined") return null;

    // 1. Check window.Telegram.WebApp SDK
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      return {
        user: tg.initDataUnsafe.user,
        initData: tg.initData || "",
      };
    }

    // 2. Check window.location.hash (Telegram WebApp URL fragment #tgWebAppData=...)
    if (window.location.hash) {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const tgWebAppData = params.get("tgWebAppData");
        if (tgWebAppData) {
          const innerParams = new URLSearchParams(tgWebAppData);
          const userStr = innerParams.get("user");
          if (userStr) {
            const parsedUser = JSON.parse(decodeURIComponent(userStr));
            if (parsedUser && parsedUser.id) {
              return {
                user: parsedUser,
                initData: tgWebAppData,
              };
            }
          }
        }
      } catch (err) {
        console.error("Error parsing tgWebAppData from hash:", err);
      }
    }

    // 3. Check window.location.search
    if (window.location.search) {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const tgWebAppData = searchParams.get("tgWebAppData");
        if (tgWebAppData) {
          const innerParams = new URLSearchParams(tgWebAppData);
          const userStr = innerParams.get("user");
          if (userStr) {
            const parsedUser = JSON.parse(decodeURIComponent(userStr));
            if (parsedUser && parsedUser.id) {
              return {
                user: parsedUser,
                initData: tgWebAppData,
              };
            }
          }
        }
      } catch (err) {
        console.error("Error parsing tgWebAppData from search:", err);
      }
    }

    return null;
  };

  // Telegram detection - strictly only runs if launched in Telegram Mini App
  useEffect(() => {
    // If not running in Telegram, clear any stale session storage and skip completely
    if (!isRunningInTelegram()) {
      try {
        sessionStorage.removeItem("__telegram__initParams");
        sessionStorage.removeItem("__telegram__themeParams");
        document.documentElement.classList.remove("tma-preload");
      } catch (e) {}
      return;
    }

    setIsTelegram(true);
    try {
      document.body.classList.add("in-telegram");
      window.Telegram?.WebApp?.ready?.();
      window.Telegram?.WebApp?.expand?.();
    } catch (e) {}

    const isWriteAllowed = (userData: any) => {
      const tg = window.Telegram?.WebApp;
      return Boolean(
        userData?.allows_write_to_pm ||
        tg?.initDataUnsafe?.user?.allows_write_to_pm ||
        Boolean((tg?.initDataUnsafe as any)?.can_send_after)
      );
    };

    const tgData = extractTelegramData();
    if (tgData && !authHandledRef.current) {
      authHandledRef.current = true;
      setIsCheckingTelegram(true);

      // Clean the Telegram hash from URL address bar
      try {
        if (window.location.hash.includes("tgWebAppData")) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      } catch (e) {}

      window.Telegram?.WebApp?.ready?.();
      window.Telegram?.WebApp?.expand?.();
      handleTelegramAuth(tgData.user, tgData.initData, isWriteAllowed(tgData.user));
      return;
    }

    // If inside Telegram environment but SDK is still attaching, poll for at most 300ms
    setIsCheckingTelegram(true);
    let attempts = 0;
    const maxAttempts = 6; // 6 * 50ms = 300ms max

    const interval = setInterval(() => {
      attempts++;
      const data = extractTelegramData();
      if (data && !authHandledRef.current) {
        authHandledRef.current = true;
        clearInterval(interval);

        try {
          if (window.location.hash.includes("tgWebAppData")) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
        } catch (e) {}

        window.Telegram?.WebApp?.ready?.();
        window.Telegram?.WebApp?.expand?.();
        handleTelegramAuth(data.user, data.initData, isWriteAllowed(data.user));
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setIsCheckingTelegram(false);
        try {
          document.documentElement.classList.remove("tma-preload");
        } catch (e) {}
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const [isRestoringSession, setIsRestoringSession] = useState(true);

  // Restore stored web user session on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("fastauth_user_id");
      if (storedId && !user) {
        setIsRestoringSession(true);
        fetch(`/api/user/me?id=${storedId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.user) {
              setUser(data.user);
              if (data.user.age && data.user.gender) {
                setStep("success");
              } else {
                setStep("profile");
              }
            } else {
              localStorage.removeItem("fastauth_user_id");
            }
          })
          .catch((err) => {
            console.warn("Could not restore session:", err);
          })
          .finally(() => {
            setIsRestoringSession(false);
          });
      } else {
        setIsRestoringSession(false);
      }
    } else {
      setIsRestoringSession(false);
    }
  }, []);

  const handleTelegramAuth = async (
    tgUser: { id: number; first_name: string; last_name?: string; username?: string; allows_write_to_pm?: boolean },
    initData: string,
    notificationAllowed?: boolean
  ) => {
    try {
      const allowed =
        notificationAllowed !== undefined
          ? notificationAllowed
          : Boolean(
              tgUser?.allows_write_to_pm ||
              window.Telegram?.WebApp?.initDataUnsafe?.user?.allows_write_to_pm ||
              Boolean((window.Telegram?.WebApp?.initDataUnsafe as any)?.can_send_after)
            );

      const res = await fetch("/api/auth/telegram-bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          telegramUser: tgUser,
          canReceiveNotifications: allowed,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        if (typeof window !== "undefined") {
          localStorage.setItem("fastauth_user_id", data.user.id);
        }
        // If user already entered age & gender in database, go straight to QR pass!
        if (data.user.age && data.user.gender) {
          setStep("success");
        } else {
          // Bypassed OTP! Go directly to Age & Gender
          setStep("profile");
        }
      }
    } catch (err) {
      console.error("Error authenticating Telegram user:", err);
    } finally {
      setIsCheckingTelegram(false);
      try {
        document.documentElement.classList.remove("tma-preload");
      } catch (e) {}
    }
  };

  const handleRequestTelegramWriteAccess = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (isTelegram && window.Telegram?.WebApp?.requestWriteAccess) {
        window.Telegram.WebApp.requestWriteAccess(async (allowed: boolean) => {
          if (user) {
            const updated = { ...user, canReceiveNotifications: allowed };
            setUser(updated);
            try {
              await fetch("/api/user/notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user.id,
                  telegramId: user.telegramId,
                  canReceiveNotifications: allowed,
                }),
              });
            } catch (err) {
              console.error("Failed to persist notification status:", err);
            }
          }
          resolve(Boolean(allowed));
        });
      } else {
        // Fallback for browser testing
        if (user) {
          const updated = { ...user, canReceiveNotifications: true };
          setUser(updated);
          fetch("/api/user/notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              telegramId: user.telegramId,
              canReceiveNotifications: true,
            }),
          }).catch(console.error);
        }
        resolve(true);
      }
    });
  };

  const handleRequestTelegramContact = () => {
    if (isTelegram && window.Telegram?.WebApp?.requestContact) {
      window.Telegram.WebApp.requestContact(async (shared: boolean, event: any) => {
        if (!shared) return;

        const rawPhone =
          event?.responseUnsafe?.contact?.phone_number ||
          event?.responseUnsafe?.phone_number ||
          event?.contact?.phone_number ||
          event?.phone_number;

        if (rawPhone && user) {
          const cleanPhone = String(rawPhone).startsWith("+") ? String(rawPhone) : `+${rawPhone}`;
          setUser({ ...user, phoneNumber: cleanPhone });
          await fetch("/api/user/save-phone", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              phoneNumber: cleanPhone,
            }),
          });
        }
      });
    } else {
      const manualPhone = window.prompt("Enter phone number to link (e.g. +85512345678):");
      if (manualPhone && manualPhone.trim() && user) {
        const cleanPhone = manualPhone.trim().startsWith("+") ? manualPhone.trim() : `+${manualPhone.trim()}`;
        setUser({ ...user, phoneNumber: cleanPhone });
        fetch("/api/user/save-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            phoneNumber: cleanPhone,
          }),
        });
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <main
        className={`app-page-main ${step === "success" ? "app-page-main--app" : "app-page-main--auth"}`}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: step === "success" ? 0 : "24px 16px",
          background: step === "success" ? "#ffffff" : "linear-gradient(180deg, #fff5f5 0%, #ffffff 320px, #ffffff 100%)",
        }}
      >
        {isCheckingTelegram || isRestoringSession ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "18px",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            {/* FairPrice Brand Logo Container */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "10px 22px",
                borderRadius: "14px",
                border: "1px solid #e4e4e7",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/fairprice-logo.webp"
                alt="FairPrice"
                decoding="async"
                style={{
                  height: "38px",
                  width: "auto",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "#dc2626",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                FairPrice Member Pass
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Loading your pass &amp; rewards...
              </div>
            </div>

            {/* Brand Spinner */}
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid #fee2e2",
                borderTopColor: "#dc2626",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        ) : (
          <>
            {/* Dynamic Step View */}
            {step === "phone" && (
              <PhoneStep
                onOtpSent={(phone, code) => {
                  setPhoneNumber(phone);
                  setDebugCode(code);
                  setStep("otp");
                }}
              />
            )}

            {step === "otp" && (
              <OtpStep
                phoneNumber={phoneNumber}
                debugCode={debugCode}
                onBack={() => setStep("phone")}
                onOtpVerified={(verifiedUser, isNew) => {
                  setUser(verifiedUser);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("fastauth_user_id", verifiedUser.id);
                  }
                  if (isNew) {
                    setStep("profile");
                  } else {
                    setStep("success");
                  }
                }}
              />
            )}

            {step === "profile" && user && (
              <ProfileStep
                user={user}
                onRequestNotificationPermission={handleRequestTelegramWriteAccess}
                onProfileSaved={(updatedUser) => {
                  setUser(updatedUser);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("fastauth_user_id", updatedUser.id);
                  }
                  setStep("success");
                }}
              />
            )}

            {step === "success" && user && (
              <SuccessStep
                user={user}
                isTelegram={isTelegram || user.authProvider === "telegram" || Boolean(user.telegramId)}
                onRequestNotificationPermission={handleRequestTelegramWriteAccess}
                onRequestPhoneNumber={handleRequestTelegramContact}
                onUserUpdate={(updated) => setUser(updated)}
                onReset={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("fastauth_user_id");
                  }
                  setUser(null);
                  setPhoneNumber("");
                  setDebugCode(undefined);
                  setStep("phone");
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
