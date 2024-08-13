type Pixels = number & { _isPixels: true };
export function asPixels(n: number) {
  return n as Pixels;
}

type WorldUnits = number & { _isWorldUnits: true };
export function asWorldUnits(n: number) {
  return n as WorldUnits;
}

export class Camera2D {
  private x = asWorldUnits(0);
  private y = asWorldUnits(0);
  private rotation = asWorldUnits(0);

  constructor(
    private width: WorldUnits, // frustum width in world units
    private height: WorldUnits, // frustum height in world units
  ) {}

  worldToScreen(
    worldX: WorldUnits,
    worldY: WorldUnits,
    viewportWidth: Pixels,
    viewportHeight: Pixels,
    out = { x: 0, y: 0 },
  ) {
    // Step 1: Translate
    let x = worldX - this.x;
    let y = worldY - this.y;

    // Step 2: Rotate
    let cos = Math.cos(this.rotation);
    let sin = Math.sin(this.rotation);
    let rotatedX = x * cos + y * sin;
    let rotatedY = -x * sin + y * cos;

    // Step 3: Apply frustum transformation
    let screenX = (rotatedX / this.width + 0.5) * viewportWidth;
    let screenY = (rotatedY / this.height + 0.5) * viewportHeight;

    out.x = screenX;
    out.y = screenY;

    return out;
  }

  screenToWorld(
    screenX: Pixels,
    screenY: Pixels,
    viewportWidth: Pixels,
    viewportHeight: Pixels,
    out = { x: 0, y: 0 },
  ) {
    // Step 1: Undo frustum transformation
    let x = (screenX / viewportWidth - 0.5) * this.width;
    let y = (screenY / viewportHeight - 0.5) * this.height;

    // Step 2: Undo rotation
    let cos = Math.cos(-this.rotation);
    let sin = Math.sin(-this.rotation);
    let rotatedX = x * cos + y * sin;
    let rotatedY = -x * sin + y * cos;

    // Step 3: Undo translation
    let worldX = rotatedX + this.x;
    let worldY = rotatedY + this.y;

    out.x = worldX;
    out.y = worldY;

    return out;
  }

  move(dx: WorldUnits, dy: WorldUnits) {
    this.x = asWorldUnits(this.x + dx);
    this.y = asWorldUnits(this.y + dy);
  }

  rotate(angle: WorldUnits) {
    this.rotation = asWorldUnits(this.rotation + angle);
  }

  getRotation() {
    return this.rotation;
  }

  zoom(factor: WorldUnits) {
    this.width = asWorldUnits(this.width / factor);
    this.height = asWorldUnits(this.height / factor);
  }

  isPointVisible(worldX: WorldUnits, worldY: WorldUnits) {
    // A 1x1 viewport means it becomes a 0-1 range.
    let screenPoint = this.worldToScreen(
      worldX,
      worldY,
      asPixels(1),
      asPixels(1),
    );

    // Check if the point is within the viewport
    return (
      screenPoint.x >= 0 &&
      screenPoint.x <= 1 &&
      screenPoint.y >= 0 &&
      screenPoint.y <= 1
    );
  }

  applyToContext(
    ctx: CanvasRenderingContext2D,
    viewportWidth: Pixels,
    viewportHeight: Pixels,
  ) {
    // Move to the center of the viewport
    ctx.translate(viewportWidth / 2, viewportHeight / 2);

    // Rotate (note the negative angle to rotate the world opposite to the camera)
    ctx.rotate(-this.rotation);

    // Scale according to the camera's frustum
    let scaleX = viewportWidth / this.width;
    let scaleY = viewportHeight / this.height;
    ctx.scale(scaleX, scaleY);

    // Move back by the camera's position
    ctx.translate(-this.x, -this.y);
  }
}

export function drawWorldText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: WorldUnits,
  y: WorldUnits,
  cameraRotation: WorldUnits,
) {
  ctx.save();

  // Move to the text position
  ctx.translate(x, y);

  // Counter-rotate the text
  ctx.rotate(cameraRotation);

  // Set text properties
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  // ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw the text
  ctx.fillText(text, 0, 0);

  ctx.restore();
}
