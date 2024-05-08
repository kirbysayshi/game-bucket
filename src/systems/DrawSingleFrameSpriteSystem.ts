import { animations, Assets } from '../asset-map';
import { asPixels, drawSheetAssetVp } from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { assertDefinedFatal } from '../utils';

export const DrawSingleFrameSpriteSystem =
  (assets: Assets) => (ces: CES3C, interp: number) => {
    const vp = ces.selectFirstData('viewport');
    assertDefinedFatal(vp);

    const entities = ces.select([
      'v-movement',
      'asset',
      'bounding-box',
      'single-frame-sprite',
    ]);

    for (const eid of entities) {
      const mv = ces.data(eid, 'v-movement');
      const asset = ces.data(eid, 'asset');
      const bb = ces.data(eid, 'bounding-box');
      assertDefinedFatal(mv);
      assertDefinedFatal(asset);
      assertDefinedFatal(bb);

      const anim = animations[asset.asset];
      const frame = anim.frames[0];

      const sizeX = asset.wh ? asset.wh.x : bb.wh.x;
      const sizeY = asset.wh ? asset.wh.y : bb.wh.y;

      drawSheetAssetVp(
        vp,
        assets.getAtlas(),
        interp,
        mv.cpos,
        mv.ppos,
        frame.frame.x,
        frame.frame.y,
        frame.frame.w,
        frame.frame.h,

        asPixels(frame.spriteSourceSize.x),
        asPixels(frame.spriteSourceSize.y),
        asPixels(frame.sourceSize.w),
        asPixels(frame.sourceSize.h),
        true,

        sizeX,
        sizeY
      );
    }
  };
