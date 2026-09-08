# Agenda Coordinación Operativa — Hotel Copahue

Archivo único (`index.html`), autocontenido: no necesita build ni instalar nada.

## Qué cambia respecto a la versión del chat

- El guardado ahora usa **localStorage del navegador** en vez del almacenamiento del chat.
  Esto significa que los datos quedan guardados **en ese navegador/dispositivo puntual**.
  Si la abrís desde el celular y desde la notebook, son dos agendas independientes (no se sincronizan solas).
- Todo lo demás (semana, notas varias, series recurrentes, exportar .ics, importancia/urgencia, etc.) funciona igual.

## Publicar en GitHub Pages

1. Creá un repositorio nuevo (o usá uno existente) y subí `index.html` a la raíz.
2. Andá a **Settings → Pages**.
3. En "Source" elegí la rama (ej. `main`) y la carpeta `/root`.
4. Guardá. GitHub te va a dar una URL tipo `https://tu-usuario.github.io/tu-repo/`.

## Publicar en Netlify

**Opción rápida (arrastrar y soltar):**
1. Entrá a [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arrastrá la carpeta que contiene `index.html`.
3. Netlify te da una URL al toque.

**Con repositorio (recomendado si vas a seguir editando):**
1. Subí `index.html` a un repo de GitHub.
2. En Netlify: "Add new site" → "Import an existing project" → conectá el repo.
3. Como no hay build (es HTML puro), dejá el "Build command" vacío y el "Publish directory" en `/` (raíz).

## Nota sobre el logo

El logo del Hotel Copahue quedó incrustado dentro del propio `index.html` (en base64), así que no hace falta subir ningún archivo de imagen aparte.
