const demos: Record<
  string,
  () => Promise<{ boot: () => Promise<void>; shutdown: () => Promise<void> }>
> = {
  '#three-body': () => import('./three-body/index.demo.three-body'),
  '#screen-shake': () => import('./screen-shake/index.demo.screen-shake'),
};

window.addEventListener('hashchange', async (ev) => {
  const oldHash = ev.oldURL.match('#(.+)$');
  if (oldHash) {
    const { shutdown } = await demos[oldHash[0]]();
    await shutdown();
  }

  const { boot } = await demos[location.hash]();
  await boot();
});

async function boot() {
  if (location.hash === '') {
    return;
  }

  const { boot } = await demos[location.hash]();
  await boot();
}

boot().catch((err) => {
  throw err;
});
