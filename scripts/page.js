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
  var curLibVal = $('#librarySelector option:selected').val();
  var curLibName = $('#librarySelector option:selected').text();
  var curTag = $('#versionSelector option:selected').val();
  var src = './libraries/' + curLibName + '/' + curTag + '/' + curLibVal + '/index.html';
  var frame = $('#documentationFrame');

  frame.on('load', function () {
    resizeFrame(document.getElementById('documentationFrame'));
  });
  frame.attr('src', src);
}

function onLibraryChange() {
  var curLib = $('#librarySelector option:selected').text();
  var tags;
  $.each(crates, function(index, crate) {
    if (crate.name === curLib) {
      var version = $("#versionSelector");
      $('#versionSelector').empty();
      $.each(crate.tags, function(index, tag) {
        version.append(new Option(tag, tag));
      });
      reloadFrame();
      return false;
    }
  });
}

function onVersionChange() {
  reloadFrame();
}

window.onload = function () {
  $.getJSON('./data/crates.json', function(cratesData) {
    var library = $("#librarySelector");
    var version = $("#versionSelector");
    crates = cratesData;
    $.each(crates, function(index, crate) {
      library.append(new Option(crate.name, crate.realName));
    });
    $.each(crates[0].tags, function(index, tag) {
      version.append(new Option(tag, tag));
    });
    reloadFrame();
    $('#librarySelector').change(onLibraryChange);
    $('#versionSelector').change(onVersionChange);
  });
};

