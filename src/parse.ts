import Ahrs from 'ahrs';

export interface Axis {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion extends Axis {
  w: number;
}

export interface StatusWithHex {
  _raw?: Uint8Array;
  _hex?: Uint8Array;
}

interface Version {
  major: number;
  minor: number;
}

export interface DeviceInfo extends StatusWithHex {
  firmwareVersion: Version;
  type: string | undefined;
  macAddress: string;
  spiColorInUse: boolean;
}

export interface BatteryLevel extends StatusWithHex {
  level: string;
}

export interface AnalogStick extends StatusWithHex {
  horizontal: string;
  vertical: string;
}

interface Acceleration extends StatusWithHex {
  acc: number;
}

export interface Accelerometer {
  x: Acceleration;
  y: Acceleration;
  z: Acceleration;
}

export interface Gyroscope extends StatusWithHex {
  dps: number;
  rps: number;
}

export interface EulerAngles {
  alpha: string;
  beta: string;
  gamma: string;
}

export interface ButtonStatus extends StatusWithHex {
  y: boolean;
  x: boolean;
  b: boolean;
  a: boolean;
  r: boolean;
  zr: boolean;
  down: boolean;
  up: boolean;
  right: boolean;
  left: boolean;
  l: boolean;
  zl: boolean;
  sr: boolean;
  sl: boolean;
  minus: boolean;
  plus: boolean;
  rightStick: boolean;
  leftStick: boolean;
  home: boolean;
  capture: boolean;
  chargingGrip: boolean;
}

const leftMadgwick = new Ahrs({ sampleInterval: 10 });
const rightMadgwick = new Ahrs({ sampleInterval: 10 });
const rad2deg = 180.0 / Math.PI;

/* eslint-disable require-jsdoc */

function baseSum(
  array: number[],
  iteratee: (v: number | undefined) => number | undefined
) {
  let result = 0;

  for (const value of array) {
    const current = iteratee(value);
    if (current !== undefined) {
      result = result === undefined ? current : result + current;
    }
  }
  return result;
}

function mean(array: number[]) {
  return baseMean(array, (value) => value);
}

function baseMean(
  array: number[],
  iteratee: (v: number | undefined) => number | undefined
) {
  const length = array == null ? 0 : array.length;
  return length ? baseSum(array, iteratee) / length : NaN;
}

function calculateBatteryLevel(value: Uint8Array) {
  let level = '';
  switch (value[0]) {
    case 8:
      level = 'full';
      break;
    case 4:
      level = 'medium';
      break;
    case 2:
      level = 'low';
      break;
    case 1:
      level = 'critical';
      break;
    case 0:
      level = 'empty';
      break;
    default:
      level = 'charging';
  }

  return level;
}

const ControllerType: { [index: number]: string | undefined } = {
  0x1: 'Left Joy-Con',
  0x2: 'Right Joy-Con',
  0x3: 'Pro Controller',
} as const;

interface Rotation {
  timestamp: number | null;
  alpha: number;
  beta: number;
  gamma: number;
}

const lastValues: { [index: number]: Rotation | undefined } = {
  8198: {
    timestamp: null,
    alpha: 0,
    beta: 0,
    gamma: 0,
  },
  8199: {
    timestamp: null,
    alpha: 0,
    beta: 0,
    gamma: 0,
  },
} as const;
const bias = 0.75;
const zeroBias = 0.0125;

// As we only can cover half (PI rad) of the full spectrum (2*PI rad) we multiply
// the unit vector with values from [-1, 1] with PI/2, covering [-PI/2, PI/2].
const scale = Math.PI / 2;

/**
 * Applies a complementary filter to obtain Euler angles from gyroscope and
 * accelerometer data.
 *
 * @export
 * @param {*} gyroscope
 * @param {*} accelerometer
 * @param {*} productId
 * @return {Object}
 */
export function toEulerAngles(
  gyroscope: Axis,
  accelerometer: Axis,
  productId: number
): EulerAngles | undefined {
  const now = Date.now();
  const value = lastValues[productId];
  if (!value) return;

  const dt = value.timestamp ? (now - value.timestamp) / 1000 : 0;
  value.timestamp = now;

  // Treat the acceleration vector as an orientation vector by normalizing it.
  // Keep in mind that if the device is flipped, the vector will just be
  // pointing in the other direction, so we have no way to know from the
  // accelerometer data which way the device is oriented.
  const norm = Math.sqrt(
    accelerometer.x ** 2 + accelerometer.y ** 2 + accelerometer.z ** 2
  );

  value.alpha = (1 - zeroBias) * (value.alpha + gyroscope.z * dt);
  if (norm !== 0) {
    value.beta =
      bias * (value.beta + gyroscope.x * dt) +
      (1.0 - bias) * ((accelerometer.x * scale) / norm);
    value.gamma =
      bias * (value.gamma + gyroscope.y * dt) +
      (1.0 - bias) * ((accelerometer.y * -scale) / norm);
  }
  return {
    alpha:
      // ToDo: I could only get this to work with a magic multiplier (430).
      productId === 0x2006
        ? ((((-1 * (value.alpha * 180)) / Math.PI) * 430) % 90).toFixed(6)
        : ((((value.alpha * 180) / Math.PI) * 430) % 360).toFixed(6),
    beta: ((-1 * (value.beta * 180)) / Math.PI).toFixed(6),
    gamma:
      productId === 0x2006
        ? ((-1 * (value.gamma * 180)) / Math.PI).toFixed(6)
        : ((value.gamma * 180) / Math.PI).toFixed(6),
  };
}

export function toEulerAnglesQuaternion(q: Quaternion): EulerAngles {
  const ww = q.w * q.w;
  const xx = q.x * q.x;
  const yy = q.y * q.y;
  const zz = q.z * q.z;
  return {
    alpha: (
      rad2deg * Math.atan2(2 * (q.x * q.y + q.z * q.w), xx - yy - zz + ww)
    ).toFixed(6),
    beta: (rad2deg * -Math.asin(2 * (q.x * q.z - q.y * q.w))).toFixed(6),
    gamma: (
      rad2deg * Math.atan2(2 * (q.y * q.z + q.x * q.w), -xx - yy + zz + ww)
    ).toFixed(6),
  };
}

export function toQuaternion(
  gyro: Axis,
  accl: Axis,
  productId: number
): Quaternion {
  if (productId === 0x2006) {
    leftMadgwick.update(gyro.x, gyro.y, gyro.z, accl.x, accl.y, accl.z);
    return leftMadgwick.getQuaternion();
  }
  rightMadgwick.update(gyro.x, gyro.y, gyro.z, accl.x, accl.y, accl.z);
  return rightMadgwick.getQuaternion();
}

/**
 * Check on [Documentation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#accelerometer---acceleration-in-g)
 * @param {Buffer} value
 * @return {Number}
 */
function toAcceleration(value: Uint8Array) {
  const view = new DataView(value.buffer);
  return parseFloat((0.000244 * view.getInt16(0, true)).toFixed(6));
}

/**
 * Check on [Documentation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#gyroscope---rotation-in-degreess---dps)
 * @param {Buffer} value
 * @return {Number}
 */
function toDegreesPerSecond(value: Uint8Array) {
  const view = new DataView(value.buffer);
  return parseFloat((0.06103 * view.getInt16(0, true)).toFixed(6));
}

/**
 * Check on [Documentation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#gyroscope---rotation-in-revolutionss)
 * @param {Buffer} value
 * @return {Number}
 */
function toRevolutionsPerSecond(value: Uint8Array) {
  const view = new DataView(value.buffer);
  return parseFloat((0.0001694 * view.getInt16(0, true)).toFixed(6));
}

export function parseDeviceInfo(rawData: Uint8Array): DeviceInfo {
  const bytes = rawData.slice(15, 15 + 11);
  const firmwareMajorVersionRaw = bytes.slice(0, 1)[0]; // index 0
  const firmwareMinorVersionRaw = bytes.slice(1, 2)[0]; // index 1
  const typeRaw = bytes.slice(2, 3); // index 2
  const macAddressRaw = bytes.slice(4, 10); // index 4-9
  const macAddress: string[] = [];
  macAddressRaw.forEach((number) => {
    macAddress.push(number.toString(16));
  });
  const spiColorInUseRaw = bytes.slice(11, 12); // index 11

  return {
    _raw: bytes.slice(0, 12),
    _hex: bytes.slice(0, 12),
    firmwareVersion: {
      major: firmwareMajorVersionRaw,
      minor: firmwareMinorVersionRaw,
    },
    type: ControllerType[typeRaw[0]],
    macAddress: macAddress.join(':'),
    spiColorInUse: spiColorInUseRaw[0] === 0x1,
  };
}

export function parseInputReportID(
  rawData: Uint8Array,
  data: Uint8Array
): StatusWithHex {
  return {
    _raw: rawData.slice(0, 1), // index 0
    _hex: data.slice(0, 1),
  };
}

export function parseTimer(
  rawData: Uint8Array,
  data: Uint8Array
): StatusWithHex {
  return {
    _raw: rawData.slice(1, 2), // index 1
    _hex: data.slice(1, 2),
  };
}

export function parseBatteryLevel(
  rawData: Uint8Array,
  data: Uint8Array
): BatteryLevel {
  return {
    _raw: rawData.slice(2, 3), // high nibble
    _hex: data.slice(2, 3),
    level: calculateBatteryLevel(data.slice(2, 3)),
  };
}

export function parseConnectionInfo(
  rawData: Uint8Array,
  data: Uint8Array
): StatusWithHex {
  return {
    _raw: rawData.slice(2, 3), // low nibble
    _hex: data.slice(2, 3),
  };
}

export function parseButtonStatus(
  rawData: Uint8Array,
  data: Uint8Array
): StatusWithHex {
  return {
    _raw: rawData.slice(1, 3), // index 1,2
    _hex: data.slice(1, 3),
  };
}

export function parseCompleteButtonStatus(
  rawData: Uint8Array,
  data: Uint8Array
): ButtonStatus {
  return {
    _raw: rawData.slice(3, 6), // index 3,4,5
    _hex: data.slice(3, 6),
    // Byte 3 (Right Joy-Con)
    y: Boolean(0x01 & rawData[3]),
    x: Boolean(0x02 & rawData[3]),
    b: Boolean(0x04 & rawData[3]),
    a: Boolean(0x08 & rawData[3]),
    r: Boolean(0x40 & rawData[3]),
    zr: Boolean(0x80 & rawData[3]),
    // Byte 5 (Left Joy-Con)
    down: Boolean(0x01 & rawData[5]),
    up: Boolean(0x02 & rawData[5]),
    right: Boolean(0x04 & rawData[5]),
    left: Boolean(0x08 & rawData[5]),
    l: Boolean(0x40 & rawData[5]),
    zl: Boolean(0x80 & rawData[5]),
    // Byte 3,5 (Shared)
    sr: Boolean(0x10 & rawData[3]) || Boolean(0x10 & rawData[5]),
    sl: Boolean(0x20 & rawData[3]) || Boolean(0x20 & rawData[5]),
    // Byte 4 (Shared)
    minus: Boolean(0x01 & rawData[4]),
    plus: Boolean(0x02 & rawData[4]),
    rightStick: Boolean(0x04 & rawData[4]),
    leftStick: Boolean(0x08 & rawData[4]),
    home: Boolean(0x10 & rawData[4]),
    capture: Boolean(0x20 & rawData[4]),
    chargingGrip: Boolean(0x80 & rawData[4]),
  };
}

export function parseAnalogStick(
  rawData: Uint8Array,
  data: Uint8Array
): StatusWithHex {
  return {
    _raw: rawData.slice(3, 4), // index 3
    _hex: data.slice(3, 4),
  };
}

export function parseAnalogStickLeft(
  rawData: Uint8Array,
  data: Uint8Array
): AnalogStick {
  const h = rawData[6] | ((rawData[7] & 0xf) << 8);
  // ToDo: This should use proper calibration data and not a magic number
  // (1995).
  const horizontal = ((h / 1995 - 1) * 2).toFixed(1);
  const v = ((rawData[7] >> 4) | (rawData[8] << 4)) * -1;
  // ToDo: This should use proper calibration data and not a magic number
  // (2220).
  const vertical = ((v / 2220 + 1) * 2).toFixed(1);
  return {
    _raw: rawData.slice(6, 9), // index 6,7,8
    _hex: data.slice(6, 9),
    horizontal,
    vertical,
  };
}

export function parseAnalogStickRight(
  rawData: Uint8Array,
  data: Uint8Array
): AnalogStick {
  const h = rawData[9] | ((rawData[10] & 0xf) << 8);
  // ToDo: This should use proper calibration data and not a magic number
  // (1995).
  const horizontal = ((h / 1995 - 1) * 2).toFixed(1);
  const v = ((rawData[10] >> 4) | (rawData[11] << 4)) * -1;
  // ToDo: This should use proper calibration data and not a magic number
  // (2220).
  const vertical = ((v / 2220 + 1) * 2).toFixed(1);
  return {
    _raw: rawData.slice(9, 12), // index 9,10,11
    _hex: data.slice(9, 12),
    horizontal,
    vertical,
  };
}

export function parseFilter(
  rawData: Uint8Array,
  data: Uint8Array
): StatusWithHex {
  return {
    _raw: rawData.slice(4), // index 4
    _hex: data.slice(4),
  };
}

export function parseVibrator(
  rawData: Uint8Array,
  data: Uint8Array
): StatusWithHex {
  return {
    _raw: rawData.slice(12, 13), // index 12
    _hex: data.slice(12, 13),
  };
}

export function parseAck(rawData: Uint8Array, data: Uint8Array): StatusWithHex {
  return {
    _raw: rawData.slice(13, 14), // index 13
    _hex: data.slice(13, 14),
  };
}

export function parseSubcommandID(
  rawData: Uint8Array,
  data: Uint8Array
): StatusWithHex {
  return {
    _raw: rawData.slice(14, 15), // index 14
    _hex: data.slice(14, 15),
  };
}

export function parseSubcommandReplyData(
  rawData: Uint8Array,
  data: Uint8Array
): StatusWithHex {
  return {
    _raw: rawData.slice(15), // index 15 ~
    _hex: data.slice(15),
  };
}

export function parseAccelerometers(
  rawData: Uint8Array,
  data: Uint8Array
): Accelerometer[] {
  return [
    {
      x: {
        _raw: rawData.slice(13, 15), // index 13,14
        _hex: data.slice(13, 15),
        acc: toAcceleration(rawData.slice(13, 15)),
      },
      y: {
        _raw: rawData.slice(15, 17), // index 15,16
        _hex: data.slice(15, 17),
        acc: toAcceleration(rawData.slice(15, 17)),
      },
      z: {
        _raw: rawData.slice(17, 19), // index 17,18
        _hex: data.slice(17, 19),
        acc: toAcceleration(rawData.slice(17, 19)),
      },
    },
    {
      x: {
        _raw: rawData.slice(25, 27), // index 25,26
        _hex: data.slice(25, 27),
        acc: toAcceleration(rawData.slice(25, 27)),
      },
      y: {
        _raw: rawData.slice(27, 29), // index 27,28
        _hex: data.slice(27, 29),
        acc: toAcceleration(rawData.slice(27, 29)),
      },
      z: {
        _raw: rawData.slice(29, 31), // index 29,30
        _hex: data.slice(29, 31),
        acc: toAcceleration(rawData.slice(29, 31)),
      },
    },
    {
      x: {
        _raw: rawData.slice(37, 39), // index 37,38
        _hex: data.slice(37, 39),
        acc: toAcceleration(rawData.slice(37, 39)),
      },
      y: {
        _raw: rawData.slice(39, 41), // index 39,40
        _hex: data.slice(39, 41),
        acc: toAcceleration(rawData.slice(39, 41)),
      },
      z: {
        _raw: rawData.slice(41, 43), // index 41,42
        _hex: data.slice(41, 43),
        acc: toAcceleration(rawData.slice(41, 43)),
      },
    },
  ];
}

export function parseGyroscopes(
  rawData: Uint8Array,
  data: Uint8Array
): Gyroscope[][] {
  return [
    [
      {
        _raw: rawData.slice(19, 21), // index 19,20
        _hex: data.slice(19, 21),
        dps: toDegreesPerSecond(rawData.slice(19, 21)),
        rps: toRevolutionsPerSecond(rawData.slice(19, 21)),
      },
      {
        _raw: rawData.slice(21, 23), // index 21,22
        _hex: data.slice(21, 23),
        dps: toDegreesPerSecond(rawData.slice(21, 23)),
        rps: toRevolutionsPerSecond(rawData.slice(21, 23)),
      },
      {
        _raw: rawData.slice(23, 25), // index 23,24
        _hex: data.slice(23, 25),
        dps: toDegreesPerSecond(rawData.slice(23, 25)),
        rps: toRevolutionsPerSecond(rawData.slice(23, 25)),
      },
    ],
    [
      {
        _raw: rawData.slice(31, 33), // index 31,32
        _hex: data.slice(31, 33),
        dps: toDegreesPerSecond(rawData.slice(31, 33)),
        rps: toRevolutionsPerSecond(rawData.slice(31, 33)),
      },
      {
        _raw: rawData.slice(33, 35), // index 33,34
        _hex: data.slice(33, 35),
        dps: toDegreesPerSecond(rawData.slice(33, 35)),
        rps: toRevolutionsPerSecond(rawData.slice(33, 35)),
      },
      {
        _raw: rawData.slice(35, 37), // index 35,36
        _hex: data.slice(35, 37),
        dps: toDegreesPerSecond(rawData.slice(35, 37)),
        rps: toRevolutionsPerSecond(rawData.slice(35, 37)),
      },
    ],
    [
      {
        _raw: rawData.slice(43, 45), // index 43,44
        _hex: data.slice(43, 45),
        dps: toDegreesPerSecond(rawData.slice(43, 45)),
        rps: toRevolutionsPerSecond(rawData.slice(43, 45)),
      },
      {
        _raw: rawData.slice(45, 47), // index 45,46
        _hex: data.slice(45, 47),
        dps: toDegreesPerSecond(rawData.slice(45, 47)),
        rps: toRevolutionsPerSecond(rawData.slice(45, 47)),
      },
      {
        _raw: rawData.slice(47, 49), // index 47,48
        _hex: data.slice(47, 49),
        dps: toDegreesPerSecond(rawData.slice(47, 49)),
        rps: toRevolutionsPerSecond(rawData.slice(47, 49)),
      },
    ],
  ];
}

export function calculateActualAccelerometer(accelerometers: number[][]) {
  const elapsedTime = 0.005 * accelerometers.length; // Spent 5ms to collect each data.

  const actualAccelerometer = {
    x: parseFloat(
      (mean(accelerometers.map((g) => g[0])) * elapsedTime).toFixed(6)
    ),
    y: parseFloat(
      (mean(accelerometers.map((g) => g[1])) * elapsedTime).toFixed(6)
    ),
    z: parseFloat(
      (mean(accelerometers.map((g) => g[2])) * elapsedTime).toFixed(6)
    ),
  };

  return actualAccelerometer;
}

export function calculateActualGyroscope(gyroscopes: number[][]) {
  const elapsedTime = 0.005 * gyroscopes.length; // Spent 5ms to collect each data.
  const actualGyroscopes = [
    mean(gyroscopes.map((g) => g[0])),
    mean(gyroscopes.map((g) => g[1])),
    mean(gyroscopes.map((g) => g[2])),
  ].map((v) => parseFloat((v * elapsedTime).toFixed(6)));

  return {
    x: actualGyroscopes[0],
    y: actualGyroscopes[1],
    z: actualGyroscopes[2],
  };
}
