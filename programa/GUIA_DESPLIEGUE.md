# 🚀 Guía de Despliegue Público con Ngrok

Esta guía te permitirá poner tu juego Match-3 en línea para que otras personas puedan acceder desde sus computadoras a través de internet.

## 📋 Prerrequisitos

1.  **Cuenta de Ngrok**: Necesitas una cuenta en [ngrok.com](https://ngrok.com).
2.  **Authtoken**: Debes conectar tu cuenta. Si no lo has hecho, ejecuta este comando en cualquier terminal (reemplaza `<TU_TOKEN>` con el que obtienes en el dashboard de Ngrok):
    ```powershell
    npx ngrok config add-authtoken <TU_TOKEN>
    ```

---

## 🛠️ Paso 1: Iniciar los Túneles (Ngrok)

Este proceso generará las URLs públicas para tu servidor y tu cliente.

1.  Abre una **Terminal #1**.
2.  Navega a la carpeta del servidor:
    ```powershell
    cd server
    ```
3.  Ejecuta el script de despliegue:
    ```powershell
    npm run ngrok
    ```
4.  **¡NO CIERRES ESTA TERMINAL!** Verás algo como esto:
    > 📡 Server (Backend) URL: https://xxxx-xxxx.ngrok-free.app
    > 💻 Client (Frontend) URL: https://yyyy-yyyy.ngrok-free.app

---

## 🖥️ Paso 2: Iniciar el Servidor (Backend)

El servidor manejará la lógica del juego y las conexiones.

1.  Abre una **Terminal #2**.
2.  Navega a la carpeta del servidor:
    ```powershell
    cd server
    ```
3.  Inicia el servidor en modo desarrollo:
    ```powershell
    npm run dev
    ```
    *Deberías ver "Server running on port 4000" y "Conectado a la base de datos".*

---

## 🎮 Paso 3: Iniciar el Cliente (Frontend)

El cliente necesita saber cuál es la URL pública de tu servidor para conectarse correctamente.

1.  Copia la **Server (Backend) URL** que obtuviste en el **Paso 1** (ej. `https://xxxx-xxxx.ngrok-free.app`).
2.  Abre una **Terminal #3**.
3.  Navega a la carpeta del cliente:
    ```powershell
    cd client
    ```
4.  Ejecuta el siguiente comando (Pegando tu URL donde se indica):

    **En PowerShell:**
    ```powershell
    $env:REACT_APP_BACKEND_URL="PEGAR_AQUI_LA_URL_DEL_SERVER"; npm start
    ```
    *(Ejemplo: `$env:REACT_APP_BACKEND_URL="https://a1b2-c3d4.ngrok-free.app"; npm start`)*

    **En CMD (Símbolo del sistema):**
    ```cmd
    set REACT_APP_BACKEND_URL=PEGAR_AQUI_LA_URL_DEL_SERVER && npm start
    ```

---

## 🌍 Paso 4: ¡A Jugar!

1.  Copia la **Client (Frontend) URL** que obtuviste en el **Paso 1** (ej. `https://yyyy-yyyy.ngrok-free.app`).
2.  Comparte ese enlace con tus amigos.
3.  Tú también puedes usar ese enlace o entrar por `http://localhost:3000`.

### ⚠️ Notas Importantes
- **No cierres la Terminal #1**: Si cierras Ngrok, las URLs dejarán de funcionar.
- **URLs Dinámicas**: Cada vez que reinicies el comando `npm run ngrok`, las URLs cambiarán. Tendrás que reiniciar el Cliente (Paso 3) con la nueva URL.
