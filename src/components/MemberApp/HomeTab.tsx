"use client";

import { useState, useEffect } from "react";
import { MemberUser, PromotionDeal } from "./types";

interface HomeTabProps {
  user: MemberUser;
  points: number;
  vouchersCount: number;
  onNavigateToCard: () => void;
  onNavigateToRedeem: () => void;
}

interface PromoBanner {
  id: string;
  title: string;
  badge: string;
  image: string;
  alt: string;
}

const PROMO_BANNERS: PromoBanner[] = [
  {
    id: "promo-fairprice-double-points",
    title: "Double Points & Rewards",
    badge: "FAIRPRICE MEMBER",
    image: "/promos/fairprice-double-points.webp",
    alt: "FairPrice Member Exclusive: Double Points & Rewards",
  },
  {
    id: "promo-fairprice-super-saver",
    title: "Super Saver 50% Off",
    badge: "50% OFF MUST-BUY",
    image: "/promos/fairprice-super-saver.webp",
    alt: "FairPrice Super Saver: 50% Off Must-Buy Deals",
  },
  {
    id: "promo-fairprice-fresh",
    title: "Fresh Market Deals",
    badge: "SAVE 35%",
    image: "/promos/fairprice-fresh-market.webp",
    alt: "FairPrice Fresh Market: Up to 35% Off Daily Deals",
  },
  {
    id: "promo-fairprice-weekend-treats",
    title: "Weekend Treats BOGO",
    badge: "BUY 1 GET 1",
    image: "/promos/fairprice-weekend-treats.webp",
    alt: "FairPrice Weekend Treats: Buy 1 Get 1 Free",
  },
];

const SAMPLE_DEALS: PromotionDeal[] = [
  {
    id: "deal-1",
    title: "Meadows Grapeseed Oil 1L",
    subtitle: "Imported from Italy • 100% Pure",
    tag: "MEMBER SPECIAL",
    discountTag: "SAVE 50%",
    category: "Groceries",
    originalPrice: "51,800៛ ($12.60)",
    promoPrice: "25,900៛ ($6.32)",
  },
  {
    id: "deal-2",
    title: "Good Day Instant 3-in-1 Coffee",
    subtitle: "Assorted 20 sachets x 25g • Indonesia",
    tag: "BEST SELLER",
    discountTag: "SAVE 35%",
    category: "Beverages",
    originalPrice: "23,000៛ ($5.60)",
    promoPrice: "14,900៛ ($3.63)",
  },
  {
    id: "deal-3",
    title: "Simply Pure Soybean Oil 2L",
    subtitle: "Triple Refined • Heart Healthy",
    tag: "EXCLUSIVE",
    discountTag: "SAVE 34%",
    category: "Groceries",
    originalPrice: "61,200៛ ($14.90)",
    promoPrice: "40,200៛ ($9.80)",
  },
  {
    id: "deal-4",
    title: "Harvey Fresh 100% Orange Juice 1L",
    subtitle: "Australian Fresh Squeezed • No Sugar Added",
    tag: "FRESH",
    discountTag: "SAVE 36%",
    category: "Beverages",
    originalPrice: "18,100៛ ($4.40)",
    promoPrice: "11,400៛ ($2.78)",
  },
  {
    id: "deal-5",
    title: "Premium Crisp Apples & Seedless Grapes",
    subtitle: "Farm Fresh Orchard Selection • Daily Restock",
    tag: "FARM FRESH",
    discountTag: "SAVE 35%",
    category: "Fresh Produce",
    originalPrice: "32,000៛ ($7.80)",
    promoPrice: "20,800៛ ($5.07)",
  },
  {
    id: "deal-6",
    title: "Artisan Chocolate & Bakery Treats",
    subtitle: "Imported Confectionery • Weekend Limited Deal",
    tag: "BOGO",
    discountTag: "BUY 1 GET 1",
    category: "Snacks",
    originalPrice: "28,500៛ ($6.95)",
    promoPrice: "14,250៛ ($3.48)",
  },
];

export default function HomeTab({
  user,
  points,
  vouchersCount,
  onNavigateToCard,
  onNavigateToRedeem,
}: HomeTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const categories = ["All", "Groceries", "Beverages", "Fresh Produce", "Snacks"];

  // Auto-advance promotional carousel
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const filteredDeals =
    selectedCategory === "All"
      ? SAMPLE_DEALS
      : SAMPLE_DEALS.filter((d) => d.category === selectedCategory);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* 1. Hero Featured Promotion Carousel */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        style={{
          position: "relative",
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 8px 24px -4px rgba(220, 38, 38, 0.2)",
          border: "1px solid var(--card-border)",
          backgroundColor: "#18181b",
        }}
      >
        {/* Banner Images Layer */}
        <div
          onClick={onNavigateToCard}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            cursor: "pointer",
            overflow: "hidden",
            display: "block",
          }}
          title="Tap banner to view member rewards"
        >
          {PROMO_BANNERS.map((banner, idx) => (
            <img
              key={banner.id}
              src={banner.image}
              alt={banner.alt}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={idx === 0 ? "high" : "low"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: idx === activeBannerIndex ? 1 : 0,
                transition: "opacity 0.45s ease-in-out, transform 0.45s ease-out",
                transform: idx === activeBannerIndex ? "scale(1)" : "scale(1.02)",
                pointerEvents: idx === activeBannerIndex ? "auto" : "none",
              }}
            />
          ))}

          {/* Bottom subtle gradient overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: "linear-gradient(to top, rgba(0, 0, 0, 0.65), transparent)",
              pointerEvents: "none",
            }}
          />

          {/* Quick Info & Action Pill */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(220, 38, 38, 0.92)",
              backdropFilter: "blur(6px)",
              color: "#ffffff",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.68rem",
              fontWeight: 700,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <span>{PROMO_BANNERS[activeBannerIndex].badge}</span>
            <span>•</span>
            <span>Show QR Card</span>
          </div>
        </div>

        {/* Carousel Navigation - Previous Arrow */}
        <button
          type="button"
          aria-label="Previous banner"
          onClick={(e) => {
            e.stopPropagation();
            setActiveBannerIndex((prev) => (prev - 1 + PROMO_BANNERS.length) % PROMO_BANNERS.length);
          }}
          style={{
            position: "absolute",
            top: "50%",
            left: "8px",
            transform: "translateY(-50%)",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(6px)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Carousel Navigation - Next Arrow */}
        <button
          type="button"
          aria-label="Next banner"
          onClick={(e) => {
            e.stopPropagation();
            setActiveBannerIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
          }}
          style={{
            position: "absolute",
            top: "50%",
            right: "8px",
            transform: "translateY(-50%)",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(6px)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Indicator Dots */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            display: "flex",
            gap: "5px",
            zIndex: 2,
          }}
        >
          {PROMO_BANNERS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveBannerIndex(idx);
              }}
              style={{
                width: idx === activeBannerIndex ? "18px" : "6px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor: idx === activeBannerIndex ? "#ffffff" : "rgba(255, 255, 255, 0.45)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              aria-label={`Go to promotion slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 2b. Featured Campaign Thumbnails Rail */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
            FEATURED CAMPAIGNS
          </span>
          <span style={{ fontSize: "0.72rem", color: "#dc2626", fontWeight: 700 }}>
            {PROMO_BANNERS.length} Active Offers
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "4px",
            scrollSnapType: "x mandatory",
          }}
        >
          {PROMO_BANNERS.map((banner, idx) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setActiveBannerIndex(idx)}
              style={{
                flexShrink: 0,
                width: "128px",
                borderRadius: "10px",
                overflow: "hidden",
                border: idx === activeBannerIndex ? "2px solid #dc2626" : "1px solid var(--card-border)",
                backgroundColor: "#ffffff",
                padding: 0,
                textAlign: "left",
                cursor: "pointer",
                boxShadow: idx === activeBannerIndex ? "0 4px 12px rgba(220,38,38,0.18)" : "0 1px 3px rgba(0,0,0,0.04)",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ width: "100%", aspectRatio: "16 / 9", overflow: "hidden", position: "relative" }}>
                <img
                  src={banner.image}
                  alt={banner.title}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "6px 8px" }}>
                <div
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: idx === activeBannerIndex ? "#dc2626" : "var(--foreground)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {banner.title}
                </div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                  {banner.badge}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Category Filter Chips */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "2px",
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "0.78rem",
              fontWeight: selectedCategory === cat ? 700 : 500,
              backgroundColor: selectedCategory === cat ? "#dc2626" : "#f8fafc",
              color: selectedCategory === cat ? "#ffffff" : "#475569",
              border: selectedCategory === cat ? "1px solid #dc2626" : "1px solid var(--card-border)",
              whiteSpace: "nowrap",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. Deals Feed (matching Image 3) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#000000" }}>
            FairPrice Member Specials
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Updated Daily
          </div>
        </div>

        {filteredDeals.map((deal) => (
          <div
            key={deal.id}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              textAlign: "left",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                  }}
                >
                  {deal.discountTag}
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "#dc2626",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {deal.tag}
                </span>
              </div>

              <div
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "#000000",
                  lineHeight: 1.3,
                  marginBottom: "2px",
                }}
              >
                {deal.title}
              </div>

              <div
                style={{
                  fontSize: "0.74rem",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                {deal.subtitle}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#dc2626" }}>
                  {deal.promoPrice}
                </span>
                {deal.originalPrice && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      textDecoration: "line-through",
                    }}
                  >
                    {deal.originalPrice}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateToCard}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#dc2626",
                flexShrink: 0,
              }}
              aria-label="View in member card"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
