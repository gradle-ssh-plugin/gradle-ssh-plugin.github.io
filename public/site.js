$(function () {
  $('.page table').addClass('table');

  $('h2[id],h3[id],h4[id],h5[id],h6[id]').each(function () {
    $('.toc>.nav').append($('<li>')
      .addClass('level-' + this.localName)
      .append($('<a>')
        .attr('href', '#' + this.id)
        .text($(this).text())))
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

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');ga('create', 'UA-3232369-11', 'gradle-ssh-plugin.github.io');ga('send', 'pageview');
