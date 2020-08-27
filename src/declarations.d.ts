declare module "*.png";
declare module "*.svg";

declare module "science-halt" {
  function scienceHalt(
    onhalt: () => void,
    opt_msg?: string,
    opt_keycode?: number
  ): void;
  export = scienceHalt;
}

type Ms = number;

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// Surely there must be a better way...
type WriteableProperty<T, P extends keyof T> = Pick<T, Exclude<keyof T, P>> &
  Mutable<Pick<T, P>>;
