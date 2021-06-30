var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __reExport = (target, module, desc) => {
  if (module && typeof module === "object" || typeof module === "function") {
    for (let key of __getOwnPropNames(module))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module) => {
  return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// node_modules/.pnpm/ahrs@1.2.3/node_modules/ahrs/Mahony.js
var require_Mahony = __commonJS({
  "node_modules/.pnpm/ahrs@1.2.3/node_modules/ahrs/Mahony.js"(exports, module) {
    "use strict";
    module.exports = function Mahony(sampleInterval, options) {
      options = options || {};
      const kp = options.kp || 1;
      const ki = options.ki || 0;
      const sampleFreq = 1e3 / sampleInterval;
      let recipSampleFreq = 1 / sampleFreq;
      let initalised = options.doInitialisation === true ? false : true;
      let twoKp = 2 * kp;
      const twoKi = 2 * ki;
      let q0 = 1, q1 = 0, q2 = 0, q3 = 0;
      let integralFBx = 0, integralFBy = 0, integralFBz = 0;
      function mahonyAHRSUpdateIMU(gx, gy, gz, ax, ay, az) {
        let recipNorm;
        let halfvx, halfvy, halfvz;
        let halfex, halfey, halfez;
        if (ax !== 0 && ay !== 0 && az !== 0) {
          recipNorm = (ax * ax + ay * ay + az * az) ** -0.5;
          ax *= recipNorm;
          ay *= recipNorm;
          az *= recipNorm;
          halfvx = q1 * q3 - q0 * q2;
          halfvy = q0 * q1 + q2 * q3;
          halfvz = q0 * q0 - 0.5 + q3 * q3;
          halfex = ay * halfvz - az * halfvy;
          halfey = az * halfvx - ax * halfvz;
          halfez = ax * halfvy - ay * halfvx;
          if (twoKi > 0) {
            integralFBx += twoKi * halfex * recipSampleFreq;
            integralFBy += twoKi * halfey * recipSampleFreq;
            integralFBz += twoKi * halfez * recipSampleFreq;
            gx += integralFBx;
            gy += integralFBy;
            gz += integralFBz;
          } else {
            integralFBx = 0;
            integralFBy = 0;
            integralFBz = 0;
          }
          gx += twoKp * halfex;
          gy += twoKp * halfey;
          gz += twoKp * halfez;
        }
        gx *= 0.5 * recipSampleFreq;
        gy *= 0.5 * recipSampleFreq;
        gz *= 0.5 * recipSampleFreq;
        const qa = q0;
        const qb = q1;
        const qc = q2;
        q0 += -qb * gx - qc * gy - q3 * gz;
        q1 += qa * gx + qc * gz - q3 * gy;
        q2 += qa * gy - qb * gz + q3 * gx;
        q3 += qa * gz + qb * gy - qc * gx;
        recipNorm = (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3) ** -0.5;
        q0 *= recipNorm;
        q1 *= recipNorm;
        q2 *= recipNorm;
        q3 *= recipNorm;
      }
      function doBruteForceInitialisation(ax, ay, az, mx, my, mz) {
        initalised = true;
        const twoKpOrig = twoKp;
        twoKp = 2.5;
        for (let i = 0; i <= 9; i += 1) {
          mahonyAHRSUpdate(0, 0, 0, ax, ay, az, mx, my, mz, 1);
        }
        twoKp = twoKpOrig;
      }
      function mahonyAHRSUpdate(gx, gy, gz, ax, ay, az, mx, my, mz, deltaTimeSec) {
        recipSampleFreq = deltaTimeSec || recipSampleFreq;
        if (!initalised) {
          doBruteForceInitialisation(ax, ay, az, mx, my, mz);
        }
        let recipNorm;
        let q0q0, q0q1, q0q2, q0q3, q1q1, q1q2, q1q3, q2q2, q2q3, q3q3;
        let hx, hy, bx, bz;
        let halfvx, halfvy, halfvz, halfwx, halfwy, halfwz;
        let halfex, halfey, halfez;
        if (mx === void 0 || my === void 0 || mz === void 0 || mx === 0 && my === 0 && mz === 0) {
          mahonyAHRSUpdateIMU(gx, gy, gz, ax, ay, az);
          return;
        }
        if (ax !== 0 && ay !== 0 && az !== 0) {
          recipNorm = (ax * ax + ay * ay + az * az) ** -0.5;
          ax *= recipNorm;
          ay *= recipNorm;
          az *= recipNorm;
          recipNorm = (mx * mx + my * my + mz * mz) ** -0.5;
          mx *= recipNorm;
          my *= recipNorm;
          mz *= recipNorm;
          q0q0 = q0 * q0;
          q0q1 = q0 * q1;
          q0q2 = q0 * q2;
          q0q3 = q0 * q3;
          q1q1 = q1 * q1;
          q1q2 = q1 * q2;
          q1q3 = q1 * q3;
          q2q2 = q2 * q2;
          q2q3 = q2 * q3;
          q3q3 = q3 * q3;
          hx = 2 * (mx * (0.5 - q2q2 - q3q3) + my * (q1q2 - q0q3) + mz * (q1q3 + q0q2));
          hy = 2 * (mx * (q1q2 + q0q3) + my * (0.5 - q1q1 - q3q3) + mz * (q2q3 - q0q1));
          bx = Math.sqrt(hx * hx + hy * hy);
          bz = 2 * (mx * (q1q3 - q0q2) + my * (q2q3 + q0q1) + mz * (0.5 - q1q1 - q2q2));
          halfvx = q1q3 - q0q2;
          halfvy = q0q1 + q2q3;
          halfvz = q0q0 - 0.5 + q3q3;
          halfwx = bx * (0.5 - q2q2 - q3q3) + bz * (q1q3 - q0q2);
          halfwy = bx * (q1q2 - q0q3) + bz * (q0q1 + q2q3);
          halfwz = bx * (q0q2 + q1q3) + bz * (0.5 - q1q1 - q2q2);
          halfex = ay * halfvz - az * halfvy + (my * halfwz - mz * halfwy);
          halfey = az * halfvx - ax * halfvz + (mz * halfwx - mx * halfwz);
          halfez = ax * halfvy - ay * halfvx + (mx * halfwy - my * halfwx);
          if (twoKi > 0) {
            integralFBx += twoKi * halfex * recipSampleFreq;
            integralFBy += twoKi * halfey * recipSampleFreq;
            integralFBz += twoKi * halfez * recipSampleFreq;
            gx += integralFBx;
            gy += integralFBy;
            gz += integralFBz;
          } else {
            integralFBx = 0;
            integralFBy = 0;
            integralFBz = 0;
          }
          gx += twoKp * halfex;
          gy += twoKp * halfey;
          gz += twoKp * halfez;
        }
        gx *= 0.5 * recipSampleFreq;
        gy *= 0.5 * recipSampleFreq;
        gz *= 0.5 * recipSampleFreq;
        const qa = q0;
        const qb = q1;
        const qc = q2;
        q0 += -qb * gx - qc * gy - q3 * gz;
        q1 += qa * gx + qc * gz - q3 * gy;
        q2 += qa * gy - qb * gz + q3 * gx;
        q3 += qa * gz + qb * gy - qc * gx;
        recipNorm = (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3) ** -0.5;
        q0 *= recipNorm;
        q1 *= recipNorm;
        q2 *= recipNorm;
        q3 *= recipNorm;
      }
      return {
        update: mahonyAHRSUpdate,
        getQuaternion() {
          return {
            w: q0,
            x: q1,
            y: q2,
            z: q3
          };
        }
      };
    };
  }
});

// node_modules/.pnpm/ahrs@1.2.3/node_modules/ahrs/Madgwick.js
var require_Madgwick = __commonJS({
  "node_modules/.pnpm/ahrs@1.2.3/node_modules/ahrs/Madgwick.js"(exports, module) {
    "use strict";
    module.exports = function Madgwick(sampleInterval, options) {
      options = options || {};
      const sampleFreq = 1e3 / sampleInterval;
      let beta = options.beta || 1;
      let initalised = options.doInitialisation === true ? false : true;
      let q0 = 1, q1 = 0, q2 = 0, q3 = 0;
      let recipSampleFreq = 1 / sampleFreq;
      function madgwickAHRSUpdateIMU(gx, gy, gz, ax, ay, az) {
        let recipNorm;
        let s0, s1, s2, s3;
        let qDot1, qDot2, qDot3, qDot4;
        let v2q0, v2q1, v2q2, v2q3, v4q0, v4q1, v4q2, v8q1, v8q2, q0q0, q1q1, q2q2, q3q3;
        qDot1 = 0.5 * (-q1 * gx - q2 * gy - q3 * gz);
        qDot2 = 0.5 * (q0 * gx + q2 * gz - q3 * gy);
        qDot3 = 0.5 * (q0 * gy - q1 * gz + q3 * gx);
        qDot4 = 0.5 * (q0 * gz + q1 * gy - q2 * gx);
        if (!(ax === 0 && ay === 0 && az === 0)) {
          recipNorm = (ax * ax + ay * ay + az * az) ** -0.5;
          ax *= recipNorm;
          ay *= recipNorm;
          az *= recipNorm;
          v2q0 = 2 * q0;
          v2q1 = 2 * q1;
          v2q2 = 2 * q2;
          v2q3 = 2 * q3;
          v4q0 = 4 * q0;
          v4q1 = 4 * q1;
          v4q2 = 4 * q2;
          v8q1 = 8 * q1;
          v8q2 = 8 * q2;
          q0q0 = q0 * q0;
          q1q1 = q1 * q1;
          q2q2 = q2 * q2;
          q3q3 = q3 * q3;
          s0 = v4q0 * q2q2 + v2q2 * ax + v4q0 * q1q1 - v2q1 * ay;
          s1 = v4q1 * q3q3 - v2q3 * ax + 4 * q0q0 * q1 - v2q0 * ay - v4q1 + v8q1 * q1q1 + v8q1 * q2q2 + v4q1 * az;
          s2 = 4 * q0q0 * q2 + v2q0 * ax + v4q2 * q3q3 - v2q3 * ay - v4q2 + v8q2 * q1q1 + v8q2 * q2q2 + v4q2 * az;
          s3 = 4 * q1q1 * q3 - v2q1 * ax + 4 * q2q2 * q3 - v2q2 * ay;
          recipNorm = (s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3) ** -0.5;
          s0 *= recipNorm;
          s1 *= recipNorm;
          s2 *= recipNorm;
          s3 *= recipNorm;
          qDot1 -= beta * s0;
          qDot2 -= beta * s1;
          qDot3 -= beta * s2;
          qDot4 -= beta * s3;
        }
        q0 += qDot1 * recipSampleFreq;
        q1 += qDot2 * recipSampleFreq;
        q2 += qDot3 * recipSampleFreq;
        q3 += qDot4 * recipSampleFreq;
        recipNorm = (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3) ** -0.5;
        q0 *= recipNorm;
        q1 *= recipNorm;
        q2 *= recipNorm;
        q3 *= recipNorm;
      }
      function doBruteForceInitialisation(ax, ay, az, mx, my, mz) {
        initalised = true;
        const betaOrig = beta;
        beta = 0.4;
        for (let i = 0; i <= 9; i += 1) {
          madgwickAHRSUpdate(0, 0, 0, ax, ay, az, mx, my, mz, 1);
        }
        beta = betaOrig;
      }
      function madgwickAHRSUpdate(gx, gy, gz, ax, ay, az, mx, my, mz, deltaTimeSec) {
        recipSampleFreq = deltaTimeSec || recipSampleFreq;
        if (!initalised) {
          doBruteForceInitialisation(ax, ay, az, mx, my, mz);
        }
        let recipNorm;
        let s0, s1, s2, s3;
        let qDot1, qDot2, qDot3, qDot4;
        let hx, hy;
        let v2q0mx, v2q0my, v2q0mz, v2q1mx, v2bx, v2bz, v4bx, v4bz, v2q0, v2q1, v2q2, v2q3, v2q0q2, v2q2q3;
        let q0q0, q0q1, q0q2, q0q3, q1q1, q1q2, q1q3, q2q2, q2q3, q3q3;
        if (mx === void 0 || my === void 0 || mz === void 0 || mx === 0 && my === 0 && mz === 0) {
          madgwickAHRSUpdateIMU(gx, gy, gz, ax, ay, az);
          return;
        }
        qDot1 = 0.5 * (-q1 * gx - q2 * gy - q3 * gz);
        qDot2 = 0.5 * (q0 * gx + q2 * gz - q3 * gy);
        qDot3 = 0.5 * (q0 * gy - q1 * gz + q3 * gx);
        qDot4 = 0.5 * (q0 * gz + q1 * gy - q2 * gx);
        if (!(ax === 0 && ay === 0 && az === 0)) {
          recipNorm = (ax * ax + ay * ay + az * az) ** -0.5;
          ax *= recipNorm;
          ay *= recipNorm;
          az *= recipNorm;
          recipNorm = (mx * mx + my * my + mz * mz) ** -0.5;
          mx *= recipNorm;
          my *= recipNorm;
          mz *= recipNorm;
          v2q0mx = 2 * q0 * mx;
          v2q0my = 2 * q0 * my;
          v2q0mz = 2 * q0 * mz;
          v2q1mx = 2 * q1 * mx;
          v2q0 = 2 * q0;
          v2q1 = 2 * q1;
          v2q2 = 2 * q2;
          v2q3 = 2 * q3;
          v2q0q2 = 2 * q0 * q2;
          v2q2q3 = 2 * q2 * q3;
          q0q0 = q0 * q0;
          q0q1 = q0 * q1;
          q0q2 = q0 * q2;
          q0q3 = q0 * q3;
          q1q1 = q1 * q1;
          q1q2 = q1 * q2;
          q1q3 = q1 * q3;
          q2q2 = q2 * q2;
          q2q3 = q2 * q3;
          q3q3 = q3 * q3;
          hx = mx * q0q0 - v2q0my * q3 + v2q0mz * q2 + mx * q1q1 + v2q1 * my * q2 + v2q1 * mz * q3 - mx * q2q2 - mx * q3q3;
          hy = v2q0mx * q3 + my * q0q0 - v2q0mz * q1 + v2q1mx * q2 - my * q1q1 + my * q2q2 + v2q2 * mz * q3 - my * q3q3;
          v2bx = Math.sqrt(hx * hx + hy * hy);
          v2bz = -v2q0mx * q2 + v2q0my * q1 + mz * q0q0 + v2q1mx * q3 - mz * q1q1 + v2q2 * my * q3 - mz * q2q2 + mz * q3q3;
          v4bx = 2 * v2bx;
          v4bz = 2 * v2bz;
          s0 = -v2q2 * (2 * q1q3 - v2q0q2 - ax) + v2q1 * (2 * q0q1 + v2q2q3 - ay) - v2bz * q2 * (v2bx * (0.5 - q2q2 - q3q3) + v2bz * (q1q3 - q0q2) - mx) + (-v2bx * q3 + v2bz * q1) * (v2bx * (q1q2 - q0q3) + v2bz * (q0q1 + q2q3) - my) + v2bx * q2 * (v2bx * (q0q2 + q1q3) + v2bz * (0.5 - q1q1 - q2q2) - mz);
          s1 = v2q3 * (2 * q1q3 - v2q0q2 - ax) + v2q0 * (2 * q0q1 + v2q2q3 - ay) - 4 * q1 * (1 - 2 * q1q1 - 2 * q2q2 - az) + v2bz * q3 * (v2bx * (0.5 - q2q2 - q3q3) + v2bz * (q1q3 - q0q2) - mx) + (v2bx * q2 + v2bz * q0) * (v2bx * (q1q2 - q0q3) + v2bz * (q0q1 + q2q3) - my) + (v2bx * q3 - v4bz * q1) * (v2bx * (q0q2 + q1q3) + v2bz * (0.5 - q1q1 - q2q2) - mz);
          s2 = -v2q0 * (2 * q1q3 - v2q0q2 - ax) + v2q3 * (2 * q0q1 + v2q2q3 - ay) - 4 * q2 * (1 - 2 * q1q1 - 2 * q2q2 - az) + (-v4bx * q2 - v2bz * q0) * (v2bx * (0.5 - q2q2 - q3q3) + v2bz * (q1q3 - q0q2) - mx) + (v2bx * q1 + v2bz * q3) * (v2bx * (q1q2 - q0q3) + v2bz * (q0q1 + q2q3) - my) + (v2bx * q0 - v4bz * q2) * (v2bx * (q0q2 + q1q3) + v2bz * (0.5 - q1q1 - q2q2) - mz);
          s3 = v2q1 * (2 * q1q3 - v2q0q2 - ax) + v2q2 * (2 * q0q1 + v2q2q3 - ay) + (-v4bx * q3 + v2bz * q1) * (v2bx * (0.5 - q2q2 - q3q3) + v2bz * (q1q3 - q0q2) - mx) + (-v2bx * q0 + v2bz * q2) * (v2bx * (q1q2 - q0q3) + v2bz * (q0q1 + q2q3) - my) + v2bx * q1 * (v2bx * (q0q2 + q1q3) + v2bz * (0.5 - q1q1 - q2q2) - mz);
          recipNorm = (s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3) ** -0.5;
          s0 *= recipNorm;
          s1 *= recipNorm;
          s2 *= recipNorm;
          s3 *= recipNorm;
          qDot1 -= beta * s0;
          qDot2 -= beta * s1;
          qDot3 -= beta * s2;
          qDot4 -= beta * s3;
        }
        q0 += qDot1 * recipSampleFreq;
        q1 += qDot2 * recipSampleFreq;
        q2 += qDot3 * recipSampleFreq;
        q3 += qDot4 * recipSampleFreq;
        recipNorm = (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3) ** -0.5;
        q0 *= recipNorm;
        q1 *= recipNorm;
        q2 *= recipNorm;
        q3 *= recipNorm;
      }
      return {
        update: madgwickAHRSUpdate,
        getQuaternion() {
          return {
            w: q0,
            x: q1,
            y: q2,
            z: q3
          };
        }
      };
    };
  }
});

// node_modules/.pnpm/ahrs@1.2.3/node_modules/ahrs/index.js
var require_ahrs = __commonJS({
  "node_modules/.pnpm/ahrs@1.2.3/node_modules/ahrs/index.js"(exports, module) {
    "use strict";
    var rad2deg2 = 180 / Math.PI;
    function AHRS(options) {
      options = options || {};
      const sampleInterval = options.sampleInterval || 20;
      const algorithmName = options.algorithm || "Madgwick";
      let Req;
      if (algorithmName === "Mahony") {
        Req = require_Mahony();
      } else if (algorithmName === "Madgwick") {
        Req = require_Madgwick();
      } else {
        throw new Error(`AHRS(): Algorithm not valid: ${algorithmName}`);
      }
      const algorithmFn = Req(sampleInterval, options);
      const self = this;
      Object.keys(algorithmFn).forEach((prop) => self[prop] = algorithmFn[prop]);
    }
    AHRS.prototype.toVector = function toVector() {
      const q = this.getQuaternion();
      const angle = 2 * Math.acos(q.w);
      const sinAngle = Math.sin(angle / 2);
      return {
        angle,
        x: q.x / sinAngle,
        y: q.y / sinAngle,
        z: q.z / sinAngle
      };
    };
    AHRS.prototype.getEulerAngles = function getEulerAngles() {
      const q = this.getQuaternion();
      const ww = q.w * q.w, xx = q.x * q.x, yy = q.y * q.y, zz = q.z * q.z;
      return {
        heading: Math.atan2(2 * (q.x * q.y + q.z * q.w), xx - yy - zz + ww),
        pitch: -Math.asin(2 * (q.x * q.z - q.y * q.w)),
        roll: Math.atan2(2 * (q.y * q.z + q.x * q.w), -xx - yy + zz + ww)
      };
    };
    AHRS.prototype.getEulerAnglesDegrees = function getEulerAnglesDegrees() {
      const getEulerAnglesRad = this.getEulerAngles();
      return {
        heading: getEulerAnglesRad.heading * rad2deg2,
        pitch: getEulerAnglesRad.pitch * rad2deg2,
        roll: getEulerAnglesRad.roll * rad2deg2
      };
    };
    module.exports = AHRS;
  }
});

// src/parse.ts
var import_ahrs = __toModule(require_ahrs());
var leftMadgwick = new import_ahrs.default({ sampleInterval: 10 });
var rightMadgwick = new import_ahrs.default({ sampleInterval: 10 });
var rad2deg = 180 / Math.PI;
function baseSum(array, iteratee) {
  let result = 0;
  for (const value of array) {
    const current = iteratee(value);
    if (current !== void 0) {
      result = result === void 0 ? current : result + current;
    }
  }
  return result;
}
function mean(array) {
  return baseMean(array, (value) => value);
}
function baseMean(array, iteratee) {
  const length = array == null ? 0 : array.length;
  return length ? baseSum(array, iteratee) / length : NaN;
}
function calculateBatteryLevel(value) {
  let level = "";
  switch (value[0]) {
    case 8:
      level = "full";
      break;
    case 4:
      level = "medium";
      break;
    case 2:
      level = "low";
      break;
    case 1:
      level = "critical";
      break;
    case 0:
      level = "empty";
      break;
    default:
      level = "charging";
  }
  return level;
}
var ControllerType = {
  1: "Left Joy-Con",
  2: "Right Joy-Con",
  3: "Pro Controller"
};
var lastValues = {
  8198: {
    timestamp: null,
    alpha: 0,
    beta: 0,
    gamma: 0
  },
  8199: {
    timestamp: null,
    alpha: 0,
    beta: 0,
    gamma: 0
  }
};
var bias = 0.75;
var zeroBias = 0.0125;
var scale = Math.PI / 2;
function toEulerAngles(gyroscope, accelerometer, productId) {
  const now = Date.now();
  const value = lastValues[productId];
  if (!value)
    return;
  const dt = value.timestamp ? (now - value.timestamp) / 1e3 : 0;
  value.timestamp = now;
  const norm = Math.sqrt(accelerometer.x ** 2 + accelerometer.y ** 2 + accelerometer.z ** 2);
  value.alpha = (1 - zeroBias) * (value.alpha + gyroscope.z * dt);
  if (norm !== 0) {
    value.beta = bias * (value.beta + gyroscope.x * dt) + (1 - bias) * (accelerometer.x * scale / norm);
    value.gamma = bias * (value.gamma + gyroscope.y * dt) + (1 - bias) * (accelerometer.y * -scale / norm);
  }
  return {
    alpha: productId === 8198 ? (-1 * (value.alpha * 180) / Math.PI * 430 % 90).toFixed(6) : (value.alpha * 180 / Math.PI * 430 % 360).toFixed(6),
    beta: (-1 * (value.beta * 180) / Math.PI).toFixed(6),
    gamma: productId === 8198 ? (-1 * (value.gamma * 180) / Math.PI).toFixed(6) : (value.gamma * 180 / Math.PI).toFixed(6)
  };
}
function toEulerAnglesQuaternion(q) {
  const ww = q.w * q.w;
  const xx = q.x * q.x;
  const yy = q.y * q.y;
  const zz = q.z * q.z;
  return {
    alpha: (rad2deg * Math.atan2(2 * (q.x * q.y + q.z * q.w), xx - yy - zz + ww)).toFixed(6),
    beta: (rad2deg * -Math.asin(2 * (q.x * q.z - q.y * q.w))).toFixed(6),
    gamma: (rad2deg * Math.atan2(2 * (q.y * q.z + q.x * q.w), -xx - yy + zz + ww)).toFixed(6)
  };
}
function toQuaternion(gyro, accl, productId) {
  if (productId === 8198) {
    leftMadgwick.update(gyro.x, gyro.y, gyro.z, accl.x, accl.y, accl.z);
    return leftMadgwick.getQuaternion();
  }
  rightMadgwick.update(gyro.x, gyro.y, gyro.z, accl.x, accl.y, accl.z);
  return rightMadgwick.getQuaternion();
}
function toAcceleration(value) {
  const view = new DataView(value.buffer);
  return parseFloat((244e-6 * view.getInt16(0, true)).toFixed(6));
}
function toDegreesPerSecond(value) {
  const view = new DataView(value.buffer);
  return parseFloat((0.06103 * view.getInt16(0, true)).toFixed(6));
}
function toRevolutionsPerSecond(value) {
  const view = new DataView(value.buffer);
  return parseFloat((1694e-7 * view.getInt16(0, true)).toFixed(6));
}
function parseDeviceInfo(rawData) {
  const bytes = rawData.slice(15, 15 + 11);
  const firmwareMajorVersionRaw = bytes.slice(0, 1)[0];
  const firmwareMinorVersionRaw = bytes.slice(1, 2)[0];
  const typeRaw = bytes.slice(2, 3);
  const macAddressRaw = bytes.slice(4, 10);
  const macAddress = [];
  macAddressRaw.forEach((number) => {
    macAddress.push(number.toString(16));
  });
  const spiColorInUseRaw = bytes.slice(11, 12);
  return {
    _raw: bytes.slice(0, 12),
    _hex: bytes.slice(0, 12),
    firmwareVersion: {
      major: firmwareMajorVersionRaw,
      minor: firmwareMinorVersionRaw
    },
    type: ControllerType[typeRaw[0]],
    macAddress: macAddress.join(":"),
    spiColorInUse: spiColorInUseRaw[0] === 1
  };
}
function parseInputReportID(rawData, data) {
  return {
    _raw: rawData.slice(0, 1),
    _hex: data.slice(0, 1)
  };
}
function parseTimer(rawData, data) {
  return {
    _raw: rawData.slice(1, 2),
    _hex: data.slice(1, 2)
  };
}
function parseBatteryLevel(rawData, data) {
  return {
    _raw: rawData.slice(2, 3),
    _hex: data.slice(2, 3),
    level: calculateBatteryLevel(data.slice(2, 3))
  };
}
function parseConnectionInfo(rawData, data) {
  return {
    _raw: rawData.slice(2, 3),
    _hex: data.slice(2, 3)
  };
}
function parseButtonStatus(rawData, data) {
  return {
    _raw: rawData.slice(1, 3),
    _hex: data.slice(1, 3)
  };
}
function parseCompleteButtonStatus(rawData, data) {
  return {
    _raw: rawData.slice(3, 6),
    _hex: data.slice(3, 6),
    y: Boolean(1 & rawData[3]),
    x: Boolean(2 & rawData[3]),
    b: Boolean(4 & rawData[3]),
    a: Boolean(8 & rawData[3]),
    r: Boolean(64 & rawData[3]),
    zr: Boolean(128 & rawData[3]),
    down: Boolean(1 & rawData[5]),
    up: Boolean(2 & rawData[5]),
    right: Boolean(4 & rawData[5]),
    left: Boolean(8 & rawData[5]),
    l: Boolean(64 & rawData[5]),
    zl: Boolean(128 & rawData[5]),
    sr: Boolean(16 & rawData[3]) || Boolean(16 & rawData[5]),
    sl: Boolean(32 & rawData[3]) || Boolean(32 & rawData[5]),
    minus: Boolean(1 & rawData[4]),
    plus: Boolean(2 & rawData[4]),
    rightStick: Boolean(4 & rawData[4]),
    leftStick: Boolean(8 & rawData[4]),
    home: Boolean(16 & rawData[4]),
    capture: Boolean(32 & rawData[4]),
    chargingGrip: Boolean(128 & rawData[4])
  };
}
function parseAnalogStick(rawData, data) {
  return {
    _raw: rawData.slice(3, 4),
    _hex: data.slice(3, 4)
  };
}
function parseAnalogStickLeft(rawData, data) {
  const h = rawData[6] | (rawData[7] & 15) << 8;
  const horizontal = ((h / 1995 - 1) * 2).toFixed(1);
  const v = (rawData[7] >> 4 | rawData[8] << 4) * -1;
  const vertical = ((v / 2220 + 1) * 2).toFixed(1);
  return {
    _raw: rawData.slice(6, 9),
    _hex: data.slice(6, 9),
    horizontal,
    vertical
  };
}
function parseAnalogStickRight(rawData, data) {
  const h = rawData[9] | (rawData[10] & 15) << 8;
  const horizontal = ((h / 1995 - 1) * 2).toFixed(1);
  const v = (rawData[10] >> 4 | rawData[11] << 4) * -1;
  const vertical = ((v / 2220 + 1) * 2).toFixed(1);
  return {
    _raw: rawData.slice(9, 12),
    _hex: data.slice(9, 12),
    horizontal,
    vertical
  };
}
function parseFilter(rawData, data) {
  return {
    _raw: rawData.slice(4),
    _hex: data.slice(4)
  };
}
function parseVibrator(rawData, data) {
  return {
    _raw: rawData.slice(12, 13),
    _hex: data.slice(12, 13)
  };
}
function parseAck(rawData, data) {
  return {
    _raw: rawData.slice(13, 14),
    _hex: data.slice(13, 14)
  };
}
function parseSubcommandID(rawData, data) {
  return {
    _raw: rawData.slice(14, 15),
    _hex: data.slice(14, 15)
  };
}
function parseSubcommandReplyData(rawData, data) {
  return {
    _raw: rawData.slice(15),
    _hex: data.slice(15)
  };
}
function parseAccelerometers(rawData, data) {
  return [
    {
      x: {
        _raw: rawData.slice(13, 15),
        _hex: data.slice(13, 15),
        acc: toAcceleration(rawData.slice(13, 15))
      },
      y: {
        _raw: rawData.slice(15, 17),
        _hex: data.slice(15, 17),
        acc: toAcceleration(rawData.slice(15, 17))
      },
      z: {
        _raw: rawData.slice(17, 19),
        _hex: data.slice(17, 19),
        acc: toAcceleration(rawData.slice(17, 19))
      }
    },
    {
      x: {
        _raw: rawData.slice(25, 27),
        _hex: data.slice(25, 27),
        acc: toAcceleration(rawData.slice(25, 27))
      },
      y: {
        _raw: rawData.slice(27, 29),
        _hex: data.slice(27, 29),
        acc: toAcceleration(rawData.slice(27, 29))
      },
      z: {
        _raw: rawData.slice(29, 31),
        _hex: data.slice(29, 31),
        acc: toAcceleration(rawData.slice(29, 31))
      }
    },
    {
      x: {
        _raw: rawData.slice(37, 39),
        _hex: data.slice(37, 39),
        acc: toAcceleration(rawData.slice(37, 39))
      },
      y: {
        _raw: rawData.slice(39, 41),
        _hex: data.slice(39, 41),
        acc: toAcceleration(rawData.slice(39, 41))
      },
      z: {
        _raw: rawData.slice(41, 43),
        _hex: data.slice(41, 43),
        acc: toAcceleration(rawData.slice(41, 43))
      }
    }
  ];
}
function parseGyroscopes(rawData, data) {
  return [
    [
      {
        _raw: rawData.slice(19, 21),
        _hex: data.slice(19, 21),
        dps: toDegreesPerSecond(rawData.slice(19, 21)),
        rps: toRevolutionsPerSecond(rawData.slice(19, 21))
      },
      {
        _raw: rawData.slice(21, 23),
        _hex: data.slice(21, 23),
        dps: toDegreesPerSecond(rawData.slice(21, 23)),
        rps: toRevolutionsPerSecond(rawData.slice(21, 23))
      },
      {
        _raw: rawData.slice(23, 25),
        _hex: data.slice(23, 25),
        dps: toDegreesPerSecond(rawData.slice(23, 25)),
        rps: toRevolutionsPerSecond(rawData.slice(23, 25))
      }
    ],
    [
      {
        _raw: rawData.slice(31, 33),
        _hex: data.slice(31, 33),
        dps: toDegreesPerSecond(rawData.slice(31, 33)),
        rps: toRevolutionsPerSecond(rawData.slice(31, 33))
      },
      {
        _raw: rawData.slice(33, 35),
        _hex: data.slice(33, 35),
        dps: toDegreesPerSecond(rawData.slice(33, 35)),
        rps: toRevolutionsPerSecond(rawData.slice(33, 35))
      },
      {
        _raw: rawData.slice(35, 37),
        _hex: data.slice(35, 37),
        dps: toDegreesPerSecond(rawData.slice(35, 37)),
        rps: toRevolutionsPerSecond(rawData.slice(35, 37))
      }
    ],
    [
      {
        _raw: rawData.slice(43, 45),
        _hex: data.slice(43, 45),
        dps: toDegreesPerSecond(rawData.slice(43, 45)),
        rps: toRevolutionsPerSecond(rawData.slice(43, 45))
      },
      {
        _raw: rawData.slice(45, 47),
        _hex: data.slice(45, 47),
        dps: toDegreesPerSecond(rawData.slice(45, 47)),
        rps: toRevolutionsPerSecond(rawData.slice(45, 47))
      },
      {
        _raw: rawData.slice(47, 49),
        _hex: data.slice(47, 49),
        dps: toDegreesPerSecond(rawData.slice(47, 49)),
        rps: toRevolutionsPerSecond(rawData.slice(47, 49))
      }
    ]
  ];
}
function calculateActualAccelerometer(accelerometers) {
  const elapsedTime = 5e-3 * accelerometers.length;
  const actualAccelerometer = {
    x: parseFloat((mean(accelerometers.map((g) => g[0])) * elapsedTime).toFixed(6)),
    y: parseFloat((mean(accelerometers.map((g) => g[1])) * elapsedTime).toFixed(6)),
    z: parseFloat((mean(accelerometers.map((g) => g[2])) * elapsedTime).toFixed(6))
  };
  return actualAccelerometer;
}
function calculateActualGyroscope(gyroscopes) {
  const elapsedTime = 5e-3 * gyroscopes.length;
  const actualGyroscopes = [
    mean(gyroscopes.map((g) => g[0])),
    mean(gyroscopes.map((g) => g[1])),
    mean(gyroscopes.map((g) => g[2]))
  ].map((v) => parseFloat((v * elapsedTime).toFixed(6)));
  return {
    x: actualGyroscopes[0],
    y: actualGyroscopes[1],
    z: actualGyroscopes[2]
  };
}

// src/joycon.ts
var concatTypedArrays = (a, b) => {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
};
var JoyCon = class extends EventTarget {
  constructor(device) {
    super();
    __publicField(this, "device");
    __publicField(this, "inputReport", () => void 0);
    this.device = device;
  }
  get opened() {
    return this.device.opened;
  }
  open() {
    return __async(this, null, function* () {
      if (!this.device.opened) {
        yield this.device.open();
        this.inputReport = this._onInputReport.bind(this);
        this.device.addEventListener("inputreport", this.inputReport);
      }
    });
  }
  close() {
    return __async(this, null, function* () {
      if (this.device.opened) {
        yield this.device.close();
        this.device.removeEventListener("inputreport", this.inputReport);
      }
    });
  }
  getRequestDeviceInfo() {
    return __async(this, null, function* () {
      const outputReportID = 1;
      const subcommand = [2];
      const data = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        ...subcommand
      ];
      yield this.device.sendReport(outputReportID, new Uint8Array(data));
      return new Promise((resolve) => {
        const onDeviceInfo = ({ detail: deviceInfo }) => {
          this.removeEventListener("deviceinfo", onDeviceInfo);
          delete deviceInfo._raw;
          delete deviceInfo._hex;
          resolve(deviceInfo);
        };
        this.addEventListener("deviceinfo", onDeviceInfo);
      });
    });
  }
  getBatteryLevel() {
    return __async(this, null, function* () {
      const outputReportID = 1;
      const subCommand = [80];
      const data = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        ...subCommand
      ];
      yield this.device.sendReport(outputReportID, new Uint8Array(data));
      return new Promise((resolve) => {
        const onBatteryLevel = ({ detail: batteryLevel }) => {
          this.removeEventListener("batterylevel", onBatteryLevel);
          delete batteryLevel._raw;
          delete batteryLevel._hex;
          resolve(batteryLevel);
        };
        this.addEventListener("batterylevel", onBatteryLevel);
      });
    });
  }
  enableSimpleHIDMode() {
    return __async(this, null, function* () {
      const outputReportID = 1;
      const subcommand = [3, 63];
      const data = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        ...subcommand
      ];
      yield this.device.sendReport(outputReportID, new Uint8Array(data));
    });
  }
  enableStandardFullMode() {
    return __async(this, null, function* () {
      const outputReportID = 1;
      const subcommand = [3, 48];
      const data = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        ...subcommand
      ];
      yield this.device.sendReport(outputReportID, new Uint8Array(data));
    });
  }
  enableIMUMode() {
    return __async(this, null, function* () {
      const outputReportID = 1;
      const subcommand = [64, 1];
      const data = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        ...subcommand
      ];
      yield this.device.sendReport(outputReportID, new Uint8Array(data));
    });
  }
  disableIMUMode() {
    return __async(this, null, function* () {
      const outputReportID = 1;
      const subcommand = [64, 0];
      const data = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        ...subcommand
      ];
      yield this.device.sendReport(outputReportID, new Uint8Array(data));
    });
  }
  enableVibration() {
    return __async(this, null, function* () {
      const outputReportID = 1;
      const subcommand = [72, 1];
      const data = [
        0,
        0,
        1,
        64,
        64,
        0,
        1,
        64,
        64,
        ...subcommand
      ];
      yield this.device.sendReport(outputReportID, new Uint8Array(data));
    });
  }
  disableVibration() {
    return __async(this, null, function* () {
      const outputReportID = 1;
      const subcommand = [72, 0];
      const data = [
        0,
        0,
        1,
        64,
        64,
        0,
        1,
        64,
        64,
        ...subcommand
      ];
      yield this.device.sendReport(outputReportID, new Uint8Array(data));
    });
  }
  rumble(lowFrequency, highFrequency, amplitude) {
    return __async(this, null, function* () {
      const clamp = (value, min, max) => {
        return Math.min(Math.max(value, min), max);
      };
      const outputReportID = 16;
      const data = new Uint8Array(9);
      data[0] = 0;
      let lf = clamp(lowFrequency, 40.875885, 626.286133);
      let hf = clamp(highFrequency, 81.75177, 1252.572266);
      hf = (Math.round(32 * Math.log2(hf * 0.1)) - 96) * 4;
      lf = Math.round(32 * Math.log2(lf * 0.1)) - 64;
      const amp = clamp(amplitude, 0, 1);
      let hfAmp = 0;
      if (amp == 0) {
        hfAmp = 0;
      } else if (amp < 0.117) {
        hfAmp = (Math.log2(amp * 1e3) * 32 - 96) / (5 - Math.pow(amp, 2)) - 1;
      } else if (amp < 0.23) {
        hfAmp = Math.log2(amp * 1e3) * 32 - 96 - 92;
      } else {
        hfAmp = (Math.log2(amp * 1e3) * 32 - 96) * 2 - 246;
      }
      let lfAmp = Math.round(hfAmp) * 0.5;
      const parity = lfAmp % 2;
      if (parity > 0) {
        --lfAmp;
      }
      lfAmp = lfAmp >> 1;
      lfAmp += 64;
      if (parity > 0) {
        lfAmp |= 32768;
      }
      data[1] = hf & 255;
      data[2] = hfAmp + (hf >>> 8 & 255);
      data[3] = lf + (lfAmp >>> 8 & 255);
      data[4] += lfAmp & 255;
      for (let i = 0; i < 4; ++i) {
        data[5 + i] = data[1 + i];
      }
      yield this.device.sendReport(outputReportID, new Uint8Array(data));
    });
  }
  _onInputReport(event) {
    var _a, _b;
    const { data, reportId, device } = event;
    if (!data) {
      return;
    }
    const d = concatTypedArrays(new Uint8Array([reportId]), new Uint8Array(data.buffer));
    const hexData = d.map((byte) => byte.toString(16));
    let packet = { inputReportID: parseInputReportID(d, hexData) };
    switch (reportId) {
      case 63: {
        packet = __spreadProps(__spreadValues({}, packet), {
          buttonStatus: parseButtonStatus(d, hexData),
          analogStick: parseAnalogStick(d, hexData),
          filter: parseFilter(d, hexData)
        });
        break;
      }
      case 33:
      case 48: {
        packet = __spreadProps(__spreadValues({}, packet), {
          timer: parseTimer(d, hexData),
          batteryLevel: parseBatteryLevel(d, hexData),
          connectionInfo: parseConnectionInfo(d, hexData),
          buttonStatus: parseCompleteButtonStatus(d, hexData),
          analogStickLeft: parseAnalogStickLeft(d, hexData),
          analogStickRight: parseAnalogStickRight(d, hexData),
          vibrator: parseVibrator(d, hexData)
        });
        if (reportId === 33) {
          packet = __spreadProps(__spreadValues({}, packet), {
            ack: parseAck(d, hexData),
            subcommandID: parseSubcommandID(d, hexData),
            subcommandReplyData: parseSubcommandReplyData(d, hexData),
            deviceInfo: parseDeviceInfo(d)
          });
        }
        if (reportId === 48) {
          const accelerometers = parseAccelerometers(d, hexData);
          const gyroscopes = parseGyroscopes(d, hexData);
          const rps = calculateActualGyroscope(gyroscopes.map((g) => g.map((v) => v.rps)));
          const dps = calculateActualGyroscope(gyroscopes.map((g) => g.map((v) => v.dps)));
          const acc = calculateActualAccelerometer(accelerometers.map((a) => [a.x.acc, a.y.acc, a.z.acc]));
          const quaternion = toQuaternion(rps, acc, (device == null ? void 0 : device.productId) || 0);
          packet = __spreadProps(__spreadValues({}, packet), {
            accelerometers,
            gyroscopes,
            actualAccelerometer: acc,
            actualGyroscope: {
              dps,
              rps
            },
            actualOrientation: toEulerAngles(rps, acc, device.productId || 0),
            actualOrientationQuaternion: toEulerAnglesQuaternion(quaternion),
            quaternion
          });
        }
        break;
      }
    }
    if ((_a = packet.deviceInfo) == null ? void 0 : _a.type) {
      this._receiveDeviceInfo(packet.deviceInfo);
    }
    if ((_b = packet.batteryLevel) == null ? void 0 : _b.level) {
      this._receiveBatteryLevel(packet.batteryLevel);
    }
    this._receiveInputEvent(packet);
  }
  _receiveDeviceInfo(deviceInfo) {
    this.dispatchEvent(new CustomEvent("deviceinfo", { detail: deviceInfo }));
  }
  _receiveBatteryLevel(batteryLevel) {
    this.dispatchEvent(new CustomEvent("batterylevel", {
      detail: batteryLevel
    }));
  }
  _receiveInputEvent(_packet) {
  }
};
var JoyConLeft = class extends JoyCon {
  constructor(device) {
    super(device);
  }
  _receiveInputEvent(packet) {
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
    this.dispatchEvent(new CustomEvent("hidinput", { detail: packet }));
  }
};
var JoyConRight = class extends JoyCon {
  constructor(device) {
    super(device);
  }
  _receiveInputEvent(packet) {
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
    this.dispatchEvent(new CustomEvent("hidinput", { detail: packet }));
  }
};

// src/index.ts
var connectedJoyCons = new Map();
navigator.hid.addEventListener("connect", (_0) => __async(void 0, [_0], function* ({ device }) {
  console.log(`HID connected: ${device.productName}`);
  const joycon = yield connectDevice(device);
  connectedJoyCons.set(device.productId, joycon);
  dispatchEvent(new CustomEvent("joyConConnect", { detail: joycon }));
}));
navigator.hid.addEventListener("disconnect", ({ device }) => {
  console.log(`HID disconnected: ${device.productName}`);
  connectedJoyCons.delete(device.productId);
  dispatchEvent(new CustomEvent("joyConDisconnect", { detail: device.productId }));
});
document.addEventListener("DOMContentLoaded", () => __async(void 0, null, function* () {
  const devices = yield navigator.hid.getDevices();
  devices.forEach((device) => __async(void 0, null, function* () {
    connectedJoyCons.set(device.productId, yield connectDevice(device));
  }));
}));
var connectJoyCon = () => __async(void 0, null, function* () {
  const filters = [
    {
      vendorId: 1406,
      productId: 8198
    },
    {
      vendorId: 1406,
      productId: 8199
    }
  ];
  try {
    const [device] = yield navigator.hid.requestDevice({ filters });
    if (!device) {
      return;
    }
    connectedJoyCons.set(device.productId, yield connectDevice(device));
  } catch (error) {
    console.error(error.name, error.message);
  }
});
var connectDevice = (device) => __async(void 0, null, function* () {
  let joyCon;
  if (device.productId === 8198) {
    joyCon = new JoyConLeft(device);
  } else if (device.productId === 8199) {
    joyCon = new JoyConRight(device);
  } else {
    throw new Error("wrogn device!");
  }
  yield joyCon.open();
  yield joyCon.enableStandardFullMode();
  yield joyCon.enableIMUMode();
  return joyCon;
});
export {
  JoyConLeft,
  JoyConRight,
  connectJoyCon,
  connectedJoyCons
};
