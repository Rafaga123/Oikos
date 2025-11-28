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

function previewImage(event) { /* funcion para el cambio de img del perfil */
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const imgElement = document.querySelector('.blurring.dimmable.image img');
        imgElement.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }


});


