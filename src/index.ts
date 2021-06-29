import { JoyCon, JoyConLeft, JoyConRight } from './joycon';

interface CustomEventMap {
  "connect": CustomEvent<JoyCon>;
  "disconnect": CustomEvent<number>;
}

export declare function addEventListener<K extends keyof CustomEventMap>(type: K, handler: (event: CustomEventMap[K]) => void): void;
export declare function removeEventListener<K extends keyof CustomEventMap>(type: K, handler: (event: CustomEventMap[K]) => void): void;

const connectedJoyCons = new Map<number | undefined, JoyCon>();

navigator.hid.addEventListener('connect', async ({ device }) => {
  console.log(`HID connected: ${device.productName}`);
  const joycon = await connectDevice(device);
  connectedJoyCons.set(device.productId, joycon);
  dispatchEvent(new CustomEvent('connect', { detail: joycon }));
});

navigator.hid.addEventListener('disconnect', ({ device }) => {
  console.log(`HID disconnected: ${device.productName}`);
  connectedJoyCons.delete(device.productId);
  dispatchEvent(new CustomEvent('disconnect', { detail: device.productId }));
});

document.addEventListener('DOMContentLoaded', async () => {
  const devices = await navigator.hid.getDevices();
  devices.forEach(async (device) => {
    connectedJoyCons.set(device.productId, await connectDevice(device));
  });
});

const connectJoyCon = async () => {
  // Filter on devices with the Nintendo Switch Joy-Con USB Vendor/Product IDs.
  const filters = [
    {
      vendorId: 0x057e, // Nintendo Co., Ltd
      productId: 0x2006, // Joy-Con Left
    },
    {
      vendorId: 0x057e, // Nintendo Co., Ltd
      productId: 0x2007, // Joy-Con Right
    },
  ];
  // Prompt user to select a Joy-Con device.
  try {
    const [device] = await navigator.hid.requestDevice({ filters });
    if (!device) {
      return;
    }
    connectedJoyCons.set(device.productId, await connectDevice(device));
  } catch (error) {
    console.error(error.name, error.message);
  }
};

const connectDevice = async (device: HIDDevice) => {
  let joyCon: JoyCon;
  if (device.productId === 0x2006) {
    joyCon = new JoyConLeft(device);
  } else if (device.productId === 0x2007) {
    joyCon = new JoyConRight(device);
  } else {
    throw new Error("wrogn device!");
  }

  await joyCon.open();
  await joyCon.enableStandardFullMode();
  await joyCon.enableIMUMode();
  return joyCon;
};

export { connectJoyCon, connectedJoyCons, JoyConLeft, JoyConRight };
