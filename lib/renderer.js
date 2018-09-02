var reg = /(\s*)(```) *(mermaid) *\n?([\s\S]+?)\s*(\2)(\n+|$)/g;

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

    data.content = data.content
      .replace(reg, function (raw, start, startQuote, lang, content, endQuote, end) {
        var mermaidId = getId(mermaids.length);
        mermaids.push(content);
        return start + '<div id="' + mermaidId + '" class="mermaid"></div>' + end;
      });

    if (mermaids.length) {
      var config = this.config.mermaid;
      var optionsId = 'mermaid-options';
      // resources
      data.content += '<script src="' + config.mermaid + '"></script>';
      if (config.css) {
        data.content += '<link href="' + config.css + '" rel="stylesheet" type="text/css" />'
      }
      data.content += '<textarea id="' + optionsId + '" style="display: none">' + JSON.stringify(config.options) + '</textarea>'
      data.content += '' +
        '{% raw %}' +
        '<script>' +
        '  var options = JSON.parse(decodeURIComponent(document.getElementById("' + optionsId + '").value));' +
        '  mermaid.initialize(options);' +
        '</script>' +
        '{% endraw %}';
      // exec
      data.content += mermaids.map(function (code, index) {
        var mermaidId = getId(index);
        var codeId = mermaidId + '-code';
        return '' +
          '{% raw %}' +
          '<textarea id="' + codeId + '" style="display: none">' + code + '</textarea>' +
          '<script>' +
          '  var code = document.getElementById("' + codeId + '").value;' +
          '  var elem = document.getElementById("' + mermaidId + '");' +
          '  mermaid.render("' + mermaidId + '-svg", code, function(svg, bind) {' +
          '    elem.innerHTML = svg;' +
          '    bind(elem);' +
          '  });' +
          '</script>' +
          '{% endraw %}';
      }).join('');
    }
  }
};
