const { withAndroidColors } = require('@expo/config-plugins');

module.exports = (config) =>
  withAndroidColors(config, (mod) => {
    const colors = mod.modResults;
    const primary = colors.resources.color ?? [];
    const idx = primary.findIndex((c) => c.$ && c.$['name'] === 'colorPrimary');
    if (idx >= 0) {
      primary[idx]._ = '#E31B59';
    } else {
      primary.push({ $: { name: 'colorPrimary' }, _: '#E31B59' });
    }
    colors.resources.color = primary;
    return mod;
  });
