export const queryKeys = {
  // ─── OTA (existing) ────────────────────────────────────────────────────────
  health: ['health'] as const,
  releases: (deviceType: string) => ['releases', deviceType] as const,
  overrides: (deviceType: string) => ['overrides', deviceType] as const,

  // ─── Consumer ──────────────────────────────────────────────────────────────
  /** Current authenticated user profile */
  me: ['me'] as const,
  /** All smart home devices for the current user */
  devices: ['devices'] as const,

  // ─── Admin ─────────────────────────────────────────────────────────────────
  /** List of all granted admin accounts */
  adminRoles: ['adminRoles'] as const,
  /** Device model catalog */
  deviceModels: ['deviceModels'] as const,
  /** A single device model by slug */
  deviceModel: (modelId: string) => ['deviceModel', modelId] as const,
  /** All provisioned smart home devices (admin view) */
  inventory: ['inventory'] as const,
};
