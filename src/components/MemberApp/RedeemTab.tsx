"use client";

import { useState } from "react";
import { RewardVoucher, ClaimedVoucher } from "./types";

interface RedeemTabProps {
  points: number;
  availableRewards: RewardVoucher[];
  claimedVouchers: ClaimedVoucher[];
  onRedeemReward: (reward: RewardVoucher) => void;
  onOpenPointHistory: () => void;
}

export default function RedeemTab({
  points,
  availableRewards,
  claimedVouchers,
  onRedeemReward,
  onOpenPointHistory,
}: RedeemTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"available" | "claimed">("available");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const handleRedeemClick = (reward: RewardVoucher) => {
    if (points < reward.pointsRequired) return;
    setRedeemingId(reward.id);
    setTimeout(() => {
      onRedeemReward(reward);
      setRedeemingId(null);
    }, 400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* 1. Top Points Card */}
      <div
        style={{
          width: "100%",
          borderRadius: "14px",
          color: "#ffffff",
          padding: "20px 22px",
          boxShadow: "0 8px 24px -4px rgba(220, 38, 38, 0.28)",
          position: "relative",
          overflow: "hidden",
          border: "1px solid #f87171",
          background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontSize: "0.82rem",
              color: "rgba(255, 255, 255, 0.85)",
              fontWeight: 500,
            }}
          >
            Available Balance
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
              marginTop: "4px",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                fontSize: "2.1rem",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {points.toLocaleString()}
            </span>
            <span
              style={{
                fontSize: "0.85rem",
                color: "rgba(255, 255, 255, 0.8)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Points
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenPointHistory}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              color: "#ffffff",
              fontSize: "0.84rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Point History
          </button>
        </div>

        {/* Decorative graphic watermark */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-15px",
            right: "-10px",
            opacity: 0.12,
            pointerEvents: "none",
          }}
        >
          <svg width="140" height="140" viewBox="0 0 24 24" fill="#ffffff">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      </div>

      {/* 3. Sub-tabs: Available Rewards vs Claimed Vouchers */}
      <div
        style={{
          display: "flex",
          backgroundColor: "#f4f4f5",
          padding: "4px",
          borderRadius: "8px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab("available")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "0.82rem",
            fontWeight: activeSubTab === "available" ? 700 : 500,
            backgroundColor: activeSubTab === "available" ? "#ffffff" : "transparent",
            color: activeSubTab === "available" ? "#dc2626" : "var(--text-muted)",
            boxShadow: activeSubTab === "available" ? "0 1px 2px rgba(0, 0, 0, 0.06)" : "none",
          }}
        >
          Available Rewards
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("claimed")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "0.82rem",
            fontWeight: activeSubTab === "claimed" ? 700 : 500,
            backgroundColor: activeSubTab === "claimed" ? "#ffffff" : "transparent",
            color: activeSubTab === "claimed" ? "#dc2626" : "var(--text-muted)",
            boxShadow: activeSubTab === "claimed" ? "0 1px 2px rgba(0, 0, 0, 0.06)" : "none",
          }}
        >
          My Vouchers ({claimedVouchers.length})
        </button>
      </div>

      {/* 4. Tab Content */}
      {activeSubTab === "available" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {availableRewards.map((reward) => {
            const canAfford = points >= reward.pointsRequired;
            const isRedeeming = redeemingId === reward.id;

            return (
              <div
                key={reward.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--card-border)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "stretch",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Left Ticket Badge */}
                <div
                  style={{
                    width: "88px",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px 6px",
                    flexShrink: 0,
                    textAlign: "center",
                    borderRight: "1px dashed rgba(255, 255, 255, 0.4)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.62rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      opacity: 0.85,
                      marginBottom: "4px",
                    }}
                  >
                    Voucher
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      lineHeight: 1.1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {reward.discount}
                  </div>
                </div>

                {/* Middle Information */}
                <div
                  style={{
                    flex: 1,
                    padding: "14px 14px",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "#000000",
                      marginBottom: "2px",
                      lineHeight: 1.3,
                    }}
                  >
                    {reward.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    {reward.description}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: canAfford ? "#dc2626" : "var(--text-muted)",
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill={canAfford ? "#f59e0b" : "#cbd5e1"}
                        stroke={canAfford ? "#f59e0b" : "#cbd5e1"}
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {reward.pointsRequired.toLocaleString()} pts required
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford || isRedeeming}
                      onClick={() => handleRedeemClick(reward)}
                      className="btn-primary"
                      style={{
                        padding: "6px 14px",
                        fontSize: "0.78rem",
                        borderRadius: "20px",
                        backgroundColor: canAfford ? "#dc2626" : "#e2e8f0",
                        color: canAfford ? "#ffffff" : "#94a3b8",
                        borderColor: canAfford ? "#dc2626" : "#e2e8f0",
                      }}
                    >
                      {isRedeeming ? "Claiming..." : canAfford ? "Redeem" : "Locked"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* My Claimed Vouchers */
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {claimedVouchers.length === 0 ? (
            <div
              style={{
                padding: "36px 16px",
                textAlign: "center",
                backgroundColor: "#fafafa",
                border: "1px dashed var(--card-border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", color: "var(--text-muted)" }}>
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#000000" }}>
                No claimed vouchers yet
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Redeem available rewards using your points balance.
              </div>
            </div>
          ) : (
            claimedVouchers.map((voucher) => (
              <div
                key={voucher.voucherCode}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--card-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  textAlign: "left",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#000000" }}>
                      {voucher.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {voucher.discount} discount on checkout
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "12px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                    }}
                  >
                    ACTIVE
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: "#fafafa",
                    border: "1px solid var(--card-border-subtle)",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Voucher Code
                    </div>
                    <div className="mono" style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "1px", color: "#dc2626" }}>
                      {voucher.voucherCode}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Show to cashier
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
