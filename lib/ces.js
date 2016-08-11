let knownTags = {};
let LAST_E_ID = 0;

export const Entity = (props) => {
  const e = {
    id: LAST_E_ID++,
    ...props,
  }

  props.tags && props.tags.forEach(p => {
    knownTags[p] = knownTags[p] || [];
    knownTags[p].push(e);
  });

  return e;
}

export const System = (action, ...tags) => (...args) => {
  const entities = tags.reduce((founds, t) => {
    const tagged = knownTags[t];
    tagged.forEach(e => {
      if (founds[e.id]) return;
      // Only give the entity to this system if the entity has every tag the
      // system requires.
      if (tags.every(stag => (e.tags.indexOf(stag) > -1))) {
        founds[e.id] = e;
      }
    })
    return founds
  }, {})

  // pass the ...args from the invocation of the system to the action.
  // TODO: this generates a lot of garbage due to the ...spread. It gets
  // transpiled to:
  // action.apply(undefined, [Object.keys(entities).map(function (id) {
  //   return entities[id];
  // })].concat(args));
  // Which means at least two arrays from the apply + concat, plus another
  // within .map. Optimize this!
  action(Object.keys(entities).map(id => entities[id]), ...args);
}

export const systemPropReqs = (entity, ...props) => {
  if (process.env.NODE_ENV !== 'production') {
    props.forEach(k => {
      if (![entity[k]]) {
        throw new Error(`required system prop ${k} not found in entity ${JSON.stringify(entity)}`);
      }
    });
  }
}

export const destroyEntity = (e) => {
  // TODO: this may need to be a "scheduleDestroyEntity"
  e.tags.forEach(t => {
    const tagged = knownTags[t];
    const idx = tagged.indexOf(e);
    if (idx === -1) return;
    tagged.splice(idx, 1);
  });
  e.tags.length = 0;
  e.destroyed = true;
}

export const reset = () => {
  Object.keys(knownTags).forEach(t => {
    const entities = knownTags[t];
    entities.forEach(destroyEntity);
    knownTags.length = 0;
    delete knownTags[t];
  });

  LAST_E_ID = 0;
}
