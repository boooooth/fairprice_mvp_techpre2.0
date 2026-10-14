"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";

interface UserRecord {
  id: string;
  role: string;
  phoneNumber?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  gender?: string | null;
  canReceiveNotifications: boolean;
  authProvider: string;
  createdAt: string;
}

interface AnnouncementScheduleRecord {
  id: string;
  title?: string | null;
  message: string;
  imageUrl?: string | null;
  imageName?: string | null;
  scheduleType: "once" | "daily" | "weekly";
  targetTime: string;
  specificDate?: string | null;
  dayOfWeek?: number | null;
  isActive: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
}

const WEEKDAYS = [
  { val: 0, label: "Sunday", short: "Sun" },
  { val: 1, label: "Monday", short: "Mon" },
  { val: 2, label: "Tuesday", short: "Tue" },
  { val: 3, label: "Wednesday", short: "Wed" },
  { val: 4, label: "Thursday", short: "Thu" },
  { val: 5, label: "Friday", short: "Fri" },
  { val: 6, label: "Saturday", short: "Sat" },
];

interface Stats {
  totalUsers: number;
  telegramUsers: number;
  webUsers: number;
  notificationAllowed: number;
  admins: number;
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Tab state: customer records vs scheduled announcements
  const [adminTab, setAdminTab] = useState<"users" | "schedules">("users");

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [schedules, setSchedules] = useState<AnnouncementScheduleRecord[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "web" | "telegram">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Messaging & Scheduling Modal state
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [targetUser, setTargetUser] = useState<UserRecord | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Schedule configuration
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleType, setScheduleType] = useState<"once" | "daily" | "weekly">("daily");
  const [targetTime, setTargetTime] = useState("09:00");
  const [specificDate, setSpecificDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(3); // Default: Wednesday

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFeedback({ type: "error", text: "Image size must be under 10MB" });
        return;
      }
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const res = await fetch("/api/admin/schedules");
      const data = await res.json();
      if (data.success) {
        setSchedules(data.schedules);
      }
    } catch (err) {
      console.error("Error fetching schedules:", err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleToggleScheduleActive = async (scheduleId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedules((prev) =>
          prev.map((s) => (s.id === scheduleId ? data.schedule : s))
        );
      }
    } catch (err) {
      console.error("Error toggling schedule active:", err);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this scheduled announcement?")) return;
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      }
    } catch (err) {
      console.error("Error deleting schedule:", err);
    }
  };

  const handleRunScheduleNow = async (scheduleId: string) => {
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}/run`, {
        method: "POST",
      });
      const data = await res.json();
      alert(data.message || (data.success ? "Announcement triggered!" : "Failed to trigger"));
      fetchSchedules();
    } catch (err) {
      console.error("Error running schedule:", err);
    }
  };

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        let userId = typeof window !== "undefined" ? localStorage.getItem("fastauth_user_id") : null;

        if (userId) {
          const res = await fetch(`/api/user/me?id=${userId}`);
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            if (data.user.role === "admin") {
              fetchUsers();
              fetchSchedules();
            }
          } else {
            localStorage.removeItem("fastauth_user_id");
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyAdmin();
  }, []);

  const handleToggleRole = async (user: UserRecord) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openSendMessageModal = (user: UserRecord) => {
    setTargetUser(user);
    setIsBroadcast(false);
    setMessageText("");
    handleRemoveImage();
    setFeedback(null);
    setMessageModalOpen(true);
  };

  const openBroadcastModal = (mode: "now" | "schedule" = "now") => {
    setTargetUser(null);
    setIsBroadcast(true);
    setSendMode(mode);
    setMessageText("");
    setScheduleTitle("");
    setScheduleType("daily");
    setTargetTime("09:00");
    setSelectedDayOfWeek(3); // Wednesday
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSpecificDate(tomorrow.toISOString().split("T")[0]);
    handleRemoveImage();
    setFeedback(null);
    setMessageModalOpen(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSendingMessage(true);
    setFeedback(null);

    try {
      if (isBroadcast && sendMode === "schedule") {
        // Create scheduled announcement
        const formData = new FormData();
        if (scheduleTitle.trim()) {
          formData.append("title", scheduleTitle.trim());
        }
        formData.append("message", messageText.trim());
        formData.append("scheduleType", scheduleType);
        formData.append("targetTime", targetTime);
        if (scheduleType === "once") {
          formData.append("specificDate", specificDate);
        } else if (scheduleType === "weekly") {
          formData.append("dayOfWeek", String(selectedDayOfWeek));
        }
        if (selectedImage) {
          formData.append("image", selectedImage);
        }

        const res = await fetch("/api/admin/schedules", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          setFeedback({
            type: "success",
            text: data.message || "Schedule created successfully!",
          });
          fetchSchedules();
          handleRemoveImage();
          setTimeout(() => {
            setMessageModalOpen(false);
          }, 2000);
        } else {
          setFeedback({
            type: "error",
            text: data.error || "Failed to create schedule",
          });
        }
      } else {
        // Immediate send
        const formData = new FormData();
        formData.append("broadcast", String(isBroadcast));
        if (targetUser?.telegramId) {
          formData.append("targetTelegramId", targetUser.telegramId);
        }
        formData.append("message", messageText.trim());
        if (selectedImage) {
          formData.append("image", selectedImage);
        }

        const res = await fetch("/api/admin/send-message", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          setFeedback({
            type: "success",
            text: data.message || "Message sent successfully!",
          });
          handleRemoveImage();
          setTimeout(() => {
            if (!feedback?.text.includes("error")) {
              setMessageModalOpen(false);
            }
          }, 2200);
        } else {
          setFeedback({
            type: "error",
            text: data.error || "Failed to send message",
          });
        }
      }
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error sending message",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "web" && u.authProvider === "web") ||
      (filter === "telegram" && u.authProvider === "telegram");

    const matchesSearch =
      !searchTerm ||
      (u.phoneNumber && u.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.telegramUsername && u.telegramUsername.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.lastName && u.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.telegramId && u.telegramId.includes(searchTerm));

    return matchesFilter && matchesSearch;
  });

  if (isCheckingAuth) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", display: "flex", flexDirection: "column" }}>
        <Header user={currentUser} />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "var(--text-muted)" }}>
            <div style={{ width: "28px", height: "28px", border: "2px solid #e5e7eb", borderTopColor: "#000", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "0.85rem" }}>Verifying permissions...</span>
          </div>
        </main>
      </div>
    );
  }

  if (currentUser?.role !== "admin") {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "#ffffff", display: "flex", flexDirection: "column" }}>
        <Header user={currentUser} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 4vw, 48px) clamp(14px, 4vw, 24px)" }}>
          <div style={{ maxWidth: "440px", width: "100%", padding: "clamp(24px, 6vw, 40px) clamp(18px, 6vw, 32px)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#f4f4f5", border: "1px solid #e4e4e7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", color: "#18181b" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.035em", color: "#000", marginBottom: "8px" }}>
              Admin Access Required
            </h1>
            <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginBottom: "24px" }}>
              This portal is restricted to authorized FairPrice administrators.
            </p>
            <Link href="/" className="btn-primary" style={{ width: "100%", padding: "12px", justifyContent: "center" }}>
              Return to App
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-page-root">
      <Header user={currentUser} />

      <main className="admin-main-scroll">
        {/* Header section */}
        <div className="admin-header-container">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
              <Link
                href="/"
                className="btn-secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to App
              </Link>
              <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                FairPrice Admin Portal
              </span>
            </div>
            <h1 className="admin-header-title">Admin Dashboard</h1>
            <p className="admin-header-subtitle">
              Manage customer records, inspect authentication channels, and dispatch Telegram announcements.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              onClick={() => openBroadcastModal(adminTab === "schedules" ? "schedule" : "now")}
              className="btn-primary btn-broadcast"
              style={{
                padding: "10px 18px",
                fontSize: "0.86rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 11 18-5v12L3 14v-3z" />
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
              </svg>
              Broadcast Announcement
            </button>

            <div className="admin-header-actions-row">
              <button
                onClick={() => { fetchUsers(); fetchSchedules(); }}
                className="btn-secondary"
                style={{
                  padding: "9px 14px",
                  fontSize: "0.84rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="mono admin-stat-label">Total Users</div>
              <div className="admin-stat-number">{stats.totalUsers}</div>
            </div>

            <div className="admin-stat-card">
              <div className="mono admin-stat-label">Telegram App</div>
              <div className="admin-stat-number">{stats.telegramUsers}</div>
            </div>

            <div className="admin-stat-card">
              <div className="mono admin-stat-label">Web SMS Auth</div>
              <div className="admin-stat-number">{stats.webUsers}</div>
            </div>

            <div className="admin-stat-card">
              <div className="mono admin-stat-label">Notifs Allowed</div>
              <div className="admin-stat-number">{stats.notificationAllowed}</div>
            </div>
          </div>
        )}

        {/* Navigation Tabs: Customers vs Scheduled Announcements */}
        <div className="admin-tabs-nav">
          <button
            type="button"
            onClick={() => setAdminTab("users")}
            className="admin-tab-btn"
            style={{
              borderBottom: adminTab === "users" ? "2px solid #000000" : "2px solid transparent",
              color: adminTab === "users" ? "#000000" : "var(--text-muted)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Customer Records ({users.length})
          </button>

          <button
            type="button"
            onClick={() => { setAdminTab("schedules"); fetchSchedules(); }}
            className="admin-tab-btn"
            style={{
              borderBottom: adminTab === "schedules" ? "2px solid #000000" : "2px solid transparent",
              color: adminTab === "schedules" ? "#000000" : "var(--text-muted)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Scheduled Announcements ({schedules.length})
          </button>
        </div>

        {adminTab === "users" && (
          <>
            {/* Filter and Search Bar */}
            <div className="admin-filter-bar">
              <div className="admin-filter-buttons">
                {(["all", "telegram", "web"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    style={{
                      borderRadius: "var(--radius-sm)",
                      fontWeight: 600,
                      backgroundColor: filter === tab ? "#000000" : "#ffffff",
                      color: filter === tab ? "#ffffff" : "var(--text-muted)",
                      border: `1px solid ${filter === tab ? "#000000" : "var(--card-border)"}`,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab === "all" ? "All Users" : tab === "telegram" ? "Telegram" : "Web SMS"}
                  </button>
                ))}
              </div>

              <input
                type="text"
                className="admin-search-input"
                placeholder="Search phone, username, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Desktop Users Table */}
            <div className="admin-desktop-table">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.88rem",
                }}
              >
                <thead>
                  <tr
                    className="mono"
                    style={{
                      borderBottom: "1px solid var(--card-border)",
                      backgroundColor: "#fafafa",
                      color: "var(--text-muted)",
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <th style={{ padding: "12px 16px" }}>User</th>
                    <th style={{ padding: "12px 16px" }}>Provider</th>
                    <th style={{ padding: "12px 16px" }}>Age / Gender</th>
                    <th style={{ padding: "12px 16px" }}>Notification</th>
                    <th style={{ padding: "12px 16px" }}>Role</th>
                    <th style={{ padding: "12px 16px" }}>Joined</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                        Loading user records...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                        No users registered yet.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: "1px solid var(--card-border-subtle)",
                        }}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontWeight: 600, color: "#000000" }}>
                            {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.phoneNumber || "Anonymous"}
                          </div>
                          <div className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {u.phoneNumber || (u.telegramUsername ? `@${u.telegramUsername}` : `ID: ${u.telegramId}`)}
                          </div>
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <span
                            className="mono"
                            style={{
                              display: "inline-block",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.74rem",
                              fontWeight: 500,
                              backgroundColor: "#f4f4f5",
                              border: "1px solid #e4e4e7",
                              color: "#18181b",
                            }}
                          >
                            {u.authProvider === "telegram" ? "telegram" : "sms"}
                          </span>
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          {u.age ? (
                            <span>
                              {u.age} yrs • {u.gender}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                              Pending
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          {u.canReceiveNotifications ? (
                            <span className="mono" style={{ color: "#16a34a", fontSize: "0.78rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>allowed</span>
                            </span>
                          ) : (
                            <span className="mono" style={{ color: "var(--text-subtle)", fontSize: "0.78rem" }}>
                              —
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleRole(u)}
                            title="Click to toggle role (user <-> admin)"
                            className="mono"
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.74rem",
                              fontWeight: 600,
                              backgroundColor: u.role === "admin" ? "#000000" : "#f4f4f5",
                              color: u.role === "admin" ? "#ffffff" : "#18181b",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {u.role}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                            </svg>
                          </button>
                        </td>

                        <td className="mono" style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            {u.authProvider === "telegram" && (
                              <button
                                type="button"
                                onClick={() => openSendMessageModal(u)}
                                className="btn-secondary"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Message
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id)}
                              aria-label="Delete user"
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "transparent",
                                color: "#ef4444",
                                borderRadius: "4px",
                                border: "none",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Customer Cards List */}
            <div className="admin-mobile-cards">
              {loading ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Loading customer records...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--text-muted)", border: "1.5px dashed var(--card-border)", borderRadius: "var(--radius-md)", backgroundColor: "#fafafa" }}>
                  No customer records found.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const displayName = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.phoneNumber || "Anonymous Customer";
                  const identifier = u.phoneNumber || (u.telegramUsername ? `@${u.telegramUsername}` : u.telegramId ? `ID: ${u.telegramId}` : "—");
                  return (
                    <div
                      key={u.id}
                      style={{
                        padding: "14px 16px",
                        backgroundColor: "#ffffff",
                        border: "1px solid var(--card-border)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                    >
                      {/* Name & Join Date */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                        <div style={{ fontWeight: 700, color: "#18181b", fontSize: "0.94rem" }}>
                          {displayName}
                        </div>
                        <div className="mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Phone / Telegram & Badges */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span className="mono" style={{ fontSize: "0.78rem", color: "#3f3f46" }}>
                          {identifier}
                        </span>
                        <span
                          className="mono"
                          style={{
                            padding: "2px 7px",
                            borderRadius: "4px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            backgroundColor: u.authProvider === "telegram" ? "#eff6ff" : "#f4f4f5",
                            color: u.authProvider === "telegram" ? "#1d4ed8" : "#18181b",
                            border: `1px solid ${u.authProvider === "telegram" ? "#bfdbfe" : "#e4e4e7"}`,
                          }}
                        >
                          {u.authProvider === "telegram" ? "telegram" : "sms"}
                        </span>
                        {u.canReceiveNotifications ? (
                          <span className="mono" style={{ color: "#16a34a", fontSize: "0.72rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            notifs on
                          </span>
                        ) : null}
                      </div>

                      {/* Age & Gender if available */}
                      {u.age && (
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {u.age} yrs • {u.gender}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f4f4f5", paddingTop: "8px", marginTop: "2px" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleRole(u)}
                          title="Click to toggle role"
                          className="mono"
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            backgroundColor: u.role === "admin" ? "#000000" : "#f4f4f5",
                            color: u.role === "admin" ? "#ffffff" : "#18181b",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          Role: {u.role}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" /></svg>
                        </button>

                        <div style={{ display: "flex", gap: "6px" }}>
                          {u.authProvider === "telegram" && (
                            <button
                              type="button"
                              onClick={() => openSendMessageModal(u)}
                              className="btn-secondary"
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.75rem",
                              }}
                            >
                              Message
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            aria-label="Delete user"
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "transparent",
                              color: "#ef4444",
                              borderRadius: "4px",
                              border: "none",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Tab 2: Scheduled Announcements */}
        {adminTab === "schedules" && (
          <div>
            <div
              className="admin-schedule-header"
              style={{
                marginBottom: "20px",
              }}
            >
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#18181b", marginBottom: "3px" }}>
                Automated & Recurring Broadcasts
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Promotions configured to automatically deliver to all Telegram members at your scheduled times.
              </p>
            </div>

            {loadingSchedules ? (
              <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                Loading scheduled announcements...
              </div>
            ) : schedules.length === 0 ? (
              <div
                style={{
                  padding: "48px 24px",
                  border: "1.5px dashed var(--card-border)",
                  borderRadius: "var(--radius-md)",
                  textAlign: "center",
                  backgroundColor: "#fafafa",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#f4f4f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px auto",
                    color: "#71717a",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#18181b", marginBottom: "4px" }}>
                  No Scheduled Announcements Yet
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "440px", margin: "0 auto" }}>
                  Set up automated campaigns like daily morning specials or weekly recurring deals (e.g. Every Wednesday Double Points) using the Broadcast Announcement button at the top.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {schedules.map((s) => (
                  <div
                    key={s.id}
                    className="admin-schedule-card"
                    style={{
                      padding: "18px 20px",
                      backgroundColor: "#ffffff",
                      border: "1px solid var(--card-border)",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {/* Recurrence Badge */}
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "14px",
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            backgroundColor:
                              s.scheduleType === "weekly"
                                ? "#eff6ff"
                                : s.scheduleType === "daily"
                                ? "#f4f4f5"
                                : "#fef3c7",
                            color:
                              s.scheduleType === "weekly"
                                ? "#1d4ed8"
                                : s.scheduleType === "daily"
                                ? "#18181b"
                                : "#b45309",
                            border: `1px solid ${
                              s.scheduleType === "weekly"
                                ? "#bfdbfe"
                                : s.scheduleType === "daily"
                                ? "#e4e4e7"
                                : "#fde68a"
                            }`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          {s.scheduleType === "weekly" ? (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                              Every {WEEKDAYS.find((d) => d.val === s.dayOfWeek)?.label || "Week"} at {s.targetTime}
                            </>
                          ) : s.scheduleType === "daily" ? (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                              Daily at {s.targetTime}
                            </>
                          ) : (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                              One-Time: {s.specificDate} at {s.targetTime}
                            </>
                          )}
                        </span>

                        {/* Status Badge */}
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "14px",
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            backgroundColor: s.isActive ? "#f0fdf4" : "#f4f4f5",
                            color: s.isActive ? "#16a34a" : "#71717a",
                            border: `1px solid ${s.isActive ? "#bbf7d0" : "#e4e4e7"}`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: s.isActive ? "#16a34a" : "#a1a1aa",
                            }}
                          />
                          {s.isActive ? "Active" : "Paused"}
                        </span>
                      </div>

                      {/* Next Run Info */}
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {s.nextRunAt ? (
                          <>
                            Next run: <strong>{new Date(s.nextRunAt).toLocaleString()}</strong>
                          </>
                        ) : (
                          "Completed"
                        )}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                      {s.imageUrl && (
                        <img
                          src={s.imageUrl}
                          alt="Scheduled attachment"
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "6px",
                            objectFit: "cover",
                            border: "1px solid #e4e4e7",
                            flexShrink: 0,
                          }}
                        />
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {s.title && (
                          <div style={{ fontWeight: 700, color: "#18181b", fontSize: "0.92rem", marginBottom: "4px" }}>
                            {s.title}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#3f3f46",
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.45,
                            backgroundColor: "#fafafa",
                            padding: "8px 12px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid #f4f4f5",
                          }}
                        >
                          {s.message}
                        </div>

                        {s.lastRunAt && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                            Last dispatched: {new Date(s.lastRunAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="admin-schedule-actions" style={{ display: "flex", gap: "8px", justifyContent: "flex-end", borderTop: "1px solid #f4f4f5", paddingTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => handleRunScheduleNow(s.id)}
                        className="btn-secondary"
                        style={{
                          padding: "5px 12px",
                          fontSize: "0.76rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                        title="Dispatch this announcement to Telegram immediately as a test"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        Run Now
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleScheduleActive(s.id, s.isActive)}
                        className="btn-secondary"
                        style={{
                          padding: "5px 12px",
                          fontSize: "0.76rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        {s.isActive ? (
                          <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                            Pause
                          </>
                        ) : (
                          <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            Resume
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(s.id)}
                        title="Delete schedule"
                        className="btn-delete-schedule"
                        style={{
                          padding: "5px 8px",
                          borderRadius: "4px",
                          backgroundColor: "#fef2f2",
                          color: "#dc2626",
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Message Modal (Direct & Broadcast) */}
      {messageModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div style={{ marginBottom: "20px" }}>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "#000000",
                  marginBottom: "6px",
                }}
              >
                {isBroadcast
                  ? sendMode === "schedule"
                    ? "Schedule Announcement"
                    : "Broadcast Announcement"
                  : `Message ${[targetUser?.firstName, targetUser?.lastName].filter(Boolean).join(" ") || "User"}`}
              </h2>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                {isBroadcast
                  ? sendMode === "schedule"
                    ? "Automate recurring deals (e.g. Every Wednesday) or schedule for a specific date."
                    : "Delivers immediately to all Telegram users with notification permissions."
                  : `Delivering to Telegram ID: ${targetUser?.telegramId}`}
              </p>
            </div>

            {/* Broadcast Mode Switcher: Send Now vs Schedule */}
            {isBroadcast && (
              <div
                style={{
                  display: "flex",
                  backgroundColor: "#f4f4f5",
                  padding: "3px",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSendMode("now")}
                  disabled={sendingMessage}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: sendMode === "now" ? "#ffffff" : "transparent",
                    color: sendMode === "now" ? "#000000" : "var(--text-muted)",
                    boxShadow: sendMode === "now" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Send Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setSendMode("schedule")}
                  disabled={sendingMessage}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: sendMode === "schedule" ? "#ffffff" : "transparent",
                    color: sendMode === "schedule" ? "#000000" : "var(--text-muted)",
                    boxShadow: sendMode === "schedule" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Schedule for Later
                </button>
              </div>
            )}

            {feedback && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                  backgroundColor: feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
                  color: feedback.type === "success" ? "#16a34a" : "#b91c1c",
                  border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleSendMessage}>
              {/* Schedule Configuration Fields */}
              {isBroadcast && sendMode === "schedule" && (
                <div style={{ marginBottom: "18px", padding: "14px", backgroundColor: "#fafafa", borderRadius: "var(--radius-sm)", border: "1px solid #e4e4e7" }}>
                  {/* Campaign Title (Optional) */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "#18181b" }}>
                      Schedule Title <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.75rem" }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wednesday Double Points Promo"
                      value={scheduleTitle}
                      onChange={(e) => setScheduleTitle(e.target.value)}
                      disabled={sendingMessage}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        backgroundColor: "#ffffff",
                        border: "1px solid var(--input-border)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Recurrence Type Selector */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "#18181b" }}>
                      Frequency
                    </label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {(["daily", "weekly", "once"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setScheduleType(type)}
                          disabled={sendingMessage}
                          style={{
                            flex: 1,
                            padding: "7px 4px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.76rem",
                            fontWeight: 600,
                            backgroundColor: scheduleType === type ? "#000000" : "#ffffff",
                            color: scheduleType === type ? "#ffffff" : "#18181b",
                            border: `1px solid ${scheduleType === type ? "#000000" : "#e4e4e7"}`,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {type === "daily" ? "Every Day" : type === "weekly" ? "Weekly" : "Set Date"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Day of Week Picker */}
                  {scheduleType === "weekly" && (
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                        Select Day of Week:
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                        {WEEKDAYS.map((d) => (
                          <button
                            key={d.val}
                            type="button"
                            onClick={() => setSelectedDayOfWeek(d.val)}
                            disabled={sendingMessage}
                            style={{
                              padding: "6px 2px",
                              borderRadius: "4px",
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              backgroundColor: selectedDayOfWeek === d.val ? "#000000" : "#ffffff",
                              color: selectedDayOfWeek === d.val ? "#ffffff" : "#18181b",
                              border: `1px solid ${selectedDayOfWeek === d.val ? "#000000" : "#e4e4e7"}`,
                              cursor: "pointer",
                            }}
                          >
                            {d.short}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* One-Time Date Picker */}
                  {scheduleType === "once" && (
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                        Delivery Date:
                      </label>
                      <input
                        type="date"
                        value={specificDate}
                        onChange={(e) => setSpecificDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        disabled={sendingMessage}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          backgroundColor: "#ffffff",
                          border: "1px solid var(--input-border)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.85rem",
                          outline: "none",
                        }}
                      />
                    </div>
                  )}

                  {/* Time of Day Picker */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      Delivery Time ({scheduleType === "daily" ? "Every day at" : scheduleType === "weekly" ? `Every ${WEEKDAYS.find((d) => d.val === selectedDayOfWeek)?.label} at` : "At"}):
                    </label>
                    <input
                      type="time"
                      value={targetTime}
                      onChange={(e) => setTargetTime(e.target.value)}
                      disabled={sendingMessage}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        backgroundColor: "#ffffff",
                        border: "1px solid var(--input-border)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="messageTextarea"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "#18181b",
                  }}
                >
                  Message Content
                </label>
                <textarea
                  id="messageTextarea"
                  rows={4}
                  placeholder="e.g. Special weekend promotion: 20% off all items!"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sendingMessage}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--input-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "#000000",
                    outline: "none",
                    resize: "vertical",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#000000")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#18181b",
                    }}
                  >
                    Attach Image <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.78rem" }}>(Optional)</span>
                  </label>
                  {selectedImage && (
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      Sent as Telegram Photo Post
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                  disabled={sendingMessage}
                />

                {!selectedImage ? (
                  <div
                    onClick={() => !sendingMessage && fileInputRef.current?.click()}
                    style={{
                      border: "1.5px dashed var(--input-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "16px 14px",
                      textAlign: "center",
                      cursor: sendingMessage ? "not-allowed" : "pointer",
                      backgroundColor: "#fafafa",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!sendingMessage) (e.currentTarget as HTMLElement).style.borderColor = "#000000";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--input-border)";
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "#f4f4f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 8px auto",
                        color: "#71717a",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#18181b", marginBottom: "2px" }}>
                      Import images
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      Supports PNG, JPG, WebP up to 10MB
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      border: "1px solid #e4e4e7",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Upload preview"
                          style={{
                            width: "48px",
                            height: "48px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            border: "1px solid #e4e4e7",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            color: "#18181b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "230px",
                          }}
                          title={selectedImage.name}
                        >
                          {selectedImage.name}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {(selectedImage.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={sendingMessage}
                      className="btn-secondary"
                      style={{
                        padding: "6px 10px",
                        fontSize: "0.75rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        color: "#dc2626",
                        borderColor: "#fecaca",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setMessageModalOpen(false)}
                  disabled={sendingMessage}
                  className="btn-secondary"
                  style={{
                    padding: "9px 16px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage || !messageText.trim()}
                  className="btn-primary"
                  style={{
                    padding: "9px 18px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {sendingMessage ? (
                    "Processing..."
                  ) : isBroadcast && sendMode === "schedule" ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Save Schedule
                    </>
                  ) : selectedImage ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      Send with Photo
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
