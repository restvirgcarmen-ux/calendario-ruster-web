const modal = document.querySelector("#modal");
const buy = document.querySelector("#buy");
const close = document.querySelector("#close");
const form = document.querySelector("#form");
const result = document.querySelector("#result");

const paymentInfo = document.querySelector("#paymentInfo");
const paymentText = document.querySelector("#paymentText");
const paymentPrice = document.querySelector("#paymentPrice");
const orderId = document.querySelector("#orderId");
const newOrder = document.querySelector("#newOrder");

let config = {
  price: "29.90",
  currency: "PEN",
  paymentMethods: {
    yape: false,
    plin: false
  }
};

// Abrir ventana de compra
buy.onclick = () => {
  modal.classList.add("open");
};

// Cerrar ventana
close.onclick = () => {
  modal.classList.remove("open");
};

// Cerrar haciendo clic fuera
modal.onclick = (e) => {
  if (e.target === modal) {
    modal.classList.remove("open");
  }
};

// Obtener configuración
fetch("/api/config")
  .then((r) => r.json())
  .then((c) => {
    config = c;

    if (c.price) {
      document.querySelector("#price").textContent =
        Number(c.price).toFixed(2);

      paymentPrice.textContent =
        Number(c.price).toFixed(2);
    }
  })
  .catch(() => {
    console.log("No se pudo cargar la configuración.");
  });

// Crear pedido
form.onsubmit = async (e) => {
  e.preventDefault();

  result.textContent = "Preparando pedido...";

  const data = Object.fromEntries(
    new FormData(form)
  );

  try {

    const r = await fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const j = await r.json();

    if (!r.ok || !j.ok) {
      result.textContent =
        j.message || "No se pudo crear el pedido.";
      return;
    }

    const method = j.order.paymentMethod;

    if (method === "yape") {

      paymentText.innerHTML =
        "<strong>Yape</strong><br>" +
        "Realiza el pago al número de Yape configurado.";

    } else if (method === "plin") {

      paymentText.innerHTML =
        "<strong>Plin</strong><br>" +
        "Realiza el pago al número de Plin configurado.";

    }

    orderId.textContent = j.order.id;

    form.style.display = "none";
    paymentInfo.style.display = "block";

    result.textContent = "";

  } catch (error) {

    console.error(error);

    result.textContent =
      "No se pudo conectar con el servidor.";

  }
};

// Volver al formulario
newOrder.onclick = () => {

  form.reset();

  form.style.display = "block";
  paymentInfo.style.display = "none";

  result.textContent = "";
};
