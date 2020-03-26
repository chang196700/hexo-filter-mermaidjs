const fs = require('hexo-fs');
const renderer = require('../lib/renderer');

const raw = "```mermaid{theme: 'dark', target: 'png'}\ngraph TD\nstart-->stop\n```\n```mermaid\ngraph LR\nstart-->stop\n```";

const data = {
    abbrlink: 'test',
    source: 'test.md',
    content: raw
}

renderer.config = {
    mermaid: {
        mermaid: "URL",
        options: {}
    }
}

renderer.render(data).then(() => {
    fs.writeFile('test.html', data.content);
}).catch((e) => {
    console.log(e);
});
