import { v4 as uuidv4 } from 'uuid';
import { consumerApi } from '@/lib/axios';
import type { FulfillmentRequest, FulfillmentResponse } from '@/types/models';

/**
 * POST /smarthome/fulfillment
 *
 * Sends a Google Home EXECUTE intent to toggle a single device endpoint.
 *
 * The backend's fulfillment handler:
 * 1. Validates the consumer JWT
 * 2. Publishes an MQTT command to `smarthome/device/<mac>/cmd`
 * 3. Updates MongoDB endpoint state
 *
 * Device ID format expected by backend: `<mac>_<endpoint_id>`
 * e.g. `aabbccddeeff_light1`
 *
 * @param mac - 12-char lowercase hex MAC address, no colons
 * @param endpointId - endpoint id from EndpointResponse.id
 * @param on - desired state (true = ON, false = OFF)
 */
export async function executeToggle(
  mac: string,
  endpointId: string,
  on: boolean,
): Promise<FulfillmentResponse> {
  const deviceId = `${mac}_${endpointId}`;

  const body: FulfillmentRequest = {
    requestId: uuidv4(),
    inputs: [
      {
        intent: 'action.devices.EXECUTE',
        payload: {
          commands: [
            {
              devices: [{ id: deviceId }],
              execution: [
                {
                  command: 'action.devices.commands.OnOff',
                  params: { on },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  const { data } = await consumerApi.post<FulfillmentResponse>('/smarthome/fulfillment', body);
  return data;
}
