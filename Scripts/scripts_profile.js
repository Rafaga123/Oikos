$(document).ready(function() {
  // Activar dropdown
  $('.ui.dropdown').dropdown();

  // Activar dimmer
  $('.special.card .image').dimmer({ on: 'hover' });

  // Abrir el modal
  $('#modificarBtn').on('click', function() {
    $('#modalModificar').modal('show');
  });


$('#guardarCambios').on('click', function() {
  // Cierra el modal
  $('#modalModificar').modal('hide');

  // Espera a que el modal se cierre antes de mostrar la alerta
  setTimeout(() => {
    $('#alertSuccess').fadeIn();

    // Oculta la alerta después de 3 segundos
    setTimeout(() => {
      $('#alertSuccess').fadeOut();
    }, 3000);
  }, 500);
});



});


