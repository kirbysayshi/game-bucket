import { copy } from 'pocket-physics';
import { AssetCmp, makeAssetCmp } from '../components/AssetCmp';
import { makeMovementCmp } from '../components/MovementCmp';
import { ViewportUnitVector2, vv2 } from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';

export function makeSingleFrameSprite(
  ces: CES3C,
  pos: ViewportUnitVector2,
  wh: ViewportUnitVector2,
  asset: AssetCmp['asset']
) {
  ces.entity([
    makeMovementCmp(pos),
    makeAssetCmp(asset, copy(vv2(), wh)),
    { k: 'single-frame-sprite' },
    { k: 'bounding-box', wh: copy(vv2(), wh) },
  ]);
}
