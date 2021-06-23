import { JoyCon, JoyConLeft, JoyConRight } from './joycon';

const connectedJoyCons = new Map<number | undefined, JoyCon>();

navigator.hid.addEventListener('connect', async ({ device }) => {
  console.log(`HID connected: ${device.productName}`);
  connectedJoyCons.set(device.productId, await connectDevice(device));
});

navigator.hid.addEventListener('disconnect', ({ device }) => {
  console.log(`HID disconnected: ${device.productName}`);
  connectedJoyCons.delete(device.productId);
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
