/* eslint-disable require-jsdoc */
/* eslint-disable valid-jsdoc */
import {
  parseInputReportID,
  parseButtonStatus,
  parseAnalogStick,
  parseFilter,
  parseTimer,
  parseBatteryLevel,
  parseConnectionInfo,
  parseCompleteButtonStatus,
  parseAnalogStickLeft,
  parseAnalogStickRight,
  parseVibrator,
  parseAck,
  parseSubcommandID,
  parseSubcommandReplyData,
  parseDeviceInfo,
  parseAccelerometers,
  parseGyroscopes,
  calculateActualGyroscope,
  calculateActualAccelerometer,
  toQuaternion,
  toEulerAngles,
  toEulerAnglesQuaternion,
} from './parse';
import type {
  Accelerometer,
  AnalogStick,
  Axis,
  BatteryLevel,
  ButtonStatus,
  DeviceInfo,
  EulerAngles,
  Gyroscope,
  Quaternion,
  StatusWithHex,
} from './parse';

type BatteryLevelEvent = CustomEvent<BatteryLevel>;
type DeviceInfoEvent = CustomEvent<DeviceInfo>;
type HIDInputEvent = CustomEvent<Packet>
interface Packet {
  inputReportID?: StatusWithHex;
  buttonStatus?: Partial<ButtonStatus>;
  analogStick?: StatusWithHex;
  filter?: StatusWithHex;
  timer?: StatusWithHex;
  batteryLevel?: BatteryLevel;
  connectionInfo?: StatusWithHex;
  analogStickLeft?: AnalogStick;
  analogStickRight?: AnalogStick;
  vibrator?: StatusWithHex;
  ack?: StatusWithHex;
  subcommandID?: StatusWithHex;
  subcommandReplyData?: StatusWithHex;
  deviceInfo?: DeviceInfo;
  accelerometers?: Accelerometer[];
  gyroscopes?: Gyroscope[][];
  actualAccelerometer?: Axis;
  actualGyroscope?: {
    dps: Axis;
    rps: Axis;
  };
  actualOrientation?: EulerAngles;
  actualOrientationQuaternion?: EulerAngles;
  quaternion?: Quaternion;
}

/**
 * Concatenates two typed arrays.
 */
const concatTypedArrays = (a: Uint8Array, b: Uint8Array) => {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
};

interface CustomEventMap {
  "deviceinfo": DeviceInfoEvent;
  "batterylevel": BatteryLevelEvent;
  "hidinput": HIDInputEvent;
}

declare global {
  export interface EventTarget {
    addEventListener<K extends keyof CustomEventMap>(type: K, handler: (event: CustomEventMap[K]) => void): void;
    removeEventListener<K extends keyof CustomEventMap>(type: K, handler: (event: CustomEventMap[K]) => void): void;
  }
}

/**
 *
 *
 * @class JoyCon
 * @extends {EventTarget}
 */
export class JoyCon extends EventTarget {
  private device: HIDDevice;

  private inputReport: (event: HIDInputReportEvent) => void = () => undefined;

  /**
   * Creates an instance of JoyCon.
   * @param {HIDDevice} device
   * @memberof JoyCon
   */
  constructor(device: HIDDevice) {
    super();
    this.device = device;
  }

  /**
   * Device opened status.
   */
  public get opened() {
    return this.device.opened;
  }

  /**
   * Opens the device.
   *
   * @memberof JoyCon
   */
  async open() {
    if (!this.device.opened) {
      await this.device.open();
      this.inputReport = this._onInputReport.bind(this);
      this.device.addEventListener('inputreport', this.inputReport);
    }
  }

  async close() {
    if (this.device.opened) {
      await this.device.close();
      this.device.removeEventListener('inputreport', this.inputReport);
    }
  }

  /**
   * Requests information about the device.
   *
   * @memberof JoyCon
   */
  async getRequestDeviceInfo(): Promise<DeviceInfo> {
    const outputReportID = 0x01;
    const subcommand = [0x02];
    const data = [
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      ...subcommand,
    ];
    await this.device.sendReport(outputReportID, new Uint8Array(data));

    return new Promise((resolve) => {
      const onDeviceInfo = ({ detail: deviceInfo }: DeviceInfoEvent) => {
        this.removeEventListener('deviceinfo', onDeviceInfo);
        delete deviceInfo._raw;
        delete deviceInfo._hex;
        resolve(deviceInfo);
      };
      this.addEventListener('deviceinfo', onDeviceInfo);
    });
  }

  /**
   * Requests information about the battery.
   *
   * @memberof JoyCon
   */
  async getBatteryLevel(): Promise<BatteryLevel> {
    const outputReportID = 0x01;
    const subCommand = [0x50];
    const data = [
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      ...subCommand,
    ];
    await this.device.sendReport(outputReportID, new Uint8Array(data));

    return new Promise((resolve) => {
      const onBatteryLevel = ({ detail: batteryLevel }: BatteryLevelEvent) => {
        this.removeEventListener(
          'batterylevel',
          onBatteryLevel
        );
        delete batteryLevel._raw;
        delete batteryLevel._hex;
        resolve(batteryLevel);
      };
      this.addEventListener('batterylevel', onBatteryLevel);
    });
  }

  /**
   * Enables simple HID mode.
   *
   * @memberof JoyCon
   */
  async enableSimpleHIDMode() {
    const outputReportID = 0x01;
    const subcommand = [0x03, 0x3f];
    const data = [
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      ...subcommand,
    ];
    await this.device.sendReport(outputReportID, new Uint8Array(data));
  }

  /**
   * Enables standard full mode.
   *
   * @memberof JoyCon
   */
  async enableStandardFullMode() {
    const outputReportID = 0x01;
    const subcommand = [0x03, 0x30];
    const data = [
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      ...subcommand,
    ];
    await this.device.sendReport(outputReportID, new Uint8Array(data));
  }

  /**
   * Enables EMU mode.
   *
   * @memberof JoyCon
   */
  async enableIMUMode() {
    const outputReportID = 0x01;
    const subcommand = [0x40, 0x01];
    const data = [
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      ...subcommand,
    ];
    await this.device.sendReport(outputReportID, new Uint8Array(data));
  }

  /**
   * Disables IMU mode.
   *
   * @memberof JoyCon
   */
  async disableIMUMode() {
    const outputReportID = 0x01;
    const subcommand = [0x40, 0x00];
    const data = [
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      ...subcommand,
    ];
    await this.device.sendReport(outputReportID, new Uint8Array(data));
  }

  /**
   * Enables vibration.
   *
   * @memberof JoyCon
   */
  async enableVibration() {
    const outputReportID = 0x01;
    const subcommand = [0x48, 0x01];
    const data = [
      0x00,
      0x00,
      0x01,
      0x40,
      0x40,
      0x00,
      0x01,
      0x40,
      0x40,
      ...subcommand,
    ];
    await this.device.sendReport(outputReportID, new Uint8Array(data));
  }

  /**
   * Disables vibration.
   *
   * @memberof JoyCon
   */
  async disableVibration() {
    const outputReportID = 0x01;
    const subcommand = [0x48, 0x00];
    const data = [
      0x00,
      0x00,
      0x01,
      0x40,
      0x40,
      0x00,
      0x01,
      0x40,
      0x40,
      ...subcommand,
    ];
    await this.device.sendReport(outputReportID, new Uint8Array(data));
  }

  /**
   * Send a rumble signal to Joy-Con.
   *
   * @param {number} lowFrequency
   * @param {number} highFrequency
   * @param {number} amplitude
   *
   * @memberof JoyCon
   */
  async rumble(lowFrequency: number, highFrequency: number, amplitude: number) {
    const clamp = (value: number, min: number, max: number) => {
      return Math.min(Math.max(value, min), max);
    };
    const outputReportID = 0x10;
    const data = new Uint8Array(9);

    // Referenced codes below:
    // https://github.com/Looking-Glass/JoyconLib/blob/master/Packages/com.lookingglass.joyconlib/JoyconLib_scripts/Joycon.cs
    data[0] = 0x00;

    let lf = clamp(lowFrequency, 40.875885, 626.286133);
    let hf = clamp(highFrequency, 81.75177, 1252.572266);

    hf = (Math.round(32 * Math.log2(hf * 0.1)) - 0x60) * 4;
    lf = Math.round(32 * Math.log2(lf * 0.1)) - 0x40;

    const amp = clamp(amplitude, 0, 1);

    let hfAmp = 0;
    if (amp == 0) {
      hfAmp = 0;
    } else if (amp < 0.117) {
      hfAmp = (Math.log2(amp * 1000) * 32 - 0x60) / (5 - Math.pow(amp, 2)) - 1;
    } else if (amp < 0.23) {
      hfAmp = Math.log2(amp * 1000) * 32 - 0x60 - 0x5c;
    } else {
      hfAmp = (Math.log2(amp * 1000) * 32 - 0x60) * 2 - 0xf6;
    }

    let lfAmp = Math.round(hfAmp) * 0.5;
    const parity = lfAmp % 2;
    if (parity > 0) {
      --lfAmp;
    }
    lfAmp = lfAmp >> 1;
    lfAmp += 0x40;
    if (parity > 0) {
      lfAmp |= 0x8000;
    }

    data[1] = hf & 0xff;
    data[2] = hfAmp + ((hf >>> 8) & 0xff);
    data[3] = lf + ((lfAmp >>> 8) & 0xff);
    data[4] += lfAmp & 0xff;

    for (let i = 0; i < 4; ++i) {
      data[5 + i] = data[1 + i];
    }

    await this.device.sendReport(outputReportID, new Uint8Array(data));
  }

  /**
   * Deal with `oninputreport` events.
   *
   * @param {*} event
   * @memberof JoyCon
   */
  _onInputReport(event: HIDInputReportEvent) {
    const { data, reportId, device } = event;

    if (!data) {
      return;
    }

    const d = concatTypedArrays(
      new Uint8Array([reportId]),
      new Uint8Array(data.buffer)
    );
    // @ts-expect-error
    const hexData = d.map((byte) => byte.toString(16));
    let packet: Packet = { inputReportID: parseInputReportID(d, hexData) };

    switch (reportId) {
      case 0x3f: {
        packet = {
          ...packet,
          buttonStatus: parseButtonStatus(d, hexData),
          analogStick: parseAnalogStick(d, hexData),
          filter: parseFilter(d, hexData),
        };
        break;
      }
      case 0x21:
      case 0x30: {
        packet = {
          ...packet,
          timer: parseTimer(d, hexData),
          batteryLevel: parseBatteryLevel(d, hexData),
          connectionInfo: parseConnectionInfo(d, hexData),
          buttonStatus: parseCompleteButtonStatus(d, hexData),
          analogStickLeft: parseAnalogStickLeft(d, hexData),
          analogStickRight: parseAnalogStickRight(d, hexData),
          vibrator: parseVibrator(d, hexData),
        };

        if (reportId === 0x21) {
          packet = {
            ...packet,
            ack: parseAck(d, hexData),
            subcommandID: parseSubcommandID(d, hexData),
            subcommandReplyData: parseSubcommandReplyData(d, hexData),
            deviceInfo: parseDeviceInfo(d),
          };
        }

        if (reportId === 0x30) {
          const accelerometers = parseAccelerometers(d, hexData);
          const gyroscopes = parseGyroscopes(d, hexData);
          const rps = calculateActualGyroscope(
            gyroscopes.map((g) => g.map((v) => v.rps))
          );
          const dps = calculateActualGyroscope(
            gyroscopes.map((g) => g.map((v) => v.dps))
          );
          const acc = calculateActualAccelerometer(
            accelerometers.map((a) => [a.x.acc, a.y.acc, a.z.acc])
          );
          const quaternion = toQuaternion(rps, acc, device?.productId || 0);

          packet = {
            ...packet,
            accelerometers,
            gyroscopes,
            actualAccelerometer: acc,
            actualGyroscope: {
              dps,
              rps,
            },
            actualOrientation: toEulerAngles(rps, acc, device.productId || 0),
            actualOrientationQuaternion: toEulerAnglesQuaternion(quaternion),
            quaternion,
          };
        }
        break;
      }
    }
    if (packet.deviceInfo?.type) {
      this._receiveDeviceInfo(packet.deviceInfo);
    }
    if (packet.batteryLevel?.level) {
      this._receiveBatteryLevel(packet.batteryLevel);
    }
    this._receiveInputEvent(packet);
  }

  /**
   *
   *
   * @param {*} deviceInfo
   * @memberof JoyCon
   */
  _receiveDeviceInfo(deviceInfo: DeviceInfo) {
    this.dispatchEvent(
      new CustomEvent<DeviceInfo>('deviceinfo', { detail: deviceInfo })
    );
  }

  /**
   *
   *
   * @param {*} batteryLevel
   * @memberof JoyCon
   */
  _receiveBatteryLevel(batteryLevel: BatteryLevel) {
    this.dispatchEvent(
      new CustomEvent<BatteryLevel>('batterylevel', {
        detail: batteryLevel,
      })
    );
  }

  _receiveInputEvent(_packet: Packet) {}
}

/**
 *
 *
 * @class JoyConLeft
 * @extends {JoyCon}
 */
class JoyConLeft extends JoyCon {
  /**
   * Creates an instance of JoyConLeft.
   * @param {HIDDevice} device
   * @memberof JoyConLeft
   */
  constructor(device: HIDDevice) {
    super(device);
  }

  /**
   *
   *
   * @param {*} packet
   * @memberof JoyConLeft
   */
  _receiveInputEvent(packet: Packet) {
    const bs = packet.buttonStatus;
    if (bs) {
      delete bs.x;
      delete bs.y;
      delete bs.b;
      delete bs.a;
      delete bs.plus;
      delete bs.r;
      delete bs.zr;
      delete bs.home;
      delete bs.rightStick;
    }
    this.dispatchEvent(new CustomEvent('hidinput', { detail: packet }));
  }
}

/**
 *
 *
 * @class JoyConRight
 * @extends {JoyCon}
 */
class JoyConRight extends JoyCon {
  /**
   *Creates an instance of JoyConRight.
   * @param {HIDDevice} device
   * @memberof JoyConRight
   */
  constructor(device: HIDDevice) {
    super(device);
  }

  /**
   *
   *
   * @param {*} packet
   * @memberof JoyConRight
   */
  _receiveInputEvent(packet: Packet) {
    const bs = packet.buttonStatus;
    if (bs) {
      delete bs.up;
      delete bs.down;
      delete bs.left;
      delete bs.right;
      delete bs.minus;
      delete bs.l;
      delete bs.zl;
      delete bs.capture;
      delete bs.leftStick;
    }
    this.dispatchEvent(new CustomEvent('hidinput', { detail: packet }));
  }
}

export { JoyConLeft, JoyConRight };
