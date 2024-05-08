import { AsepriteAtlasAnimatedSprite } from '../asset-map';
import { ViewportUnitVector2 } from './ViewportCmp';

export type AssetCmp = {
  k: 'asset';
  asset: AsepriteAtlasAnimatedSprite['tag'];
  wh?: ViewportUnitVector2;
};

export function makeAssetCmp(
  asset: AssetCmp['asset'],
  wh?: ViewportUnitVector2
): AssetCmp {
  return {
    k: 'asset',
    asset: asset,
    wh,
  };
}
