import { JoyCon, JoyConLeft, JoyConRight } from './joycon';
interface CustomEventMap {
    "connect": CustomEvent<JoyCon>;
    "disconnect": CustomEvent<number>;
}
declare global {
    function addEventListener<K extends keyof CustomEventMap>(type: K, handler: (event: CustomEventMap[K]) => void): void;
    function removeEventListener<K extends keyof CustomEventMap>(type: K, handler: (event: CustomEventMap[K]) => void): void;
}
declare const connectedJoyCons: Map<number | undefined, JoyCon>;
declare const connectJoyCon: () => Promise<void>;
export { connectJoyCon, connectedJoyCons, JoyConLeft, JoyConRight };
//# sourceMappingURL=index.d.ts.map