# Calendario Ruster — Web de venta

Incluye una landing responsive, catálogo, preguntas frecuentes, formulario de pedido y API preparada para integrar pagos y licencias.

## Probar localmente
Instala Node.js LTS, abre PowerShell en esta carpeta y ejecuta:

    npm install
    npm start

Luego abre http://localhost:3000

## Variables de entorno
PRODUCT_PRICE=29.90
CURRENCY=PEN
APK_URL=https://tu-host/calendario-ruster.apk

## Siguiente conexión
Antes de cobrar de verdad conectaremos el proveedor de pagos, webhook de pago confirmado, servidor de licencias y entrega automática. No pongas ADMIN_TOKEN en archivos de `public/`.
