import { AsepriteAtlasAnimatedSprite } from '../asset-map';
import { ViewportUnitVector2 } from './ViewportCmp';

export type AnimatedAssetCmp = {
  k: 'animated-asset';
  animSprite: AsepriteAtlasAnimatedSprite;
  wh?: ViewportUnitVector2;
};

export function makeAnimatedAssetCmp(
  asset: AsepriteAtlasAnimatedSprite['tag'],
  wh?: ViewportUnitVector2
): AnimatedAssetCmp {
  return {
    k: 'animated-asset',
    animSprite: new AsepriteAtlasAnimatedSprite(asset),
    wh,
  };
}
