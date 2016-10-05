/* eslint-disable */

function onVersionChange() {
  if (this.value !== 'other') {
    location = this.value;
  }
}

window.onload = function () {
  var selectors = document.getElementsByTagName('select');
  for (var i = 0; i < selectors.length; i++) {
    selectors[i].setAttribute("onchange", onVersionChange.bind(selectors[i]));
  }
};

