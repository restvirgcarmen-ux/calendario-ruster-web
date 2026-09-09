const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      product TEXT NOT NULL,
      price TEXT NOT NULL,
      currency TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL,
      operation_code TEXT,
      license_code TEXT,
      download_token TEXT,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  console.log("Tabla orders lista.");
}

const app = express();

const PORT = process.env.PORT || 3000;
const APK_URL =
  process.env.APK_URL || "/downloads/calendario-ruster.apk";
const PRICE = process.env.PRODUCT_PRICE || "29.90";
const CURRENCY = process.env.CURRENCY || "PEN";
// Datos de pago
const YAPE_NUMBER = process.env.YAPE_NUMBER || "";
const PLIN_NUMBER = process.env.PLIN_NUMBER || "";
// Seguridad del panel de administración
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

// Pedidos temporales
const orders = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

// Prueba de conexión con PostgreSQL
app.get("/api/db-test", async (req, res) => {
  const token = req.query.token;

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado."
    });
  }

  try {
    const result = await pool.query("SELECT NOW() AS ahora");

    res.json({
      ok: true,
      message: "Conexión con PostgreSQL correcta.",
      databaseTime: result.rows[0].ahora
    });
  } catch (error) {
    console.error("Error PostgreSQL:", error);

    res.status(500).json({
      ok: false,
      message: "No se pudo conectar con PostgreSQL."
    });
  }
});

// Configuración de la tienda
app.get("/api/config", (req, res) => {
  res.json({
    ok: true,
    product: "Calendario Ruster",
    price: PRICE,
    currency: CURRENCY,
    apkUrl: APK_URL,
    paymentMethods: {
      yape: Boolean(YAPE_NUMBER),
      plin: Boolean(PLIN_NUMBER)
    }
  });
});

// Crear pedido
app.post("/api/order", async (req, res) => {
  const { name, email, paymentMethod } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({
      ok: false,
      message: "Faltan datos del comprador."
    });
  }

  const method = String(paymentMethod || "")
    .trim()
    .toLowerCase();

  if (method !== "yape" && method !== "plin") {
    return res.status(400).json({
      ok: false,
      message: "Selecciona Yape o Plin."
    });
  }

  const now = new Date();

  const datePart = now
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const timePart = Date.now().toString().slice(-6);

  const orderId = `RUS-${datePart}-${timePart}`;

  const order = {
    id: orderId,
    name: String(name).trim(),
    email: String(email).trim(),
    product: "Calendario Ruster",
    price: PRICE,
    currency: CURRENCY,
    paymentMethod: method,
    status: "pendiente_pago",
    operationCode: null,
    createdAt: now.toISOString()
  };

  try {
    await pool.query(
      `
      INSERT INTO orders (
        id,
        name,
        email,
        product,
        price,
        currency,
        payment_method,
        status,
        operation_code,
        license_code,
        download_token,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        order.id,
        order.name,
        order.email,
        order.product,
        order.price,
        order.currency,
        order.paymentMethod,
        order.status,
        order.operationCode,
        null,
        null,
        order.createdAt
      ]
    );

    // También mantenemos el pedido en memoria temporalmente
    orders.set(orderId, order);

    res.json({
      ok: true,
      status: order.status,
      message: "Pedido creado correctamente.",
      order: {
        id: order.id,
        product: order.product,
        price: order.price,
        currency: order.currency,
        paymentMethod: order.paymentMethod
      }
    });

  } catch (error) {
    console.error("Error guardando pedido:", error);

    res.status(500).json({
      ok: false,
      message: "No se pudo guardar el pedido."
    });
  }
});

// API del panel de administración
app.get("/api/admin/orders", async (req, res) => {
  const token = req.query.token;

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado."
    });
  }

  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        email,
        product,
        price,
        currency,
        payment_method AS "paymentMethod",
        status,
        operation_code AS "operationCode",
        license_code AS "licenseCode",
        download_token AS "downloadToken",
        created_at AS "createdAt"
      FROM orders
      WHERE status = 'pendiente_pago'
      ORDER BY created_at DESC
    `);

    res.json({
      ok: true,
      orders: result.rows
    });

  } catch (error) {
    console.error("Error obteniendo pedidos:", error);

    res.status(500).json({
      ok: false,
      message: "No se pudieron obtener los pedidos."
    });
  }
});

// Aprobar pedido
app.post("/api/admin/orders/:id/approve", async (req, res) => {
  const token = req.query.token;

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado."
    });
  }

  const orderId = req.params.id;

  try {
    const result = await pool.query(
      `
      UPDATE orders
      SET status = 'aprobado'
      WHERE id = $1
        AND status = 'pendiente_pago'
      RETURNING
        id,
        name,
        email,
        product,
        price,
        currency,
        payment_method AS "paymentMethod",
        status,
        operation_code AS "operationCode",
        license_code AS "licenseCode",
        download_token AS "downloadToken",
        created_at AS "createdAt"
      `,
      [orderId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Pedido no encontrado o ya fue procesado."
      });
    }

    res.json({
      ok: true,
      message: "Pedido aprobado correctamente.",
      order: result.rows[0]
    });

  } catch (error) {
    console.error("Error aprobando pedido:", error);

    res.status(500).json({
      ok: false,
      message: "No se pudo aprobar el pedido."
    });
  }
});

// Consultar pedido
app.get("/api/order/:id", (req, res) => {
  const order = orders.get(req.params.id);

  if (!order) {
    return res.status(404).json({
      ok: false,
      message: "Pedido no encontrado."
    });
  }

  res.json({
    ok: true,
    order
  });
});

// Ruta de descarga
app.get("/download", (req, res) => {
  res.redirect(APK_URL);
});

// Página principal
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        "Calendario Ruster Store en puerto " + PORT
      );
    });
  })
  .catch((error) => {
    console.error("Error inicializando PostgreSQL:", error);
    process.exit(1);
  });
