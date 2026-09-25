# Agenda Coordinación Operativa · Hotel Copahue

## Qué subir a GitHub

Solo el archivo **index.html** (reemplazá el que está). Netlify lo publica solo.

Los datos se guardan en **Firebase (Firestore)**, proyecto `agenda-e1cbb`, dentro de la colección `agenda_copahue`
(la que habilitan tus reglas). No hace falta configurar nada más.

Los archivos `package.json`, `netlify.toml` y la carpeta `netlify/` de la entrega anterior ya **no se necesitan**:
podés borrarlos del repositorio (si quedan, no molestan).

## Cómo comprobar que guarda en la nube

1. Entrá al sitio con tu usuario. Si lo habías creado cuando la agenda guardaba solo en el navegador, ingresá **desde ese mismo navegador** con el mismo nombre y clave: el usuario y su agenda se pasan solos a la nube.
2. Tocá tu inicial/nombre arriba a la derecha: tiene que decir **"Guardado en la nube"**.
3. Si aparece un cartel rojo **"Sin conexión con la base de datos"**, no se pudo conectar con Firebase: revisá internet y recargá.

## Datos anteriores

- **Usuarios que guardaban solo en el navegador:** al ingresar desde ese navegador con su nombre y clave, se crean en la nube y se sube toda su agenda (tareas, series, notas, tablero y lo compartido). Si usaron la agenda en varios navegadores, conviene ingresar una vez desde cada uno: se suma todo.
- **Versión anterior (la de antes de los usuarios):** al entrar aparece un cartel para **importar** esos datos a tu usuario.

## Seguridad

Las reglas actuales permiten leer y escribir la colección a cualquiera que tenga la configuración del sitio.
Las claves de los usuarios se guardan cifradas (PBKDF2), pero conviene más adelante endurecer las reglas.
