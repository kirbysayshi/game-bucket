const params = new URLSearchParams(window.location.search);

export function useDebugMode() {
  return params.has("debug");
}

export function useDisabledAudioMode() {
  return params.has("no-audio");
}

export function useSeedValue() {
  return params.get("seed");
}
