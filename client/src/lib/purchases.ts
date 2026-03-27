// purchases.ts

export type Plan = 'monthly' | 'yearly';

let isPremium = false;

// INIT (RevenueCat later)
export async function initPurchases() {
  console.log('Purchases initialized');
}

// CHECK PREMIUM
export async function getPremiumStatus(): Promise<boolean> {
  return isPremium;
}

// PURCHASE (stub for now)
export async function purchase(plan: Plan) {
  console.log('Purchasing:', plan);

  // TEMP: simulate success
  isPremium = true;

  return { success: true };
}

// RESTORE (stub)
export async function restorePurchases() {
  console.log('Restoring purchases');

  // TEMP: simulate restore
  isPremium = true;

  return { success: true };
}