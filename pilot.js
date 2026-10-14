import { Vector3, Euler, Quaternion, Matrix4, MathUtils } from './vendor/three.module.js';

// Flight motion is independent of the DOM so input release and timing can be checked directly.
export class Pilot {
  constructor(body) {
    this.body = body;
    this.keys = new Set();
    this.velocity = new Vector3();
    this.destination = null;
    this.turn = null;
    this.diving = false;
    this.active = false;
    this.forward = new Vector3();
    this.right = new Vector3();
    this.wish = new Vector3();
    this.step = new Vector3();
    this.angles = new Euler(0, 0, 0, 'YXZ');
  }

  start() { this.stop(); this.active = true; }

  stop() {
    this.active = false;
    this.keys.clear();
    this.velocity.set(0, 0, 0);
    this.destination = this.turn = null;
    this.diving = false;
  }

  press(code) {
    if (!this.active) return;
    this.keys.add(code);
    this.destination = this.turn = null;
    this.diving = false;
  }

  release(code) { this.keys.delete(code); }

  look(dx, dy) {
    this.turn = null;
    this.angles.setFromQuaternion(this.body.quaternion, 'YXZ');
    this.angles.y -= dx * 0.0022;
    this.angles.x = MathUtils.clamp(this.angles.x - dy * 0.0022, -Math.PI / 2 + 0.03, Math.PI / 2 - 0.03);
    this.angles.z = 0;
    this.body.quaternion.setFromEuler(this.angles);
  }

  travel(direction, dive = false) {
    if (!this.active) return;
    this.keys.clear();
    const heading = direction.clone().normalize();
    this.destination = this.body.position.clone().addScaledVector(heading, dive ? 125 : 95);
    this.turn = new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(this.body.position, this.destination, this.body.up));
    this.diving = dive;
  }

  update(dt, scale = 1) {
    if (!this.active || dt <= 0) return;
    this.forward.set(0, 0, -1).applyQuaternion(this.body.quaternion);
    this.right.set(1, 0, 0).applyQuaternion(this.body.quaternion);
    this.wish.set(0, 0, 0);
    if (this.turn) this.body.quaternion.slerp(this.turn, 1 - Math.exp(-7 * dt));
    if (this.destination) {
      this.wish.subVectors(this.destination, this.body.position);
      const distance = this.wish.length();
      if (distance < 0.6) {
        this.body.position.copy(this.destination);
        this.destination = this.turn = null;
        this.diving = false;
        this.velocity.set(0, 0, 0);
        return;
      }
      this.wish.multiplyScalar(Math.min(this.diving ? 240 : 90, distance * (this.diving ? 5 : 3)) * scale / distance);
    } else {
      const key = code => Number(this.keys.has(code));
      const thrust = key('KeyW') - key('KeyS');
      this.wish.addScaledVector(this.forward, thrust);
      this.wish.addScaledVector(this.right, key('KeyD') - key('KeyA'));
      this.wish.y += key('KeyR') - key('KeyF');
      if (this.keys.has('Space') && this.wish.lengthSq() === 0) this.wish.copy(this.forward);
      this.wish.normalize().multiplyScalar((this.keys.has('Space') ? 245 : 48) * scale);
    }
    // Exact exponential integration prevents the acceleration from depending on frame rate.
    const response = this.destination || this.wish.lengthSq() ? 5 : 8;
    const decay = Math.exp(-response * dt);
    this.step.copy(this.velocity).sub(this.wish).multiplyScalar((1 - decay) / response).addScaledVector(this.wish, dt);
    if (this.destination && this.step.dot(this.forward.copy(this.destination).sub(this.body.position)) >= this.forward.lengthSq()) {
      this.body.position.copy(this.destination);
      this.destination = this.turn = null;
      this.diving = false;
      this.velocity.set(0, 0, 0);
    } else {
      this.body.position.add(this.step);
      this.velocity.sub(this.wish).multiplyScalar(decay).add(this.wish);
      if (this.velocity.lengthSq() < 0.0001) this.velocity.set(0, 0, 0);
    }
  }
}

export class ChaseCamera {
  constructor(camera, subject) {
    this.camera = camera;
    this.subject = subject;
    this.position = new Vector3();
    this.target = new Vector3();
    this.rotation = new Quaternion();
    this.matrix = new Matrix4();
  }

  update(dt, speed = 0) {
    const pullback = MathUtils.clamp(speed / 245, 0, 1) * 5;
    this.position.set(7, 7, 26 + pullback).applyQuaternion(this.subject.quaternion).add(this.subject.position);
    this.target.set(0, 1.7, -24).applyQuaternion(this.subject.quaternion).add(this.subject.position);
    this.camera.position.lerp(this.position, 1 - Math.exp(-7 * dt));
    this.rotation.setFromRotationMatrix(this.matrix.lookAt(this.camera.position, this.target, this.camera.up));
    this.camera.quaternion.slerp(this.rotation, 1 - Math.exp(-9 * dt));
  }
}
