/// <reference types="w3c-web-hid" />
import type { Accelerometer, AnalogStick, Axis, BatteryLevel, ButtonStatus, DeviceInfo, EulerAngles, Gyroscope, Quaternion, StatusWithHex } from './parse';
declare type BatteryLevelEvent = CustomEvent<BatteryLevel>;
declare type DeviceInfoEvent = CustomEvent<DeviceInfo>;
declare type HIDInputEvent = CustomEvent<Packet>;
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
export declare class JoyCon extends EventTarget {
    private device;
    /**
     * Creates an instance of JoyCon.
     * @param {HIDDevice} device
     * @memberof JoyCon
     */
    constructor(device: HIDDevice);
    /**
     * Device opened status.
     */
    get opened(): boolean | undefined;
    /**
     * Opens the device.
     *
     * @memberof JoyCon
     */
    open(): Promise<void>;
    /**
     * Requests information about the device.
     *
     * @memberof JoyCon
     */
    getRequestDeviceInfo(): Promise<DeviceInfo>;
    /**
     * Requests information about the battery.
     *
     * @memberof JoyCon
     */
    getBatteryLevel(): Promise<BatteryLevel>;
    /**
     * Enables simple HID mode.
     *
     * @memberof JoyCon
     */
    enableSimpleHIDMode(): Promise<void>;
    /**
     * Enables standard full mode.
     *
     * @memberof JoyCon
     */
    enableStandardFullMode(): Promise<void>;
    /**
     * Enables EMU mode.
     *
     * @memberof JoyCon
     */
    enableIMUMode(): Promise<void>;
    /**
     * Disables IMU mode.
     *
     * @memberof JoyCon
     */
    disableIMUMode(): Promise<void>;
    /**
     * Enables vibration.
     *
     * @memberof JoyCon
     */
    enableVibration(): Promise<void>;
    /**
     * Disables vibration.
     *
     * @memberof JoyCon
     */
    disableVibration(): Promise<void>;
    /**
     * Send a rumble signal to Joy-Con.
     *
     * @param {number} lowFrequency
     * @param {number} highFrequency
     * @param {number} amplitude
     *
     * @memberof JoyCon
     */
    rumble(lowFrequency: number, highFrequency: number, amplitude: number): Promise<void>;
    /**
     * Deal with `oninputreport` events.
     *
     * @param {*} event
     * @memberof JoyCon
     */
    _onInputReport(event: HIDInputReportEvent): void;
    /**
     *
     *
     * @param {*} deviceInfo
     * @memberof JoyCon
     */
    _receiveDeviceInfo(deviceInfo: DeviceInfo): void;
    /**
     *
     *
     * @param {*} batteryLevel
     * @memberof JoyCon
     */
    _receiveBatteryLevel(batteryLevel: BatteryLevel): void;
    _receiveInputEvent(_packet: Packet): void;
}
/**
 *
 *
 * @class JoyConLeft
 * @extends {JoyCon}
 */
declare class JoyConLeft extends JoyCon {
    /**
     * Creates an instance of JoyConLeft.
     * @param {HIDDevice} device
     * @memberof JoyConLeft
     */
    constructor(device: HIDDevice);
    /**
     *
     *
     * @param {*} packet
     * @memberof JoyConLeft
     */
    _receiveInputEvent(packet: Packet): void;
}
/**
 *
 *
 * @class JoyConRight
 * @extends {JoyCon}
 */
declare class JoyConRight extends JoyCon {
    /**
     *Creates an instance of JoyConRight.
     * @param {HIDDevice} device
     * @memberof JoyConRight
     */
    constructor(device: HIDDevice);
    /**
     *
     *
     * @param {*} packet
     * @memberof JoyConRight
     */
    _receiveInputEvent(packet: Packet): void;
}
export { JoyConLeft, JoyConRight };
//# sourceMappingURL=joycon.d.ts.map