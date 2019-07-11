export default function Ces () {
  const ces = {
    knownTags: {},
    LAST_E_ID: 0,

    newEntity: (props) => Entity(ces, props),
    destroyEntity: (entity) => destroyEntity(ces, entity),
    reset: () => reset(ces),

    newSystem: (action, ...tags) => System(ces, action, ...tags),
  }

  return ces;
}

const Entity = (ces, props) => {
  const e = props;
  props.id = ces.LAST_E_ID++;

  props.tags && props.tags.forEach(p => {
    ces.knownTags[p] = ces.knownTags[p] || [];
    ces.knownTags[p].push(e);
  });

  return e;
}

const System = (ces, action, ...tags) => (...args) => {
  const entities = tags.reduce((founds, t) => {
    const tagged = ces.knownTags[t];
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

const destroyEntity = (ces, e) => {
  // TODO: this may need to be a "scheduleDestroyEntity"
  e.tags.forEach(t => {
    const tagged = ces.knownTags[t];
    const idx = tagged.indexOf(e);
    if (idx === -1) return;
    tagged.splice(idx, 1);
  });
  e.tags.length = 0;
  e.destroyed = true;
}

const reset = (ces) => {
  Object.keys(ces.knownTags).forEach(t => {
    const entities = ces.knownTags[t];
    entities.forEach(destroyEntity);
    ces.knownTags.length = 0;
    delete ces.knownTags[t];
  });

  ces.LAST_E_ID = 0;
}
