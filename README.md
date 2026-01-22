# 🔐 Zoom Admin Panel

Sistema de validación de acceso a salas Zoom con seguridad máxima.

## ✅ Características

- 🔒 Sin exposición de datos sensibles en el navegador
- 🚀 Serverless en Vercel (sin servidor local)
- ⚡ Auto-deploy con Git push


## 📂 Estructura

```
api/
  └── validate-email.js    ← Serverless function

sources/
  ├── components/
  │   └── configuracion/
  │       └── conf.js
  └── views/
      ├── login/
      ├── lobby/
      ├── codigo/
      ├── maquina/
      └── maestria/

.env.example               ← Plantilla
vercel.json               ← Config Vercel
package.json              ← Dependencias
```

## 📝 Notas

- Las variables de entorno se actualizan en Vercel Dashboard
- No requiere configuración local
- Todos los datos sensibles están protegidos

---

**Seguridad garantizada.** ✅
