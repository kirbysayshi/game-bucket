import { loadImage } from "./load-image";

import TestImage from "../assets/00 - Fool.png";

// type UnloadedAsset = {
//   path: string;
//   name: string;
// }

const unloaded = [
  { path: TestImage, name: "test" },
  
] as const;

type AssetNames = typeof unloaded[number]["name"];

type LoadedAsset = {
  path: string;
  name: string;
  img: HTMLImageElement;
};
// type LoadedAssetMap = { [key in AssetNames]: LoadedAsset };
const loadedAssets: { [key: string]: LoadedAsset } = {};
let loaded = false;

export async function loadAssets() {
  await Promise.all(
    unloaded.map(async u => {
      const img = await loadImage(u.path);
      loadedAssets[u.name] = { path: u.path, name: u.name, img };
    })
  );
  loaded = true;
}

export function useAsset(name: AssetNames) {
  if (process.env.NODE_ENV !== "production") {
    if (!loaded) throw new Error("Assets were accessed but not loaded!");
  }
  return loadedAssets[name].img;
}
