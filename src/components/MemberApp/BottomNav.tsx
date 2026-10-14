"use client";

interface BottomNavProps {
  activeTab: "home" | "card" | "redeem";
  onSelectTab: (tab: "home" | "card" | "redeem") => void;
}

export default function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  return (
    <nav
      className="bottom-nav-safe"
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#ffffff",
        borderTop: "1px solid var(--card-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "10px 16px max(14px, env(safe-area-inset-bottom, 14px)) 16px",
        zIndex: 50,
      }}
    >
      {/* 1. Home Tab */}
      <button
        type="button"
        onClick={() => onSelectTab("home")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          background: "none",
          border: "none",
          color: activeTab === "home" ? "#dc2626" : "#94a3b8",
          transition: "all 0.15s ease",
          padding: "4px 12px",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={activeTab === "home" ? "#dc2626" : "none"}
          stroke={activeTab === "home" ? "#dc2626" : "currentColor"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: activeTab === "home" ? 700 : 500,
          }}
        >
          Home
        </span>
      </button>

      {/* 2. Card (with QR) Tab */}
      <button
        type="button"
        onClick={() => onSelectTab("card")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          background: "none",
          border: "none",
          color: activeTab === "card" ? "#dc2626" : "#94a3b8",
          transition: "all 0.15s ease",
          padding: "4px 12px",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={activeTab === "card" ? "#dc2626" : "none"}
          stroke={activeTab === "card" ? "#dc2626" : "currentColor"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: activeTab === "card" ? 700 : 500,
          }}
        >
          Card
        </span>
      </button>

      {/* 3. Redeem Tab */}
      <button
        type="button"
        onClick={() => onSelectTab("redeem")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          background: "none",
          border: "none",
          color: activeTab === "redeem" ? "#dc2626" : "#94a3b8",
          transition: "all 0.15s ease",
          padding: "4px 12px",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={activeTab === "redeem" ? "#dc2626" : "none"}
          stroke={activeTab === "redeem" ? "#dc2626" : "currentColor"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: activeTab === "redeem" ? 700 : 500,
          }}
        >
          Redeem
        </span>
      </button>
    </nav>
  );
}
