import { PunchBench } from 'punch-bench';
import { CES3 } from '../ces3';
import { CES4 } from '../ces4';
import { C1, C2, C3 } from './types';

const b = new PunchBench();

const CREATE_NUM = 10000;

b.punch(function ces3Create10000(done) {
  const ces = new CES3<C1 | C2 | C3>();
  for (let i = 0; i < CREATE_NUM; i++) {
    ces.entity([{ k: 'c1', p1: 0 }]);
  }

  done();
});

b.punch(function ces4Create10000(done) {
  const ces = new CES4<C1 | C2 | C3>();
  for (let i = 0; i < CREATE_NUM; i++) {
    ces.entity([{ k: 'c1', p1: 0 }]);
  }

  done();
});

b.go();
