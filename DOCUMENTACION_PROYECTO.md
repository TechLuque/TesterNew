# 📚 Documentación Completa del Proyecto - Sistema de Acceso a Zooms

## 📋 Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Flujo de Ejecución](#flujo-de-ejecución)
4. [Archivos y Funciones](#archivos-y-funciones)
5. [LocalStorage](#localstorage)
6. [Apps Scripts Requeridos](#apps-scripts-requeridos)
7. [Estructura de Google Sheets](#estructura-de-google-sheets)

---

## 📖 Descripción General

Sistema de acceso multi-tenant a salas de Zoom basado en validación de emails contra múltiples Google Sheets. Permite que usuarios autorizados accedan a 3 salas diferentes (Código, Máquina, Maestría) según su permiso en cada una.

**Características principales:**
- ✅ Validación de email contra 3 Apps Scripts en paralelo
- ✅ Acceso diferenciado por sala
- ✅ Links a Zoom dinámicos desde Google Sheets
- ✅ Contacto WhatsApp para usuarios sin acceso
- ✅ Persistencia de sesión con localStorage

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    INICIO (index.html)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   LOGIN (login.html/login.js)     │
         │  - Solicita email del usuario     │
         │  - Valida contra 3 Apps Scripts   │
         │  - Guarda en localStorage         │
         └────────────┬──────────────────────┘
                      │
                      ▼
         ┌───────────────────────────────────┐
         │   LOBBY PRINCIPAL (lobby.html)    │
         │  - Muestra 3 salas disponibles    │
         │  - Habilita/deshabilita según    │
         │    permisos del usuario           │
         └─┬──────────┬──────────┬───────────┘
           │          │          │
      ┌────▼──┐  ┌────▼──┐  ┌────▼──┐
      │CÓDIGO │  │MÁQUINA│  │MAESTRÍA
      │       │  │       │  │
      ▼       ▼  ▼       ▼  ▼
    ┌─────────────────────────────────┐
    │  SALAS AUXILIARES               │
    │  (codigo/maquina/maestria.html) │
    │  - Valida acceso a esa sala     │
    │  - Muestra link a Zoom          │
    │  - Si no acceso → WhatsApp      │
    └─────────────────────────────────┘
```

---

## 🔄 Flujo de Ejecución

### 1️⃣ **Login (login.html → login.js)**

```
Usuario entra email
    ↓
validateEmailInServer() x3 en paralelo
    ├─ Apps Script 1 (Código)
    ├─ Apps Script 2 (Máquina)
    └─ Apps Script 3 (Maestría)
    ↓
Cada uno retorna: { ok: true/false, join_url: "...", whatsapp: "..." }
    ↓
Se mantienen índices originales:
    accessibleServers[0] = respuesta Apps Script 1 o null
    accessibleServers[1] = respuesta Apps Script 2 o null
    accessibleServers[2] = respuesta Apps Script 3 o null
    ↓
localStorage.setItem('accessibleServers', JSON.stringify(accessibleServers))
    ↓
Redirige a: lobby.html
```

### 2️⃣ **Lobby Principal (lobby.html → lobby.js)**

```
Carga lobby.html
    ↓
initializeLobby() lee localStorage['accessibleServers']
    ↓
Para cada sala (1, 2, 3):
    ├─ Si accessibleServers[índice] !== null → Botón HABILITADO
    └─ Si accessibleServers[índice] === null → Botón DESHABILITADO
    ↓
Usuario hace click en sala disponible
    ↓
accessLobby(lobbyNumber) valida acceso
    ↓
Redirige a:
    ├─ codigo.html (si clicked en sala 1)
    ├─ maquina.html (si clicked en sala 2)
    └─ maestria.html (si clicked en sala 3)
```

### 3️⃣ **Salas Auxiliares (codigo/maquina/maestria.html)**

```
Carga codigo.html (ejemplo)
    ↓
codigo.js ejecuta initializeCodigoLobby()
    ↓
Lee localStorage['accessibleServers']
    ↓
Verifica: accessibleServers[0] !== null?
    ├─ SI → showAccessGranted()
    │       └─ Obtiene join_url de accessibleServers[0].join_url
    │       └─ Muestra botón "ENTRAR A LA SALA" con link a Zoom
    │
    └─ NO → showAccessDenied()
            └─ Muestra "Sin acceso"
            └─ Botón de contacto por WhatsApp
```

---

## 📁 Archivos y Funciones

### 🔑 **1. login.html**
**Ubicación:** `sources/views/login/login.html`

**Propósito:** Formulario de inicio de sesión

**Elementos HTML:**
```html
<input id="email" type="email">           <!-- Campo de email -->
<div id="errorMessage"></div>             <!-- Mostrar errores -->
<button type="submit">INGRESAR</button>   <!-- Botón enviar -->
```

**Script conectado:** `login.js`

---

### ⚙️ **2. login.js**
**Ubicación:** `sources/views/login/login.js`

**Configuración:**
```javascript
const APPS_SCRIPTS = [
  'URL_AppScript_1',  // Código (índice 0)
  'URL_AppScript_2',  // Máquina (índice 1)
  'URL_AppScript_3'   // Maestría (índice 2)
];
const REDIRECT_PAGE = '../lobby/lobby.html';
```

#### **Función: handleLogin(event)**
```javascript
handleLogin(event)
```
**Qué hace:**
- Obtiene el email del usuario desde el input
- Valida que no esté vacío
- Llama a validateEmailInServer() 3 veces en paralelo (Promise.all)
- Convierte resultados a un array manteniendo índices originales
- Si al menos 1 resultado es válido (ok: true), guarda en localStorage y redirige
- Si ninguno valida, muestra error

**Parámetros:**
- `event` (Event): Evento del formulario

**Flujo:**
```
Obtener email del input
    ↓
Desactivar botón y mostrar "Verificando..."
    ↓
Promise.all([validate_srv1, validate_srv2, validate_srv3])
    ↓
Mapear resultados: (r && r.ok) ? r : null
    ↓
¿Al menos 1 válido?
    ├─ SÍ: Guardar en localStorage y redirigir
    └─ NO: Mostrar error
```

---

#### **Función: validateEmailInServer(appScriptUrl, email)**
```javascript
validateEmailInServer(appScriptUrl, email)
```
**Qué hace:**
- Hace una petición POST al Apps Script
- Envía el email como parámetro URLSearchParams
- Espera respuesta JSON
- Retorna el objeto JSON o null si hay error

**Parámetros:**
- `appScriptUrl` (String): URL del Apps Script
- `email` (String): Email a validar

**Retorna:**
```javascript
{
  ok: true,                    // ¿Email autorizado?
  join_url: "https://...",     // Link a Zoom (si ok: true)
  whatsapp: "+123456789"       // Número WhatsApp
}
// o null si hay error de conexión
```

**Método HTTP:**
```javascript
POST request
Body: email=user@example.com  (URLSearchParams)
Content-Type: text/plain (automático con URLSearchParams)
```

---

#### **Función: showError(element, message)**
```javascript
showError(element, message)
```
**Qué hace:**
- Escribe el mensaje de error en el elemento
- Hace visible el elemento

**Parámetros:**
- `element` (HTMLElement): Elemento donde mostrar error
- `message` (String): Texto del error

---

#### **Función: hideError(element)**
```javascript
hideError(element)
```
**Qué hace:**
- Limpia el contenido del elemento
- Oculta el elemento

**Parámetros:**
- `element` (HTMLElement): Elemento a ocultar

---

### 🏠 **3. lobby.html**
**Ubicación:** `sources/views/lobby/lobby.html`

**Estructura HTML:**
```html
<div class="lobbies-grid">
  <div id="lobby-1" class="lobby-card">
    <button class="btn-access" onclick="accessLobby(1)">ACCEDER</button>
    <div class="denied-msg">Sin acceso</div>
  </div>
  
  <div id="lobby-2" class="lobby-card">
    <button class="btn-access" onclick="accessLobby(2)">ACCEDER</button>
    <div class="denied-msg">Sin acceso</div>
  </div>
  
  <div id="lobby-3" class="lobby-card">
    <button class="btn-access" onclick="accessLobby(3)">ACCEDER</button>
    <div class="denied-msg">Sin acceso</div>
  </div>
</div>

<div id="no-access-msg" style="display:none;">
  <p>No tienes acceso a ninguna sala</p>
  <a class="btn-whatsapp">Contactar</a>
</div>
```

**Script conectado:** `lobby.js`

---

### 🎮 **4. lobby.js**
**Ubicación:** `sources/views/lobby/lobby.js`

#### **Función: initializeLobby()**
**Qué hace:**
- Lee email y accessibleServers del localStorage
- Si no existen, redirige a login
- Mapea cada servidor a su sala correspondiente:
  - `accessibleServers[0]` → Sala 1 (Código)
  - `accessibleServers[1]` → Sala 2 (Máquina)
  - `accessibleServers[2]` → Sala 3 (Maestría)
- Para cada sala, habilita o deshabilita el botón según permisos

**Lógica:**
```javascript
// Leer del localStorage
userEmail = localStorage.getItem('userEmail')
accessibleServersJSON = localStorage.getItem('accessibleServers')

// Parsear JSON
accessibleServers = JSON.parse(accessibleServersJSON)

// Para cada sala
for i = 1 to 3:
  if accessibleServers[i-1] !== null:
    Mostrar botón
    Clase CSS: 'enabled'
  else:
    Mostrar mensaje "Sin acceso"
    Clase CSS: 'disabled'
```

---

#### **Función: accessLobby(lobbyNumber)**
```javascript
accessLobby(lobbyNumber)
```
**Qué hace:**
- Valida que el usuario tenga acceso a esa sala
- Guarda la sala actual en localStorage
- Redirige a la página auxiliar

**Parámetros:**
- `lobbyNumber` (Number): 1, 2 o 3

**Redirecciones:**
- `accessLobby(1)` → `../codigo/codigo.html`
- `accessLobby(2)` → `../maquina/maquina.html`
- `accessLobby(3)` → `../maestria/maestria.html`

---

#### **Función: logout()**
```javascript
logout()
```
**Qué hace:**
- Limpia todos los datos del usuario de localStorage
- Redirige a login.html

**LocalStorage limpiado:**
```javascript
userEmail
accessibleServers
currentLobby
lobby1_url
lobby2_url
lobby3_url
whatsapp
```

---

### 🎯 **5. codigo.html / maquina.html / maestria.html**
**Ubicación:** 
- `sources/views/codigo/codigo.html`
- `sources/views/maquina/maquina.html`
- `sources/views/maestria/maestria.html`

**Estructura HTML:**

```html
<!-- ACCESO CONCEDIDO -->
<div id="access-granted" style="display:none;">
  <h1>Bienvenido</h1>
  <a id="btn-zoom-codigo" class="btn-gradient" target="_blank">
    ENTRAR A LA SALA
  </a>
  <button onclick="backToLobby()">Volver al Lobby</button>
</div>

<!-- ACCESO DENEGADO -->
<div id="access-denied" style="display:none;">
  <p>No tienes acceso a este módulo</p>
  <a class="btn-whatsapp" target="_blank">
    <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
  </a>
  <button onclick="backToLobby()">Volver al Lobby</button>
</div>
```

**Scripts conectados:**
- `codigo.js` para codigo.html
- `maquina.js` para maquina.html
- `maestria.js` para maestria.html

---

### 🔐 **6. codigo.js / maquina.js / maestria.js**

**Configuración (ejemplo codigo.js):**
```javascript
const LOBBY_NUMBER = 1;    // Número de sala
const SERVER_INDEX = 0;    // Índice en accessibleServers (0, 1 o 2)
```

#### **Función: initializeCodigoLobby()**
**Ubicación:** Se ejecuta en `DOMContentLoaded`

**Qué hace:**
- Lee userEmail y accessibleServers del localStorage
- Si no existen, redirige a login
- Verifica si `accessibleServers[SERVER_INDEX]` !== null
- Si es válido, muestra acceso concedido
- Si no, muestra acceso denegado

**Flujo:**
```javascript
accessibleServers = JSON.parse(localStorage['accessibleServers'])

if (accessibleServers[SERVER_INDEX] !== null):
  showAccessGranted()
else:
  showAccessDenied()
```

---

#### **Función: showAccessGranted()**
**Qué hace:**
- Oculta el div de "acceso denegado"
- Muestra el div de "acceso concedido"
- Obtiene el `join_url` del servidor autorizado
- Asigna el URL al botón de Zoom

**Lógica:**
```javascript
accessibleServers = JSON.parse(localStorage['accessibleServers'])

// Para codigo.js: accessibleServers[0].join_url
// Para maquina.js: accessibleServers[1].join_url
// Para maestria.js: accessibleServers[2].join_url

joinUrl = accessibleServers[SERVER_INDEX].join_url
botón.href = joinUrl
```

---

#### **Función: showAccessDenied()**
**Qué hace:**
- Oculta el div de "acceso concedido"
- Muestra el div de "acceso denegado"
- Obtiene el número WhatsApp del localStorage
- Configura el botón de WhatsApp

**Lógica:**
```javascript
whatsapp = localStorage.getItem('whatsapp')
botón.href = 'https://wa.me/' + whatsapp.replace(/[^0-9]/g, '')
```

---

#### **Función: recordAccessLog(lobbyName)**
```javascript
recordAccessLog(lobbyName)
```
**Qué hace:**
- Registra cuándo el usuario accedió a una sala
- Guarda en localStorage con timestamp

**Parámetros:**
- `lobbyName` (String): 'codigo', 'maquina' o 'maestria'

**Ejemplo:**
```javascript
localStorage.setItem('accessed_codigo', '2026-01-13T10:30:45.123Z')
```

---

#### **Función: backToLobby()**
```javascript
backToLobby()
```
**Qué hace:**
- Redirige a la página del lobby principal

---

#### **Función: logout()**
```javascript
logout()
```
**Qué hace:**
- Limpia toda la sesión del usuario
- Redirige a login.html

---

## 💾 LocalStorage

### Estructura de Datos Almacenados

#### **1. userEmail**
```javascript
localStorage.setItem('userEmail', 'usuario@example.com')

Contenido: String con el email del usuario
Creado en: login.js (handleLogin)
Leído en: lobby.js, codigo.js, maquina.js, maestria.js
```

---

#### **2. accessibleServers**
```javascript
localStorage.setItem('accessibleServers', JSON.stringify([
  { ok: true, join_url: "https://zoom.us/j/1111", whatsapp: "+5491234567" },  // [0] Código
  null,                                                                         // [1] Máquina
  { ok: true, join_url: "https://zoom.us/j/3333", whatsapp: "+5491234567" }   // [2] Maestría
]))

Contenido: Array con 3 posiciones (una por cada servidor)
           Cada posición: { ok, join_url, whatsapp } o null
Creado en: login.js (handleLogin)
Leído en: lobby.js, codigo.js, maquina.js, maestria.js
```

**Mapeo de índices:**
| Índice | Sala | Apps Script |
|--------|------|-------------|
| 0 | Código | Apps Script 1 |
| 1 | Máquina | Apps Script 2 |
| 2 | Maestría | Apps Script 3 |

---

#### **3. whatsapp**
```javascript
localStorage.setItem('whatsapp', '+5491234567')

Contenido: String con número de WhatsApp (con código de país)
Creado en: login.js (handleLogin)
Leído en: codigo.js, maquina.js, maestria.js
Uso: Botón de contacto si usuario no tiene acceso
```

---

#### **4. currentLobby** (Opcional)
```javascript
localStorage.setItem('currentLobby', 1)

Contenido: Number con sala actual (1, 2 o 3)
Creado en: lobby.js (accessLobby)
Uso: Registrar qué sala accedió el usuario
```

---

#### **5. accessed_[sala]** (Opcional)
```javascript
localStorage.setItem('accessed_codigo', '2026-01-13T10:30:45.123Z')
localStorage.setItem('accessed_maquina', '2026-01-13T10:35:20.456Z')
localStorage.setItem('accessed_maestria', '2026-01-13T10:40:10.789Z')

Contenido: Timestamp ISO de último acceso
Creado en: codigo.js, maquina.js, maestria.js (recordAccessLog)
Uso: Auditoría de accesos
```

---

## 🔧 Apps Scripts Requeridos

### Configuración General

**Requiere:** 3 Google Apps Scripts diferentes
- Apps Script 1: Para validar acceso a Código
- Apps Script 2: Para validar acceso a Máquina
- Apps Script 3: Para validar acceso a Maestría

Cada uno debe estar asociado a un Google Sheet diferente con sus propios usuarios.

---

### Estructura de Respuesta Apps Script

```javascript
{
  "ok": true,                          // ¿Email está autorizado?
  "join_url": "https://zoom.us/j/1234", // Link a la sala de Zoom
  "whatsapp": "+5491234567890"         // Contacto WhatsApp
}
```

O si no está autorizado:
```javascript
{
  "ok": false,
  "error": "Email no encontrado"
}
```

---

### Función doPost() Requerida

```javascript
function doPost(e) {
  try {
    const email = e.parameter.email;
    
    if (!email) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: "Email no proporcionado"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Buscar email en Google Sheet
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    let found = false;
    let joinUrl = "";
    let whatsapp = "";
    
    // Buscar en la hoja
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === email) { // Columna A: EMAIL
        found = true;
        joinUrl = values[i][1];      // Columna B: JOIN_URL
        whatsapp = values[i][2];     // Columna C: WHATSAPP
        break;
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: found,
      join_url: joinUrl,
      whatsapp: whatsapp
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 📊 Estructura de Google Sheets

Cada Google Sheet debe tener la siguiente estructura:

| Columna | Encabezado | Contenido | Ejemplo |
|---------|-----------|-----------|---------|
| A | EMAIL | Email del usuario | usuario@example.com |
| B | JOIN_URL | Link a la sala Zoom | https://zoom.us/j/123456789 |
| C | WHATSAPP | Número de WhatsApp | +5491234567890 |

### Ejemplo de Datos:
```
EMAIL                    | JOIN_URL                        | WHATSAPP
usuario1@example.com     | https://zoom.us/j/111111111     | +5491234567890
usuario2@example.com     | https://zoom.us/j/222222222     | +5491234567890
usuario3@example.com     | https://zoom.us/j/333333333     | +5491234567891
```

---

## 🔍 Flujo Completo de Ejemplo

### Usuario: diego@example.com

#### **Paso 1: Ingresa a login.html**
- Escribe: `diego@example.com`
- Click en INGRESAR

#### **Paso 2: login.js valida**
```javascript
// En paralelo:
POST Apps Script 1: email=diego@example.com
  → Google Sheet Código: ¿Existe diego@example.com?
  → SI: Retorna { ok: true, join_url: "https://zoom.us/j/1111", whatsapp: "+549123456" }
  
POST Apps Script 2: email=diego@example.com
  → Google Sheet Máquina: ¿Existe diego@example.com?
  → NO: Retorna { ok: false }
  
POST Apps Script 3: email=diego@example.com
  → Google Sheet Maestría: ¿Existe diego@example.com?
  → SI: Retorna { ok: true, join_url: "https://zoom.us/j/3333", whatsapp: "+549123456" }
```

#### **Paso 3: login.js guarda en localStorage**
```javascript
accessibleServers = [
  { ok: true, join_url: "https://zoom.us/j/1111", whatsapp: "+549123456" },  // Código ✅
  null,                                                                        // Máquina ❌
  { ok: true, join_url: "https://zoom.us/j/3333", whatsapp: "+549123456" }   // Maestría ✅
]

localStorage['userEmail'] = 'diego@example.com'
localStorage['accessibleServers'] = JSON.stringify(accessibleServers)
localStorage['whatsapp'] = '+549123456'
```

#### **Paso 4: Redirige a lobby.html**

#### **Paso 5: lobby.js inicializa**
```javascript
// Leer localStorage
accessibleServers = [servidor0, null, servidor2]

// Configurar salas
Sala 1 (Código):
  accessibleServers[0] !== null → BOTÓN HABILITADO ✅

Sala 2 (Máquina):
  accessibleServers[1] === null → BOTÓN DESHABILITADO ❌

Sala 3 (Maestría):
  accessibleServers[2] !== null → BOTÓN HABILITADO ✅
```

#### **Paso 6: Usuario hace click en "Código"**
```javascript
accessLobby(1)
  → Valida: accessibleServers[0] !== null ✅
  → Redirige a: codigo.html
```

#### **Paso 7: codigo.js inicializa**
```javascript
SERVER_INDEX = 0
accessibleServers[0] !== null → showAccessGranted()

Obtiene: join_url = "https://zoom.us/j/1111"
Asigna: btn-zoom-codigo.href = "https://zoom.us/j/1111"
```

#### **Paso 8: Usuario ve botón "ENTRAR A LA SALA"**
```
Botón habilitado → Click → Abre Zoom en nueva pestaña
```

#### **Paso 9: Usuario intenta acceder a "Máquina"**
```javascript
accessLobby(2)
  → Valida: accessibleServers[1] === null ❌
  → Alert: "No tienes acceso a esta sala"
```

---

## ⚠️ Posibles Errores y Soluciones

### Error 1: "Email no autorizado en ningún servidor"
**Causa:** El email no existe en ninguno de los 3 Google Sheets

**Solución:** Verificar que el email esté correctamente escrito en los Google Sheets

---

### Error 2: "CORS error - Access to fetch blocked"
**Causa:** El Apps Script no está devolviendo el header CORS correcto

**Solución:** Asegurar que el Apps Script devuelva `ContentService.MimeType.JSON`

---

### Error 3: Botón deshabilitado en todas las salas
**Causa:** Ninguno de los 3 Apps Scripts validó el email

**Solución:** Verificar que el email existe en al menos un Google Sheet

---

### Error 4: "No se encontró el URL de la sala"
**Causa:** El Apps Script no retornó el campo `join_url` en la respuesta

**Solución:** Asegurar que la columna B del Google Sheet contiene URLs de Zoom válidas

---

## 📱 Prueba Rápida del Sistema

### Checklist de Verificación:

- [ ] 3 Google Apps Scripts creados y deployados
- [ ] Cada Apps Script conectado a su Google Sheet
- [ ] Google Sheets contienen: EMAIL, JOIN_URL, WHATSAPP
- [ ] Apps Scripts retornan JSON con ok, join_url, whatsapp
- [ ] URLs del Apps Scripts están en login.js (APPS_SCRIPTS array)
- [ ] Usuario está en al menos un Google Sheet
- [ ] Email es exactamente igual (sin espacios, minúsculas)
- [ ] Links de Zoom son válidos y funcionan

---

## 🔐 Seguridad Recomendada

⚠️ **IMPORTANTE:** Este sistema es básico. Para producción, considerar:

1. **Validación de emails más robusta**
   - Verificar dominio de email
   - Implementar confirmación por email

2. **Encriptación**
   - No guardar datos sensibles en localStorage sin encriptar
   - Usar HTTPS siempre

3. **Autenticación**
   - Implementar OAuth con Google
   - Tokens JWT en lugar de localStorage

4. **Rate limiting**
   - Limitar intentos de login
   - Proteger contra ataques de fuerza bruta

5. **Auditoría**
   - Registrar todos los accesos a Google Sheets
   - Mantener logs de intentos fallidos

---

## 📞 Soporte y Contacto

**Para obtener ayuda:**
- ✅ Verificar la consola del navegador (F12) para errores
- ✅ Revisar logs de Apps Script
- ✅ Confirmar estructura de Google Sheets
- ✅ Probar URLs de Apps Scripts directamente en navegador

---

**Última actualización:** Enero 2026
**Versión:** 1.0
