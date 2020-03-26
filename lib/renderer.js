const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('hexo-fs');

var reg = /(\s*)(```) *(mermaid)(\{.*?\})? *\n?([\s\S]+?)\s*(\2)(\n+|$)/g;

function ignore(data) {
  var source = data.source;
  var ext = source.substring(source.lastIndexOf('.')).toLowerCase();
  return ['.js', '.css', '.html', '.htm'].indexOf(ext) > -1;
}

function getId(index) {
  return 'mermaid-' + index;
}

exports.render = function (data) {
  if (!ignore(data)) {

    var mermaids = [];

    var browser;
    var page;
    var abbrlink = data.abbrlink;

    return Promise.resolve().then(() => {
      data.content = data.content.replace(reg, (raw, start, startQuote, lang, options, content, endQuote, end) => {
        var mermaidId = getId(mermaids.length);
        eval(`mermaidOptions=${options}`);
        mermaids.push({
          id: mermaidId,
          content: content,
          options: Object.assign({
            target: 'svg',
            theme: 'forest',
            backgroundColor: 'transparent'
          }, mermaidOptions)
        });
        return `${start}{%-${mermaidId}%}${end}`
      });
    }).then(() => {
      return puppeteer.launch({});
    }).then((b) => {
      browser = b;
      return browser.newPage();
    }).then((p) => {
      page = p;
      return page.goto(`file://${path.join(__dirname, 'index.html')}`);
    }).then(() => {
      let result = Promise.resolve();
      var urlpath
      var basepath
      mermaids.forEach((m) => {
        urlpath = path.join('images', abbrlink);
        basepath = path.join('public', urlpath);
        result = result.then(() => {
          return page.$eval('#container', (container, content, config, css) => {
            window.mermaid.mermaidAPI.initialize(config);
            con = window.mermaid.mermaidAPI.render('render', content);
            container.innerHTML = con;

            const head = window.document.head || window.document.getElementsByTagName('head')[0];
            const style = document.createElement('style');
            style.type = 'text/css';
            if (style.styleSheet) {
              style.styleSheet.cssText = css
            } else {
              style.appendChild(document.createTextNode(css))
            }
            head.appendChild(style)
          }, m.content, m.options, '#container div{ font-size: 0.9em; }')
        });
        if (m.options.target == 'png') {
          result = result.then(() => {
            return fs.exists(basepath);
          }).then((exists) => {
            if (!exists) {
              return fs.mkdir(basepath, {
                recursive: true
              });
            }
            return Promise.resolve();
          }).then(() => {
            return page.$eval('svg', svg => {
              const react = svg.getBoundingClientRect()
              return { x: react.left, y: react.top, width: react.width, height: react.height }
            });
          }).then((clip) => {
            return page.screenshot({ path: path.join(basepath, `${m.id}.png`), clip, omitBackground: m.options.backgroundColor === 'transparent' })
          }).then(() => {
            data.content = data.content.replace(`{%-${m.id}%}`,
              `{% raw %}<img id="${m.id}" src="/${path.join(urlpath, `${m.id}.png`)}" class="mermaidjs" />{% endraw %}`);
            return Promise.resolve();
          });
        } else if (m.options.target == 'pdf') {
          result = result.then(() => {
            return fs.exists(basepath);
          }).then((exists) => {
            if (!exists) {
              return fs.mkdir(basepath, {
                recursive: true
              });
            }
            return Promise.resolve();
          }).then(() => {
            return page.pdf({ path: path.join(basepath, `${m.id}.pdf`), printBackground: m.options.backgroundColor !== 'transparent' })
          }).then(() => {
            data.content = data.content.replace(`{%-${m.id}%}`,
              `{% pdf /${path.join(urlpath, `${m.id}.pdf`)} %}`)
          })
        } else {
          result = result.then(() => {
            return page.$eval('#container', container => container.innerHTML);
          }).then((svg) => {
            data.content = data.content.replace(`{%-${m.id}%}`,
              `{% raw %}<pre id="${m.id}" class="mermaidjs" style="text-align:center;">${svg}</pre>{% endraw %}`);
            return Promise.resolve();
          });
        }
      });
      return result.then(() => {
        data.content += "{% raw %}<style type='text/css'>.mermaidjs div{ font-size: 0.9em; }</style>{% endraw %}";
      });
    }).then(() => {
      return browser.close();
    })
  }
};
