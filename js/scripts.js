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
/*
function typewriterOnView(el, text, speed = 100) {
  let i = 0;

  function escribir() {
    if (i <= text.length) {
      el.textContent = text.substring(0, i++);
      setTimeout(escribir, speed);
    }
  }

  escribir();
}

const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const text = el.getAttribute('data-text');
      if (!el.classList.contains('typed')) {
        el.classList.add('typed');
        typewriterOnView(el, text, 100);
      }
      obs.unobserve(el); // Deja de observar después de activarse
    }
  });
}, {
  threshold: 0.5 // Se activa cuando el 50% del div es visible
});

document.querySelectorAll('.typewriter-once').forEach(el => {
  observer.observe(el);
});
*/

function typewriterOnView(el, text, speed, startDelay) {
  let i = 0;

  function escribir() {
    if (i <= text.length) {
      el.textContent = text.substring(0, i++);
      setTimeout(escribir, speed);
    }
  }

  // Espera antes de comenzar a escribir
  setTimeout(escribir, startDelay);
}

const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const text = el.getAttribute('data-text');
      if (!el.classList.contains('typed')) {
        el.classList.add('typed');
        typewriterOnView(el, text, 100, 300); // <- puedes ajustar ambos valores aquí
      }
      obs.unobserve(el);
    }
  });
}, {
  threshold: 0.5
});

document.querySelectorAll('.typewriter-once').forEach(el => {
  observer.observe(el);
});

typewriterEffect("typewriter", "Automatiza, Optimiza, Evoluciona",80, true);


