/* eslint-disable */

var crates;

function resizeFrame(iframe) {
  var iframeWin = iframe.contentWindow || iframe.contentDocument.parentWindow;
  if (iframeWin.document.body) {
    iframe.height = iframeWin.document.documentElement.scrollHeight || iframeWin.document.body.scrollHeight;
    iframe.width = window.innerWidth;
  }
}

function reloadFrame() {
  var info = getInfo();
  var curTag = $('#versionSelector option:selected').val();
  var src = info.host + '/libraries/' + info.lib.name + '/' + curTag + '/' + info.lib.realName + '/index.html';
  var frame = $('#documentationFrame');

  frame.on('load', function () {
    resizeFrame(document.getElementById('documentationFrame'));
  });
  frame.attr('src', src);
}

function onVersionChange() {
  reloadFrame();
}

window.onload = function () {
  var info = getInfo();
  var version = $("#versionSelector");
  $.each(info.lib.tags, function(index, tag) {
    version.append(new Option(tag, tag));
  });
  $('#versionSelector').change(onVersionChange);
};

