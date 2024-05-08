export type ImpedanceCmp = { k: 'impedance-value'; value: number };

export function makeImpedanceCmp(value: number): ImpedanceCmp {
  return {
    k: 'impedance-value',
    value,
  };
}
