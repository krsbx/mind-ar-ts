import { Vector2, Vector3 } from 'three';
import { match } from './matching';

class Matcher {
  private queryWidth: number;
  private queryHeight: number;
  private debugMode: boolean;

  constructor(queryWidth: number, queryHeight: number, debugMode = false) {
    this.queryWidth = queryWidth;
    this.queryHeight = queryHeight;
    this.debugMode = debugMode;
  }

  matchDetection(keyframes: any[], featurePoints: any[]) {
    const debugExtra: Record<any, any> = { frames: [] };

    let bestResult = null;

    for (let i = 0; i < keyframes.length; i++) {
      const {
        H,
        matches,
        debugExtra: frameDebugExtra,
      } = match({
        keyframe: keyframes[i],
        querypoints: featurePoints,
        querywidth: this.queryWidth,
        queryheight: this.queryHeight,
        debugMode: this.debugMode,
      });

      debugExtra.frames.push(frameDebugExtra);

      if (H && (!bestResult || bestResult.matches.length < matches.length)) {
        bestResult = { keyframeIndex: i, H, matches };
      }
    }

    if (!bestResult) return { keyframeIndex: -1, debugExtra };

    const screenCoords: Vector2[] = [];
    const worldCoords: Vector3[] = [];
    const keyframe = keyframes[bestResult.keyframeIndex];

    for (let i = 0; i < bestResult.matches.length; i++) {
      const querypoint = bestResult.matches[i].querypoint;
      const keypoint = bestResult.matches[i].keypoint;

      screenCoords.push({
        x: querypoint.x,
        y: querypoint.y,
      } as Vector2);

      worldCoords.push({
        x: (keypoint.x + 0.5) / keyframe.scale,
        y: (keypoint.y + 0.5) / keyframe.scale,
        z: 0,
      } as Vector3);
    }

    return { screenCoords, worldCoords, keyframeIndex: bestResult.keyframeIndex, debugExtra };
  }
}

export { Matcher };
