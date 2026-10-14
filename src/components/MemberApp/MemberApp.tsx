"use client";

import { useState, useEffect } from "react";
import { MemberUser, RewardVoucher, ClaimedVoucher, PointTransaction } from "./types";
import HomeTab from "./HomeTab";
import CardTab from "./CardTab";
import RedeemTab from "./RedeemTab";
import ProfileView from "./ProfileView";
import BottomNav from "./BottomNav";
import { PointHistoryModal, FaqModal, LocationsModal } from "./Modals";

interface MemberAppProps {
  user: MemberUser;
  isTelegram?: boolean;
  onRequestNotificationPermission?: () => void | Promise<boolean>;
  onRequestPhoneNumber?: () => void;
  onReset: () => void;
  onUserUpdate?: (updatedUser: MemberUser) => void;
}

const DEFAULT_REWARDS: RewardVoucher[] = [
  {
    id: "r1",
    title: "Membership Voucher 20,000 Riel",
    description: "Equivalent to $5.00 USD cash off your supermarket basket",
    discount: "20,000៛",
    pointsRequired: 250,
    category: "voucher",
    expiryDays: 30,
  },
  {
    id: "r2",
    title: "Free Premium Coffee & Drink Pass",
    description: "Redeem any iced latte, cappuccino, or cold brew",
    discount: "FREE",
    pointsRequired: 150,
    category: "beverage",
    expiryDays: 14,
  },
  {
    id: "r3",
    title: "10% Supermarket Basket Discount",
    description: "Valid across all fresh produce, dairy, and bakery items",
    discount: "10% OFF",
    pointsRequired: 400,
    category: "discount",
    expiryDays: 30,
  },
  {
    id: "r4",
    title: "VIP Shopping Voucher 40,000 Riel",
    description: "Equivalent to $10.00 USD instant discount at checkout",
    discount: "40,000៛",
    pointsRequired: 500,
    category: "voucher",
    expiryDays: 45,
  },
];

export default function MemberApp({
  user,
  onRequestNotificationPermission,
  onRequestPhoneNumber,
  onReset,
  onUserUpdate,
}: MemberAppProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"home" | "card" | "redeem">("card");
  const [isViewingProfile, setIsViewingProfile] = useState<boolean>(false);

  // Dynamic user state that can be updated from ProfileView
  const [currentUser, setCurrentUser] = useState<MemberUser>(user);
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const handleUserUpdate = (updated: MemberUser) => {
    setCurrentUser(updated);
    if (onUserUpdate) {
      onUserUpdate(updated);
    }
  };

  // Points & Vouchers state persisted in localStorage
  const pointsKey = `fastauth_pts_${currentUser.id}`;
  const vouchersKey = `fastauth_vouchers_${currentUser.id}`;
  const historyKey = `fastauth_history_${currentUser.id}`;

  const [points, setPoints] = useState<number>(500);
  const [claimedVouchers, setClaimedVouchers] = useState<ClaimedVoucher[]>([
    {
      id: "v-welcome",
      title: "FairPrice Welcome Voucher 20,000 Riel",
      description: "FairPrice sign-up welcome promotion voucher",
      discount: "20,000៛",
      pointsRequired: 0,
      category: "voucher",
      expiryDays: 30,
      voucherCode: `FP-WELC-${currentUser.id.slice(-4).toUpperCase()}`,
      claimedAt: new Date().toLocaleDateString(),
      isUsed: false,
    },
  ]);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([
    {
      id: "tx-init",
      title: "Welcome Registration Bonus",
      date: new Date().toLocaleDateString(),
      amount: 500,
      type: "bonus",
    },
  ]);

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isLocationsOpen, setIsLocationsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const storedPoints = localStorage.getItem(pointsKey);
      if (storedPoints !== null) {
        setPoints(parseInt(storedPoints, 10));
      }
      const storedVouchers = localStorage.getItem(vouchersKey);
      if (storedVouchers) {
        setClaimedVouchers(JSON.parse(storedVouchers));
      }
      const storedHistory = localStorage.getItem(historyKey);
      if (storedHistory) {
        setPointHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Error reading member app storage:", e);
    }
  }, [pointsKey, vouchersKey, historyKey]);

  // Handle reward redemption
  const handleRedeemReward = (reward: RewardVoucher) => {
    if (points < reward.pointsRequired) return;

    const newPoints = points - reward.pointsRequired;
    const newClaimed: ClaimedVoucher = {
      ...reward,
      voucherCode: `FP-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      claimedAt: new Date().toLocaleDateString(),
      isUsed: false,
    };

    const newHistory: PointTransaction = {
      id: `tx-${Date.now()}`,
      title: `Redeemed ${reward.title}`,
      date: new Date().toLocaleDateString(),
      amount: -reward.pointsRequired,
      type: "redeem",
    };

    const updatedVouchers = [newClaimed, ...claimedVouchers];
    const updatedHistory = [newHistory, ...pointHistory];

    setPoints(newPoints);
    setClaimedVouchers(updatedVouchers);
    setPointHistory(updatedHistory);

    try {
      localStorage.setItem(pointsKey, newPoints.toString());
      localStorage.setItem(vouchersKey, JSON.stringify(updatedVouchers));
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    } catch (e) {}

    // Toast feedback
    setToastMessage(`Claimed ${reward.title}! Check "My Vouchers"`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            right: "16px",
            backgroundColor: "#dc2626",
            color: "#ffffff",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.82rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 90,
            boxShadow: "0 4px 14px rgba(220, 38, 38, 0.25)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{toastMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              padding: "2px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close notification"
          >
            <svg
              width="13"
              height="13"
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
        </div>
      )}

      {/* Main Top Header (hidden when inside Profile view) */}
      {!isViewingProfile && (
        <header
          style={{
            flexShrink: 0,
            padding: "16px 20px 14px 20px",
            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 10px rgba(220, 38, 38, 0.25)",
            zIndex: 10,
          }}
        >
          {/* Left Greeting & Stat Pills */}
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              {activeTab === "home" ? (
                <>
                  {getGreeting()}
                  {currentUser.firstName
                    ? `, ${currentUser.firstName.charAt(0).toUpperCase() + currentUser.firstName.slice(1)}`
                    : "!"}
                </>
              ) : activeTab === "card" ? (
                "My Member Card"
              ) : (
                "Redeem Rewards"
              )}
            </div>

            {activeTab === "home" ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "5px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("redeem")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    backgroundColor: "rgba(255, 255, 255, 0.18)",
                    backdropFilter: "blur(4px)",
                    border: "1px solid rgba(255, 255, 255, 0.28)",
                    borderRadius: "20px",
                    padding: "3px 10px",
                    color: "#ffffff",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="View points & redeem"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="#fef08a"
                    stroke="#fef08a"
                    strokeWidth="1"
                    style={{ flexShrink: 0 }}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>{points.toLocaleString()} points</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("card")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    backgroundColor: "rgba(255, 255, 255, 0.18)",
                    backdropFilter: "blur(4px)",
                    border: "1px solid rgba(255, 255, 255, 0.28)",
                    borderRadius: "20px",
                    padding: "3px 10px",
                    color: "#ffffff",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="View vouchers & card"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>
                  <span>
                    {claimedVouchers.length}{" "}
                    {claimedVouchers.length === 1 ? "voucher" : "vouchers"}
                  </span>
                </button>
              </div>
            ) : (
              <div
                style={{
                  fontSize: "0.74rem",
                  color: "rgba(255, 255, 255, 0.88)",
                  marginTop: "2px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {activeTab === "card" ? (
                  "Show QR code or barcode to cashier"
                ) : (
                  <>
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="#fef08a"
                      stroke="#fef08a"
                      strokeWidth="1"
                      style={{ flexShrink: 0 }}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>{points.toLocaleString()} points balance</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Avatar Button (clicking opens Profile screen) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsViewingProfile(true)}
              title="Open Profile"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                border: "2px solid #facc15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#dc2626",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer",
                position: "relative",
                padding: 0,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                transition: "transform 0.15s ease",
              }}
            >
              <span>
                {currentUser.firstName
                  ? currentUser.firstName.charAt(0).toUpperCase()
                  : "M"}
              </span>

              {/* Mini Crown Badge */}
              <div
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-3px",
                  backgroundColor: "#facc15",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.25)",
                }}
              >
                <svg width="10" height="8" viewBox="0 0 24 24" fill="#78350f">
                  <path d="M2 19h20L19 7l-4.5 4.5L12 3l-2.5 8.5L5 7 2 19z" />
                </svg>
              </div>
            </button>
          </div>
        </header>
      )}

      {/* Main Tab / Profile Content Area (Scrolls independently while Header and BottomNav remain locked) */}
      <div className="app-content-scroll">
        {isViewingProfile ? (
          <ProfileView
            user={currentUser}
            onBack={() => setIsViewingProfile(false)}
            onRequestNotificationPermission={onRequestNotificationPermission}
            onRequestPhoneNumber={onRequestPhoneNumber}
            onSignOut={onReset}
            onUserUpdate={handleUserUpdate}
          />
        ) : (
          <>
            {activeTab === "home" && (
              <HomeTab
                user={currentUser}
                points={points}
                vouchersCount={claimedVouchers.length}
                onNavigateToCard={() => setActiveTab("card")}
                onNavigateToRedeem={() => setActiveTab("redeem")}
              />
            )}

            {activeTab === "card" && (
              <CardTab
                user={currentUser}
                points={points}
                vouchersCount={claimedVouchers.length}
                onRequestNotificationPermission={onRequestNotificationPermission}
                onUserUpdate={handleUserUpdate}
                onOpenFaq={() => setIsFaqOpen(true)}
                onOpenLocations={() => setIsLocationsOpen(true)}
              />
            )}

            {activeTab === "redeem" && (
              <RedeemTab
                points={points}
                availableRewards={DEFAULT_REWARDS}
                claimedVouchers={claimedVouchers}
                onRedeemReward={handleRedeemReward}
                onOpenPointHistory={() => setIsHistoryOpen(true)}
              />
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation (active on main tabs) */}
      {!isViewingProfile && (
        <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
      )}

      {/* Modals */}
      <PointHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        transactions={pointHistory}
      />
      <FaqModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />
      <LocationsModal isOpen={isLocationsOpen} onClose={() => setIsLocationsOpen(false)} />
    </div>
  );
}
