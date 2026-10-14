export interface MemberUser {
  id: string;
  phoneNumber?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  gender?: string | null;
  authProvider?: string;
  role?: string;
  canReceiveNotifications?: boolean;
  photoUrl?: string | null;
}

export interface RewardVoucher {
  id: string;
  title: string;
  description: string;
  discount: string;
  pointsRequired: number;
  category: "voucher" | "beverage" | "discount";
  expiryDays: number;
}

export interface ClaimedVoucher extends RewardVoucher {
  voucherCode: string;
  claimedAt: string;
  isUsed: boolean;
}

export interface PromotionDeal {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  discountTag: string;
  category: string;
  originalPrice?: string;
  promoPrice?: string;
}

export interface PointTransaction {
  id: string;
  title: string;
  date: string;
  amount: number; // positive for earned, negative for spent
  type: "earn" | "redeem" | "bonus";
}
