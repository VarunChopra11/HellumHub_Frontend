// ─── OTA / Firmware ───────────────────────────────────────────────────────────

export interface Release {
  id: string;
  device_type: string;
  version: string;
  rollout_percentage: number;
  enabled: boolean;
  notes: string | null;
  firmware_file_id: string | null;
  sha256: string | null;
  size: number | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  device_type: string;
  mac: string;
  current_version: string;
  checked_at: string;
  result:
    | 'blocked'
    | 'invalid_version'
    | 'no_active_release'
    | 'version_not_greater'
    | 'rollout_not_included'
    | 'update_available'
    | 'override_invalid'
    | 'error_fallback';
  chosen_version: string | null;
  chosen_release_id: string | null;
  message: string | null;
  request_id: string | null;
  response: {
    update_available: boolean;
    version: string | null;
    firmware_url: string | null;
    sha256: string | null;
    size: number | null;
  };
}

export interface Override {
  id: string;
  device_type: string;
  mac: string;
  version: string;
  reason: string | null;
  updated_at: string;
}

export interface HealthResponse {
  status: 'ok' | string;
  now: string;
}

export interface FirmwareCheckResponse {
  update_available: boolean;
  version: string | null;
  firmware_url: string | null;
  sha256: string | null;
  size: number | null;
}

// ─── Consumer Authentication ───────────────────────────────────────────────────

/** Sent to POST /api/v1/auth/google */
export interface GoogleAuthRequest {
  id_token: string;
}

/** Returned from POST /api/v1/auth/google and POST /api/v1/auth/refresh */
export interface ConsumerTokenResponse {
  token_type: 'Bearer';
  access_token: string;
  expires_in: number;
  refresh_token: string;
}

/** Returned from GET /api/v1/me */
export interface UserResponse {
  id: string;
  google_sub: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

// ─── Smart Home Devices ────────────────────────────────────────────────────────

/**
 * A single switch/outlet/light endpoint on a provisioned device.
 * Returned as part of SmartHomeDeviceResponse.
 * `state` reflects the live ON/OFF status synced via MQTT.
 */
export interface EndpointResponse {
  id: string;         // matches ESP32 MQTT "device" field, e.g. "light1"
  name: string;       // human-readable label, e.g. "Light 1"
  google_type: string; // e.g. "action.devices.types.LIGHT"
  state: boolean;     // true = ON, false = OFF
}

/** Returned from GET /api/v1/devices and GET /admin/smarthome-devices */
export interface SmartHomeDeviceResponse {
  id: string;
  mac: string;        // 12-char lowercase hex, no colons
  user_id: string;
  name: string;
  device_model: string; // slug, e.g. "4-switch-board"
  endpoints: EndpointResponse[];
  created_at: string;
}

/** Body for PATCH /api/v1/devices/{mac} */
export interface DeviceRenameRequest {
  name: string;
}

/** Returned from POST /api/v1/devices/binding-token */
export interface BindingTokenResponse {
  binding_token: string;
  expires_in: number; // seconds (default 600)
}

// ─── Device Models (Admin Catalog) ─────────────────────────────────────────────

/**
 * Definition of one endpoint within a device model.
 * When a device is provisioned, this is copied into the device document.
 */
export interface EndpointDefinition {
  id: string;         // URL-safe slug used in MQTT, e.g. "light1"
  name: string;       // Display name, e.g. "Light 1"
  google_type: string; // Google Home device type, e.g. "action.devices.types.LIGHT"
}

/** Body for POST /admin/device-models */
export interface DeviceModelCreate {
  model_id: string;      // URL-safe slug, pattern: ^[a-z0-9\-]+$
  display_name: string;
  manufacturer: string;
  hw_version: string;
  endpoints: EndpointDefinition[];
}

/** Body for PATCH /admin/device-models/{model_id} */
export interface DeviceModelUpdate {
  display_name?: string;
  manufacturer?: string;
  hw_version?: string;
  endpoints?: EndpointDefinition[];
}

/** Returned from GET/POST/PATCH /admin/device-models */
export interface DeviceModelResponse {
  id: string;
  model_id: string;
  display_name: string;
  manufacturer: string;
  hw_version: string;
  endpoints: EndpointDefinition[];
  created_at: string;
}

// ─── Admin Role Management ─────────────────────────────────────────────────────

/** Body for POST /admin/roles */
export interface AdminRoleGrantRequest {
  email: string;
}

/** Returned from GET /admin/roles and POST /admin/roles */
export interface AdminRoleResponse {
  id: string;
  email: string;
  role: 'super_admin' | 'admin';
  granted_by: string;
  created_at: string;
}

// ─── Google Home Fulfillment ───────────────────────────────────────────────────

/** Used when calling POST /smarthome/fulfillment for EXECUTE intents */
export interface FulfillmentExecutePayload {
  commands: Array<{
    devices: Array<{ id: string }>; // e.g. ["aabbccddeeff_light1"]
    execution: Array<{
      command: string; // "action.devices.commands.OnOff"
      params: Record<string, unknown>; // { on: true }
    }>;
  }>;
}

export interface FulfillmentRequest {
  requestId: string;
  inputs: Array<{
    intent: string;
    payload: FulfillmentExecutePayload | Record<string, unknown>;
  }>;
}

export interface FulfillmentResponse {
  requestId: string;
  payload: Record<string, unknown>;
}

// ─── MQTT ────────────────────────────────────────────────────────────────────

/** Payload published to smarthome/device/<mac>/state by the ESP32 */
export interface MqttStateMessage {
  device: string; // endpoint_id, e.g. "light1"
  state: 'on' | 'off';
}
