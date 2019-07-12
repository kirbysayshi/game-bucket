let LAST_ID = 0;
let tasks: QueuedAction[] = [];

type QueuedAction = {
  id: number;
  action: (delay: Ms, age: Ms) => void;
  delay: Ms;
  age: Ms;
}

export const schedule = (action: QueuedAction['action'], delay: Ms) => {
  tasks.push({
    id: ++LAST_ID,
    action,
    delay,
    age: 0,
  });
}

export const unschedule = (id: number) => {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  tasks.splice(idx, 1);
}

export const tick = (dt: Ms = 1) => {
  // copy the array in case some tasks need to be expunged.
  tasks.slice().forEach((t, idx) => {
    t.age += dt;

    if (t.age >= t.delay) {
      tasks.splice(idx, 1);
      t.action(t.delay, t.age);
    }
  });
}

export const reset = () => {
  LAST_ID = 0;
  tasks.length = 0;
}
