$(function () {
  $('h2[id],h3[id],h4[id],h5[id],h6[id]').each(function () {
    $('.toc').append(
      $('<div/>').append($('<a/>').attr('href', '#' + this.id).text($(this).text()))
    );
  });
});
