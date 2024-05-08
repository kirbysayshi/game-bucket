To generate the sprite atlas:

- open .aseprite files in Aseprite
- make changes. Any Tag will become a named animation.
- Save.
- Regenerate the atlas using `yarn atlas`

🚨_WARNING!_🚨: Tags cannot overlap! Aseprite will only attach the frame to the last tag, and none of the previous.