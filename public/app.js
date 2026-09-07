document.addEventListener("DOMContentLoaded", () => {

  const modal = document.querySelector("#modal");
  const buy = document.querySelector("#buy");
  const close = document.querySelector("#close");
  const form = document.querySelector("#form");
  const result = document.querySelector("#result");
  const price = document.querySelector("#price");

  // Abrir ventana de compra
  if (buy && modal) {
    buy.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.add("open");
    });
  }

  // Cerrar ventana
  if (close && modal) {
    close.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  // Cerrar al hacer clic fuera de la ventana
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("open");
      }
    });
  }

  // Obtener precio desde el servidor
  fetch("/api/config")
    .then(response => {
      if (!response.ok) {
        throw new Error("Error al obtener configuración");
      }
      return response.json();
    })
    .then(data => {
      if (price && data.price) {
        price.textContent = Number(data.price).toFixed(2);
      }
    })
    .catch(error => {
      console.error("Error de configuración:", error);
    });

  // Procesar formulario de compra
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (result) {
        result.textContent = "Preparando pedido...";
      }

      try {

        const formData = new FormData(form);

        const response = await fetch("/api/order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(
            Object.fromEntries(formData.entries())
          )
        });

        const data = await response.json();

        if (result) {
          result.textContent =
            data.message || "Pedido preparado correctamente.";
        }

      } catch (error) {

        console.error("Error:", error);

        if (result) {
          result.textContent =
            "No se pudo preparar el pedido.";
        }
      }
    });
  }

});
