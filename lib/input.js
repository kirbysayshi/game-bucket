export default (root) => {
  //const touches = [];
  //const mouses = [];
  //root.addEventListener('mousedown', , false);
  //root.addEventListener('mouseup', , false);
  const keys = {};

  const keydown = (e) => {

  }

  root.addEventListener('keydown', keydown, false);
  root.addEventListener('keyup', , false);

  return {
    isDown: (k) => return keys[],
    destroy: () => {
      root.removeEventListener('keydown', , false);
      root.removeEventListener('keyup', , false);
    }
  }
}