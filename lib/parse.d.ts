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
export declare function toEulerAngles(gyroscope: Axis, accelerometer: Axis, productId: number): EulerAngles | undefined;
export declare function toEulerAnglesQuaternion(q: Quaternion): EulerAngles;
export declare function toQuaternion(gyro: Axis, accl: Axis, productId: number): Quaternion;
export declare function parseDeviceInfo(rawData: Uint8Array): DeviceInfo;
export declare function parseInputReportID(rawData: Uint8Array, data: Uint8Array): StatusWithHex;
export declare function parseTimer(rawData: Uint8Array, data: Uint8Array): StatusWithHex;
export declare function parseBatteryLevel(rawData: Uint8Array, data: Uint8Array): BatteryLevel;
export declare function parseConnectionInfo(rawData: Uint8Array, data: Uint8Array): StatusWithHex;
export declare function parseButtonStatus(rawData: Uint8Array, data: Uint8Array): StatusWithHex;
export declare function parseCompleteButtonStatus(rawData: Uint8Array, data: Uint8Array): ButtonStatus;
export declare function parseAnalogStick(rawData: Uint8Array, data: Uint8Array): StatusWithHex;
export declare function parseAnalogStickLeft(rawData: Uint8Array, data: Uint8Array): AnalogStick;
export declare function parseAnalogStickRight(rawData: Uint8Array, data: Uint8Array): AnalogStick;
export declare function parseFilter(rawData: Uint8Array, data: Uint8Array): StatusWithHex;
export declare function parseVibrator(rawData: Uint8Array, data: Uint8Array): StatusWithHex;
export declare function parseAck(rawData: Uint8Array, data: Uint8Array): StatusWithHex;
export declare function parseSubcommandID(rawData: Uint8Array, data: Uint8Array): StatusWithHex;
export declare function parseSubcommandReplyData(rawData: Uint8Array, data: Uint8Array): StatusWithHex;
export declare function parseAccelerometers(rawData: Uint8Array, data: Uint8Array): Accelerometer[];
export declare function parseGyroscopes(rawData: Uint8Array, data: Uint8Array): Gyroscope[][];
export declare function calculateActualAccelerometer(accelerometers: number[][]): {
    x: number;
    y: number;
    z: number;
};
export declare function calculateActualGyroscope(gyroscopes: number[][]): {
    x: number;
    y: number;
    z: number;
};
export {};
//# sourceMappingURL=parse.d.ts.map