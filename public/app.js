const modal = document.querySelector("#modal");
const buy = document.querySelector("#buy");
const close = document.querySelector("#close");
const form = document.querySelector("#form");
const result = document.querySelector("#result");

// Abrir ventana de compra
buy.onclick = () => {
  modal.classList.add("open");
};

// Cerrar ventana de compra
close.onclick = () => {
  modal.classList.remove("open");
};

// Cerrar haciendo clic fuera de la ventana
modal.onclick = (e) => {
  if (e.target === modal) {
    modal.classList.remove("open");
  }
};

// Obtener configuración y precio
fetch("/api/config")
  .then((r) => r.json())
  .then((c) => {
    if (c.price) {
      document.querySelector("#price").textContent =
        Number(c.price).toFixed(2);
    }
  });

// Procesar pedido
form.onsubmit = async (e) => {
  e.preventDefault();

  result.textContent = "Preparando pedido...";

  try {
    const r = await fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        Object.fromEntries(new FormData(form))
      )
    });

    const j = await r.json();

    result.textContent = j.message || "Pedido preparado.";
  } catch (x) {
    result.textContent = "No se pudo preparar el pedido.";
  }
};
