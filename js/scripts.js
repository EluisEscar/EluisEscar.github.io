/*!
* Start Bootstrap - Personal v1.0.1 (https://startbootstrap.com/template-overviews/personal)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-personal/blob/master/LICENSE)
*/
// This file is intentionally blank
// Use this file to add JavaScript to your project
/*
  const texto = "Automatiza, Optimiza, Evoluciona";
  const el = document.getElementById("typewriter");
  let index = 0;
  let borrar = false;

  function escribir() {
    if (!borrar && index <= texto.length) {
      el.textContent = texto.substring(0, index++);
    } else if (borrar && index >= 0) {
      el.textContent = texto.substring(0, index--);
    }

    if (index === texto.length + 1) {
      borrar = true;
      setTimeout(escribir, 1000); // espera antes de borrar
      return;
    } else if (index === 0 && borrar) {
      borrar = false;
      setTimeout(escribir, 500); // espera antes de volver a escribir
      return;
    }

    setTimeout(escribir, borrar ? 50 : 100); // velocidad de escritura/borrado
  }

  escribir();

*/

function typewriterEffect(id, text, speed = 100, loop = false) {
  const el = document.getElementById(id);
  let i = 0;
  let borrar = false;

  function escribir() {
    if (!borrar && i <= text.length) {
      el.textContent = text.substring(0, i++);
    } else if (loop && borrar && i >= 0) {
      el.textContent = text.substring(0, i--);
    }

    if (loop) {
      if (i === text.length + 1) {
        borrar = true;
        setTimeout(escribir, 1000);
        return;
      } else if (i === 0 && borrar) {
        borrar = false;
        setTimeout(escribir, 500);
        return;
      }
    }

    setTimeout(escribir, borrar ? speed / 2 : speed);
  }

  escribir();
}

typewriterEffect("typewriter", "Automatiza, Optimiza, Evoluciona",80, true);