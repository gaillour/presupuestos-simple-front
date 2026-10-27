# Frontend (`front/`) — Presupuestos Simple

SPA en Next.js 16 (React 19) con App Router, Tailwind CSS v4, Base UI y shadcn. Deploy en Vercel.

## Comandos Clave (npm oficial)
```bash
# Desarrollo local
npm run dev
# Verificación obligatoria antes de cerrar tareas
npx tsc --noEmit
npm run build
```

## Reglas Inviolables
1. **Modularización progresiva:** `app/page.tsx` supera las 3.000 líneas. Prohibido seguir inflando el archivo; extraer nuevas vistas, formularios y modales a `components/` (`presupuestos/`, `telas/`, etc.).
2. **Sincronización de contratos:** Tipos en `lib/types.ts` deben reflejar con precisión los esquemas Pydantic de `back/api.py`.
3. **Validación obligatoria:** Ejecutar siempre `npx tsc --noEmit` y `npm run build` antes de finalizar cualquier cambio.
4. **Gestor de paquetes:** Usar `npm` exclusivamente.

## Integración con Backend y Auth
- **API URL:** `NEXT_PUBLIC_API_URL` (`http://localhost:8000` en local / `https://presupuestos-simple.fly.dev` en producción).
- **Auth:** Guardar token y enviar en headers como `Authorization: Bearer <token>`.
- **PDF:** Para descargas en nueva pestaña, anexar token como query param (`?token=${token}`).
