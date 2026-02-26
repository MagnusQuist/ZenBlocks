/**
 * Ads adapter interface with placeholder implementation.
 * No SDK required initially.
 */

export type RewardedResult = "completed" | "dismissed" | "error";

export interface AdsService {
  showRewarded(): Promise<RewardedResult>;
  showInterstitial(): Promise<void>;
}

/** Mock: waits 600–1200ms, resolves "completed" ~90% for testing */
export const MockAdsService: AdsService = {
  async showRewarded(): Promise<RewardedResult> {
    const delay = 600 + Math.random() * 600;
    await new Promise((r) => setTimeout(r, delay));
    return Math.random() < 0.9 ? "completed" : "dismissed";
  },
  async showInterstitial(): Promise<void> {
    const delay = 800 + Math.random() * 400;
    await new Promise((r) => setTimeout(r, delay));
    // Caller shows full-screen placeholder modal
  },
};
