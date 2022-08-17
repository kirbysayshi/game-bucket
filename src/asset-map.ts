import TestImage from '../assets/00 - Fool.png';
import { loadImage } from './load-image';

// type UnloadedAsset = {
//   path: string;
//   name: string;
// }

const AssetRegistry = [{ path: TestImage, name: 'test' }] as const;

type AssetNames = typeof AssetRegistry[number]['name'];

export type LoadedAsset = {
  path: string;
  name: string;
  img: HTMLImageElement;
};

// type LoadedAssetMap = { [key in AssetNames]: LoadedAsset };
// const loadedAssets: { [key: string]: LoadedAsset } = {};
// let loaded = false;

// export async function loadAssets() {
//   await Promise.all(
//     unloaded.map(async u => {
//       const img = await loadImage(u.path);
//       loadedAssets[u.name] = { path: u.path, name: u.name, img };
//     })
//   );
//   loaded = true;
// }

export class AssetMap {
  loadedAssets: { [key: string]: LoadedAsset } = {};

  async preload(opt_onlyLoad: Set<AssetNames> = new Set()): Promise<void> {
    await Promise.all(
      AssetRegistry.map(async (u) => {
        if (
          this.loadedAssets[u.name] ||
          (opt_onlyLoad.size > 0 && !opt_onlyLoad.has(u.name))
        )
          return;

        const img = await loadImage(u.path);
        this.loadedAssets[u.name] = { path: u.path, name: u.name, img };
      })
    );
  }

  getImage(name: AssetNames): HTMLImageElement {
    const asset = this.loadedAssets[name];
    if (!asset) throw new Error(`LD_${name}`);
    return asset.img;
  }
}

// export function useAsset(name: AssetNames) {
//   if (process.env.NODE_ENV !== "production") {
//     if (!loaded) throw new Error("Assets were accessed but not loaded!");
//   }
//   return loadedAssets[name].img;
// }
