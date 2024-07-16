declare module '*.png';
declare module '*.svg';

declare module 'science-halt' {
  function scienceHalt(
    onhalt: () => void,
    opt_msg?: string,
    opt_keycode?: number,
  ): void;
  export = scienceHalt;
}

declare module 'zzfx' {
  export function zzfx(...parameters: (number | undefined)[]): void;
  export const ZZFX: {
    /**
     * master volume scale (0.0 to 1.0)
     */
    volume: number;

    sampleRate: number;
    x: AudioContext;

    play(...parameters: (number | undefined)[]): AudioBufferSourceNode;
    buildSamples(...parameters: (number | undefined)[]): number[];

    /**
     * get frequency of a musical note on a diatonic scale
     */
    getNote(semitoneOffset?: number, rootNoteFrequency?: number): number;
  };
}

type Ms = number;

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// Surely there must be a better way...
type WriteableProperty<T, P extends keyof T> = Pick<T, Exclude<keyof T, P>> &
  Mutable<Pick<T, P>>;
