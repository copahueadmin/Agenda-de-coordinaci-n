# Agenda Coordinación Operativa · v2

## Qué subir al repositorio de GitHub

Copiá todo esto en la raíz del repo (donde ya está `index.html`):

```
index.html                    ← reemplaza al actual
package.json                  ← nuevo
netlify.toml                  ← nuevo
netlify/functions/api.mjs     ← nuevo (el servidor)
```

Hacé commit y push. Netlify publica solo: instala `@netlify/blobs` y activa la función `/api`.
No hace falta crear cuentas, claves ni bases de datos: los datos se guardan en **Netlify Blobs**, que ya viene incluido en el sitio.

> Si ya tenías un `package.json` o `netlify.toml`, no los pises: agregá la dependencia `"@netlify/blobs": "^8.2.0"` y el bloque `[functions]`.

## Cómo comprobar que funciona

1. Entrá al sitio y creá un usuario.
2. Abrí el menú de tu nombre (arriba a la derecha). Tiene que decir **"Sincronizado con el servidor"**.
   Si dice **"Modo local"**, la función no se publicó: revisá en Netlify → *Deploys* el log del último deploy, y en *Functions* que aparezca `api`.

## Datos de la versión anterior

La versión anterior guardaba todo en el navegador. La primera vez que alguien entre con su usuario **desde la misma computadora**, aparece un cartel para **importar** esas tareas, series y notas a su usuario.

## Notas

- Las alarmas suenan mientras la agenda esté abierta en alguna pestaña (si el navegador lo permite, también mandan una notificación). Desde el menú del usuario se pueden activar las notificaciones y probar el sonido.
- Cualquiera puede crear un usuario con nombre y clave. Las claves se guardan cifradas en el servidor. No hay recuperación de clave: si alguien se la olvida, conviene que cree un usuario nuevo.
