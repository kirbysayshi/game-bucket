import { AssuredEntityId } from '../ces3';
import { CooldownCmp } from './CooldownCmp';

export type PlayerAbilitiesCmp = {
  k: 'player-abilities';

  // TODO: add more abilities and name them appropriately. Possibly add an
  // onTrigger function to avoid needing to copy paste in UserInput system? WAit
  // until there are more abilities. Or just an `onTriggered => blueprint()` property.

  a001: {
    // Note: this cooldown entity will be tied to the lifespan of the entity
    // that owns this PlayerAbilitiesCmp
    cooldown: AssuredEntityId<CooldownCmp> | null;
  };

  a002: {
    cooldown: AssuredEntityId<CooldownCmp> | null;
  };
};

export function makePlayerAbilitiesCmp(): PlayerAbilitiesCmp {
  return {
    k: 'player-abilities',
    a001: { cooldown: null },
    a002: { cooldown: null },
  };
}
