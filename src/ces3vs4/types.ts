import { AssuredBorrowedEntityId, AssuredEntityId } from '../ces4';

export type C1 = {
  k: 'c1';
  p1: number;
};

export type C2 = {
  k: 'c2';
  p2: string;
};

export type C3 = {
  k: 'c3';
  a: AssuredEntityId<C1>;
  b: AssuredBorrowedEntityId<C2>;
};
