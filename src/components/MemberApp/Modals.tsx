"use client";

import { PointTransaction } from "./types";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BaseModal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#000000" }}>
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "#f4f4f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              color: "#000000",
              cursor: "pointer",
            }}
            aria-label="Close modal"
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

        <div style={{ padding: "20px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

export function PointHistoryModal({
  isOpen,
  onClose,
  transactions,
}: {
  isOpen: boolean;
  onClose: () => void;
  transactions: PointTransaction[];
}) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Point History">
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              backgroundColor: "#fafafa",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--card-border-subtle)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#000000" }}>
                {tx.title}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                {tx.date}
              </div>
            </div>
            <div
              className="mono"
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                color: tx.amount > 0 ? "#16a34a" : "#000000",
              }}
            >
              {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
            </div>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}

export function FaqModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="FAQs & Contact Us">
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#000000", marginBottom: "4px" }}>
            How do I earn points?
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Present your QR Code to the cashier before paying. You will earn 1 point for every $1 spent in any partner branch.
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#000000", marginBottom: "4px" }}>
            How do I redeem vouchers?
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Go to the Redeem tab, select an available voucher, and click Redeem. Show the active voucher code to the cashier to apply the discount.
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#000000", marginBottom: "4px" }}>
            Need Support?
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Reach out via Telegram Bot: <strong>@techpre_bot</strong> or contact our customer hotline at <strong>+855 23 888 999</strong> (Mon–Sun 8:00 AM – 9:00 PM).
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export function LocationsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const branches = [
    { name: "Sihanouk Blvd Branch", address: "Preah Sihanouk Blvd, Phnom Penh", hours: "7:00 AM - 10:00 PM" },
    { name: "Toul Kork Branch", address: "Street 315, Sangkat Boeung Kak 1, Phnom Penh", hours: "7:00 AM - 9:30 PM" },
    { name: "BKK1 Premium Flagship", address: "St 57, BKK1, Phnom Penh", hours: "6:30 AM - 10:30 PM" },
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Store Locations">
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
        {branches.map((b) => (
          <div
            key={b.name}
            style={{
              padding: "14px",
              backgroundColor: "#fafafa",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--card-border-subtle)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#000000" }}>
              {b.name}
            </div>
            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {b.address}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#000000", fontWeight: 600, marginTop: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
              <svg
                width="12"
                height="12"
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
              <span>{b.hours}</span>
            </div>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}
