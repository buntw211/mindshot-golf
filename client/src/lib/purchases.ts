import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
} from "@revenuecat/purchases-capacitor";

export type Plan = "monthly" | "yearly";

const IOS_API_KEY = "appl_ewQgsbXiaFEQfDZUnltkubYlAvL";
const ENTITLEMENT_ID = "premium";

let initialized = false;
let currentOffering: PurchasesOffering | null = null;

export async function initPurchases() {
  if (!Capacitor.isNativePlatform()) return;
  if (initialized) return;

  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  await Purchases.configure({ apiKey: IOS_API_KEY });

  const offerings = await Purchases.getOfferings();
  currentOffering = offerings.current ?? null;
  initialized = true;
}

export async function preloadOfferings() {
  if (!Capacitor.isNativePlatform()) return false;

  if (!initialized) {
    await initPurchases();
  }

  const offerings = await Purchases.getOfferings();
  currentOffering = offerings.current ?? null;

  return Boolean(currentOffering);
}

export function purchasesReady() {
  return Boolean(currentOffering);
}

async function getCurrentOffering() {
  if (!Capacitor.isNativePlatform()) return null;

  if (!initialized) {
    await initPurchases();
  }

  if (!currentOffering) {
    const offerings = await Purchases.getOfferings();
    currentOffering = offerings.current ?? null;
  }

  return currentOffering;
}

function findPackageForPlan(
  offering: PurchasesOffering,
  plan: Plan
): PurchasesPackage | undefined {
  if (plan === "monthly") {
    return (
      offering.monthly ??
      offering.availablePackages.find((pkg) =>
        pkg.product.identifier.toLowerCase().includes("month")
      )
    );
  }

  return (
    offering.annual ??
    offering.availablePackages.find((pkg) =>
      pkg.product.identifier.toLowerCase().includes("year")
    )
  );
}

export async function getPremiumStatus(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  if (!initialized) {
    await initPurchases();
  }

  const info = await Purchases.getCustomerInfo();
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

export async function purchase(plan: Plan) {
  try {
    if (!Capacitor.isNativePlatform()) {
      return {
        success: false,
        error: "Purchases only work in the iPhone app.",
      };
    }

    const offering = await getCurrentOffering();

    if (!offering) {
      return {
        success: false,
        error: "No RevenueCat offering found.",
      };
    }

    const pkg = findPackageForPlan(offering, plan);

    if (!pkg) {
      return {
        success: false,
        error: `No ${plan} package found.`,
      };
    }

    await Purchases.purchasePackage({ aPackage: pkg });

    const info = await Purchases.getCustomerInfo();
    const isActive = Boolean(info.entitlements.active[ENTITLEMENT_ID]);

    return { success: isActive };
  } catch (error: any) {
    const wasCancelled =
      error?.userCancelled === true ||
      error?.code === "PURCHASE_CANCELLED_ERROR";

    return {
      success: false,
      error: wasCancelled
        ? "Purchase cancelled."
        : error?.message || "Purchase failed.",
    };
  }
}

export async function restorePurchases() {
  try {
    if (!Capacitor.isNativePlatform()) {
      return {
        success: false,
        error: "Restore only works in the iPhone app.",
      };
    }

    if (!initialized) {
      await initPurchases();
    }

    const info = await Purchases.restorePurchases();
    const isActive = Boolean(info.entitlements.active[ENTITLEMENT_ID]);

    return { success: isActive };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Restore failed.",
    };
  }
}