import mqtt, { type MqttClient } from 'mqtt';
import { useDeviceStore } from '@/stores/deviceStore';
import type { MqttStateMessage } from '@/types/models';

/**
 * MQTT WebSocket singleton for real-time device state sync.
 *
 * Connects to the broker once when `connect()` is called (typically on
 * consumer dashboard mount). Subscribes to `smarthome/device/+/state`.
 *
 * Topic format: smarthome/device/<mac>/state
 * Payload format: { "device": "<endpoint_id>", "state": "on" | "off" }
 */

const WS_URL = (import.meta.env.VITE_MQTT_WS_URL as string) || 'wss://mqtt.hellum.dev:8084';
const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME as string | undefined;
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD as string | undefined;

const STATE_TOPIC = 'smarthome/device/+/state';

let client: MqttClient | null = null;
let connectCount = 0; // reference count for multiple consumers

// ─── Exported API ─────────────────────────────────────────────────────────────

export const mqttClient = {
  /**
   * Establish (or reuse) the MQTT WebSocket connection.
   * Call this from the consumer dashboard useEffect.
   */
  connect() {
    connectCount++;

    if (client && client.connected) {
      return;
    }

    const id = `hellum-web-${Math.random().toString(16).slice(2, 10)}`;
    client = mqtt.connect(WS_URL, {
      clientId: id,
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
    });

    client.on('connect', () => {
      console.info('[MQTT] Connected to broker');
      client!.subscribe(STATE_TOPIC, { qos: 1 }, (err) => {
        if (err) console.error('[MQTT] Subscribe error', err);
        else console.info('[MQTT] Subscribed to', STATE_TOPIC);
      });
    });

    client.on('message', (topic: string, payload: Buffer) => {
      handleStateMessage(topic, payload);
    });

    client.on('error', (err) => {
      console.warn('[MQTT] Error', err);
    });

    client.on('reconnect', () => {
      console.info('[MQTT] Reconnecting…');
    });

    client.on('offline', () => {
      console.warn('[MQTT] Offline');
    });
  },

  /**
   * Release a consumer's reference. Only fully disconnects when ref count = 0.
   */
  disconnect() {
    connectCount = Math.max(0, connectCount - 1);
    if (connectCount === 0 && client) {
      client.end(true, () => {
        console.info('[MQTT] Disconnected');
      });
      client = null;
    }
  },

  /** Whether the underlying client is currently connected */
  get isConnected() {
    return client?.connected ?? false;
  },
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function handleStateMessage(topic: string, payload: Buffer) {
  // Topic: smarthome/device/<mac>/state
  const parts = topic.split('/');
  if (parts.length !== 4 || parts[0] !== 'smarthome' || parts[2] !== 'device' || parts[3] !== 'state') {
    return;
  }
  // Wait — topic structure is smarthome/device/<mac>/state so:
  // parts[0]='smarthome', parts[1]='device', parts[2]=<mac>, parts[3]='state'
  const mac = parts[2];

  let message: MqttStateMessage;
  try {
    message = JSON.parse(payload.toString()) as MqttStateMessage;
  } catch {
    console.warn('[MQTT] Invalid JSON payload on', topic);
    return;
  }

  if (!message.device || (message.state !== 'on' && message.state !== 'off')) {
    console.warn('[MQTT] Unexpected payload shape', message);
    return;
  }

  const stateBoolean = message.state === 'on';
  useDeviceStore.getState().applyMqttStateUpdate(mac, message.device, stateBoolean);
}
