$(function () {
  var toc = $('<span class="toc"/>').insertAfter('.sidebar-nav-item.active');
  $('h2[id],h3[id],h4[id],h5[id],h6[id]').each(function () {
    toc.append(
      $('<a class="sidebar-nav-item"/>')
        .addClass('level-' + this.localName)
        .attr('href', '#' + this.id)
        .text($(this).text()));
  });

  if (location.pathname == '/build-report.html') {
    var computeTemplate = function (template, branchName) {
      return template.replace(/BRANCH/g, branchName);
    }.bind(null, $('.page>ul').html());
    $('.page>ul').empty();

    $.get('/build-report/branch-list').done(function (branchList) {
      branchList.split(/[\r\n]+/).filter(function (branchName) {
        return branchName.match(/\w+/);
      }).forEach(function (branchName) {
        $(computeTemplate(branchName)).prependTo('.page>ul');
      });
    });
  }
});
