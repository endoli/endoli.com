/* eslint-disable */

function onVersionChange() {
  if (this.value !== 'other') {
    location = this.value;
  }
}

window.onload = function () {
  $('select').each(function(selector) {
    $(this).on('change', onVersionChange.bind(this));
  });
};

