# Portfolio de Esteban Escarcena Torres

Portfolio editorial, accesible y responsive construido con HTML, CSS y JavaScript sin dependencias de npm. La identidad visual toma como referencia la composición tipográfica y la navegación por vistas de RBP Portfolio, pero utiliza contenido, proyectos y una dirección gráfica propios.

## Vistas

- `/`: presentación de Esteban Escarcena Torres y cuatro proyectos destacados.
- `/projects/`: seis proyectos con filtros por área, reto, solución, tecnologías y enlaces a GitHub.
- `/about/`: perfil, experiencia profesional con fechas verificadas en el CV y stack interactivo.

La navegación usa enlaces normales y funciona con recarga y acceso directo. Las rutas sin barra final también están disponibles en el Worker de vista previa.

## Identidad visual e interacción

Instrument Serif protagoniza los titulares y el nombre; Manrope se reserva para lectura y JetBrains Mono para etiquetas técnicas. La paleta combina marfil, tinta y azul cobalto, incluye tema oscuro y mantiene una composición editorial minimalista.

El stack reproduce caída, rebote, colisiones, arrastre y reinicio mediante Matter.js 0.20.0. También permite pausa, navegación por teclado y una presentación estática cuando se solicita movimiento reducido o JavaScript no está disponible.

## SEO e identidad digital

- Title, meta description, H1 y contenido semántico con el nombre completo.
- URLs canónicas bajo `https://eluisescar.github.io/`.
- Open Graph y X Cards con portada social local.
- JSON-LD válido con `Person`, `ProfilePage`, `WebSite` y `CollectionPage`.
- Relaciones `sameAs` y enlaces `rel="me"` hacia LinkedIn y GitHub.
- `robots.txt`, `sitemap.xml`, favicon ET y web manifest.
- HTML semántico, textos alternativos, foco visible y soporte para movimiento reducido.
- Retrato WebP optimizado con PNG original como respaldo.

## Vista local y validación

Ejecuta `python -m http.server 4173 --bind 127.0.0.1` desde esta carpeta y abre `http://127.0.0.1:4173`.

- `npm run build`: genera el Worker autónomo de vista previa en `dist/server/index.js`.
- `npm test`: valida rutas, metadatos SEO, canonical, JSON-LD, sitemap, robots, recursos, caché y la interacción del stack.
- `npm run test:responsive`: comprueba las tres páginas en 360, 390, 430, 768, 1024 y 1440 px con un navegador real, incluyendo overflow horizontal y controles fuera del viewport.
- `python scripts/check_pages.py`: comprueba enlaces internos, imágenes, anclas, identificadores únicos y textos alternativos.

## Publicación en GitHub Pages

Este repositorio está preparado para publicarse en la raíz de `https://eluisescar.github.io/`. Después de publicar, conviene enviar `https://eluisescar.github.io/sitemap.xml` a Google Search Console y solicitar la indexación de la portada.

No se realizan commits ni publicaciones automáticas desde este flujo de trabajo.

## Fuentes de contenido

Los cargos, fechas y tecnologías de la experiencia se contrastaron con `assets/proyectos/archivos_personales/CV_EstebanEscarcena.pdf`. No se añadieron certificaciones porque el repositorio no contiene evidencia suficiente para presentarlas como certificaciones oficiales.

Matter.js y los iconos de Devicon se incluyen localmente junto con sus licencias. `css/styles.css` pertenece al diseño anterior y se conserva como referencia; ninguna vista actual lo carga.
