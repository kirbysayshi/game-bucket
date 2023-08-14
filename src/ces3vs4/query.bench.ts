import { PunchBench } from 'punch-bench';
import { CES3 } from '../ces3';
import { CES4 } from '../ces4';
import { C1, C2, C3 } from './types';

const CREATE_NUM = 10000;

const b = new PunchBench();

const ces3 = new CES3<C1 | C2 | C3>();
for (let i = 0; i < CREATE_NUM; i++) {
  ces3.entity([{ k: 'c1', p1: 0 }]);
}

b.punch(function ces3Create1000WithQuery(done) {
  const s1 = ces3.select(['c1', 'c2']);
  const s2 = ces3.select(['c1', 'c3']);
  const s3 = ces3.select(['c2', 'c3']);

  done();
});

const ces4 = new CES4<C1 | C2 | C3>();
const q1 = ces4.createQuery(['c1', 'c2']);
const q2 = ces4.createQuery(['c1', 'c3']);
const q3 = ces4.createQuery(['c2', 'c3']);
for (let i = 0; i < CREATE_NUM; i++) {
  ces4.entity([{ k: 'c1', p1: 0 }]);
}

b.punch(function ces4Create1000WithQuery(done) {
  const s1 = ces4.select(q1);
  const s2 = ces4.select(q2);
  const s3 = ces4.select(q3);

  done();
});

b.go();
