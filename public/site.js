$(function () {
  var toc = $('<span class="toc"/>').insertAfter('.sidebar-nav-item.active');
  $('h2[id],h3[id],h4[id],h5[id],h6[id]').each(function () {
    toc.append(
      $('<a class="sidebar-nav-item"/>')
        .addClass('level-' + this.localName)
        .attr('href', '#' + this.id)
        .text($(this).text()));
  });
});
