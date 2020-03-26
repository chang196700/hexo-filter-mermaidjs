var renderer = require('./lib/renderer');

hexo.config.mermaid = Object.assign({
  enable: false,
  css: '',
  options: {
    startOnLoad: false
  }
}, hexo.config.mermaid);

renderer.config = hexo.config;

hexo.extend.filter.register('before_post_render', renderer.render, 9);
