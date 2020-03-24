var renderer = require('./lib/renderer');

hexo.config.mermaid = Object.assign({
  mermaid: 'https://unpkg.com/mermaid@8.4.8-rc.8/dist/mermaid.js',
  css: '',
  options: {
    startOnLoad: false
  }
}, hexo.config.mermaid);

hexo.extend.filter.register('before_post_render', renderer.render, 9);
