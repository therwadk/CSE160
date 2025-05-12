class Camera {
    constructor(eye, at, up) {
      this.eye = new Vector3(eye);
      this.at = new Vector3(at);
      this.up = new Vector3(up);
      this.stepSize = 0.05;
      this.rotationAngle = 5 * Math.PI / 180;
    }
  
    _viewDir() {
      return new Vector3().set(this.at).sub(this.eye);
    }
  
    forward() {
      const stepVec = new Vector3().set(this._viewDir()).normalize().mul(this.stepSize);
      this.eye = this.eye.add(stepVec);
      this.at = this.at.add(stepVec);
    }
  
    backward() {
      const stepVec = new Vector3().set(this._viewDir()).normalize().mul(this.stepSize);
      this.eye = this.eye.sub(stepVec);
      this.at = this.at.sub(stepVec);
    }
  
    left() {
      const strafeVec = Vector3.cross(this._viewDir(), this.up).normalize().mul(this.stepSize);
      this.eye = this.eye.sub(strafeVec);
      this.at = this.at.sub(strafeVec);
    }
  
    right() {
      const strafeVec = Vector3.cross(this._viewDir(), this.up).normalize().mul(this.stepSize);
      this.eye = this.eye.add(strafeVec);
      this.at = this.at.add(strafeVec);
    }
  
    panLeft() {
      this._rotateAroundUp(-this.rotationAngle);
    }
  
    panRight() {
      this._rotateAroundUp(this.rotationAngle);
    }
  
    _rotateAroundUp(angle) {
      const dir = new Vector3().set(this.at).sub(this.eye);
      const x = dir.elements[0];
      const z = dir.elements[2];
      const y = dir.elements[1];
  
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const newX = x * cosA - z * sinA;
      const newZ = x * sinA + z * cosA;
  
      const rotatedDir = new Vector3([newX, y, newZ]);
      this.at = new Vector3().set(this.eye).add(rotatedDir);
    }
  }
  