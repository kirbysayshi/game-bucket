import AtlasJson from '../assets/pipeline-output-aseprite/atlas';
import AtlasImg from '../assets/pipeline-output-aseprite/atlas.png';
import { loadImage } from './load-image';
import { assertDefinedFatal } from './utils';

export class Assets {
  atlas: HTMLImageElement | null = null;

  async preload() {
    this.atlas = await loadImage(AtlasImg);
  }

  getAtlas(): HTMLImageElement {
    assertDefinedFatal(this.atlas);
    return this.atlas;
  }
}

type FrameTag<Name extends string> = {
  name: Name;
  from: number;
  to: number;
  direction: 'forward' | 'reverse' | 'pingpong';
};

type Frame = {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
  duration: number;
};

type AsepriteJSON<filename extends string, TagNames extends string> = {
  frames: { [K in `${TagNames}_${number}`]: Frame };
  meta: {
    app: string;
    version: string;
    image: filename;
    format: 'RGBA8888';
    size: { w: number; h: number };
    scale: string;
    frameTags: FrameTag<TagNames>[][];
  };
};

type Animation = {
  frames: Frame[];
  direction: 'forward' | 'reverse' | 'pingpong';
};

function collectAsepriteAtlasJSON<
  J extends typeof AtlasJson,
  Names extends J['frames'][number]['filename']
>(
  json: J
): {
  [K in Names]: Animation;
} {
  type N = J['frames'][number]['filename'];
  type Tags = N extends `${string}#${infer T}` ? T : never;

  const out = new Map<N, Animation>();

  const tagEncounteredIndex = new Map<Tags, number>();
  let filename = null;

  // loop through each frame to build up the animation data.
  for (const frame of json.frames) {
    const tag = frame.filename.split('#')[1] as Tags;

    // There is currently a bug / unexpected behavior in Aseprite where the
    // filename is not included in the frameTags, so there's no way to match the
    // frameTags animation data directly with the actual frames.
    // https://github.com/aseprite/aseprite/issues/1514

    // Whenever the filename changes, mark the embedded tag name as encountered.
    // The same tag name can be encountered multiple times across different
    // files, but the ordering is consistent. So if the filename is
    // `filename-001#tag-01`, later there is `filename-002#tag-01`, there will
    // be matching and ordered `[{name: "tag-01", ...}, {name: "tag-01", ...}]`
    // entries in `meta.frameTags`.
    if (filename !== frame.filename) {
      filename = frame.filename;

      if (tagEncounteredIndex.has(tag)) {
        tagEncounteredIndex.set(tag, (tagEncounteredIndex.get(tag) ?? 0) + 1);
      } else {
        tagEncounteredIndex.set(tag, 0);
      }
    }

    // Find the matching frameTag data. If the frameTag `name` was used before,
    // then use the next matching frameTag data in the frameTag array.
    let frameTagEncounteredCount = 0;
    const expectedEncounteredCount = tagEncounteredIndex.get(tag) ?? 0;
    const frameTagData = json.meta.frameTags.find((t) => {
      if (t.name === tag) {
        if (expectedEncounteredCount === frameTagEncounteredCount) return true;
        else {
          frameTagEncounteredCount++;
          return false;
        }
      }
    });

    // We know it has to be here, otherwise the data is somehow corrupted.
    assertDefinedFatal(frameTagData);

    const anim = out.get(frame.filename) ?? {
      frames: [],
      ...frameTagData,
    };

    anim.frames.push(frame);

    out.set(frame.filename, anim);
  }

  // Hack the types so that the names are known at compile time.
  return Object.fromEntries(out.entries()) as {
    [K in Names]: Animation;
  };
}

export const animations = collectAsepriteAtlasJSON(AtlasJson);

export class AsepriteAtlasAnimatedSprite {
  private frame = 0;
  private accum = 0;
  constructor(
    public readonly tag: keyof typeof animations,
    private anim = animations[tag]
  ) {}

  tick(dtMs: number): void {
    this.accum += dtMs;
    const f = this.anim.frames[this.frame];
    if (this.accum > f.duration) {
      this.accum -= f.duration;
      this.frame += 1;
      if (this.frame >= this.anim.frames.length) {
        this.frame = 0;
      }
    }
  }

  getFrame(): Frame | null {
    const f = this.anim.frames[this.frame];
    return f;
  }
}
