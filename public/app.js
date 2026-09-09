const modal=document.querySelector("#modal"),buy=document.querySelector("#buy"),close=document.querySelector("#close"),form=document.querySelector("#form"),result=document.querySelector("#result");buy.onclick=()=>modal.classList.add("open");close.onclick=()=>modal.classList.remove("open");modal.onclick=e=>{if(e.target===modal)modal.classList.remove("open")};fetch("/api/config").then(r=>r.json()).then(c=>{if(c.price)document.querySelector("#price").textContent=Number(c.price).toFixed(2)});

form.onsubmit=async e=>{
  e.preventDefault();
  result.textContent="Preparando pedido...";

  try{
    const r=await fetch("/api/order",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(Object.fromEntries(new FormData(form)))
    });

    const j=await r.json();

    if(j.ok&&j.order){
      document.querySelector("#order-number").textContent=j.order.id;

      document.querySelector("#modal").classList.remove("open");
      document.querySelector("#order-modal").classList.add("open");

      result.textContent="";
    }else{
      result.textContent=j.message||"No se pudo crear el pedido.";
    }

  }catch(x){
    result.textContent="No se pudo preparar el pedido.";
  }
};

const orderModal=document.querySelector("#order-modal");
const goConsult=document.querySelector("#go-consult");

goConsult.onclick=()=>{
  orderModal.classList.remove("open");
  modal.classList.remove("open");
};

const btnPlin=document.querySelector("#btn-plin");
const paymentPopup=document.querySelector("#payment-popup");
const paymentPopupClose=document.querySelector("#payment-popup-close");
const paymentDone=document.querySelector("#payment-done");

btnPlin.onclick=()=>{
  paymentPopup.classList.add("open");
};

paymentPopupClose.onclick=()=>{
  paymentPopup.classList.remove("open");
};

paymentDone.onclick=()=>{
  paymentPopup.classList.remove("open");
  form.requestSubmit();
};

paymentPopup.onclick=e=>{
  if(e.target===paymentPopup){
    paymentPopup.classList.remove("open");
  }
};

const consultOrder = document.querySelector("#consult-order");
const orderIdInput = document.querySelector("#order-id");
const orderResult = document.querySelector("#order-result");

function mostrarVentana(titulo, contenido) {
  const modal = document.createElement("div");

  modal.className = "modal open";

  modal.innerHTML = `
    <div class="box" style="max-width:480px;text-align:center;">

      <button
        type="button"
        class="popup-close"
        style="
          float:right;
          font-size:28px;
          border:0;
          background:none;
          cursor:pointer;
        "
      >
        ×
      </button>

      <label>CONSULTA DE COMPRA</label>

      <h2>${titulo}</h2>

      <div class="popup-content">
        ${contenido}
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".popup-close").onclick = () => {
    modal.remove();
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };

  return modal;
}


consultOrder.onclick = async () => {

  const orderId = orderIdInput.value.trim();

  if (!orderId) {
    mostrarVentana(
      "Ingresa tu pedido",
      `
        <p>Debes ingresar tu número de pedido para continuar.</p>
      `
    );
    return;
  }

  orderResult.textContent = "";

  try {

    const r = await fetch(
      `/api/order-status/${encodeURIComponent(orderId)}`
    );

    const j = await r.json();

    if (!j.ok) {
      mostrarVentana(
        "Pedido no encontrado",
        `
          <p>${j.message || "No encontramos ese pedido."}</p>
        `
      );
      return;
    }


    if (j.order.status !== "aprobado") {

      mostrarVentana(
        "Pedido pendiente",
        `
          <div style="font-size:45px;">🟡</div>

          <h3>Pedido pendiente de pago</h3>

          <p>
            Tu pedido todavía está pendiente de aprobación.
          </p>

          <p>
            Cuando se confirme tu pago podrás volver a consultar
            para obtener tu licencia y descargar Calendario Ruster.
          </p>
        `
      );

      return;
    }


    // PEDIDO APROBADO → VENTANA PARA CORREO

    const emailModal = mostrarVentana(
      "Pedido aprobado",
      `
        <div style="font-size:45px;">🟢</div>

        <p>
          Tu pedido está aprobado.
        </p>

        <p>
          Ingresa el correo utilizado durante tu compra.
        </p>

        <input
          type="email"
          id="popup-access-email"
          placeholder="Tu correo electrónico"
          style="
            width:100%;
            box-sizing:border-box;
            margin:10px 0;
          "
        >

        <button
          type="button"
          id="popup-verify"
          class="btn primary"
        >
          Verificar mi compra
        </button>

        <div
          id="popup-access-result"
          style="margin-top:12px;"
        ></div>
      `
    );


    const verifyButton =
      emailModal.querySelector("#popup-verify");

    const emailInput =
      emailModal.querySelector("#popup-access-email");

    const accessResult =
      emailModal.querySelector("#popup-access-result");


    verifyButton.onclick = async () => {

      const email = emailInput.value.trim();

      if (!email) {
        accessResult.textContent =
          "Ingresa el correo utilizado en la compra.";
        return;
      }

      verifyButton.disabled = true;
      verifyButton.textContent = "Verificando...";
      accessResult.textContent = "";


      try {

        const accessResponse = await fetch(
          "/api/order-access",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              orderId,
              email
            })
          }
        );


        const accessData =
          await accessResponse.json();


        if (!accessData.ok) {

          verifyButton.disabled = false;
          verifyButton.textContent = "Verificar mi compra";

          accessResult.textContent =
            accessData.message ||
            "No se pudo verificar la compra.";

          return;
        }


        // CERRAMOS VENTANA DEL CORREO

        emailModal.remove();


        // MOSTRAMOS VENTANA FINAL

        const deliveryModal = mostrarVentana(
          "¡Compra verificada!",
          `
            <div style="font-size:45px;">🟢</div>

            <p>
              Tu Calendario Ruster está listo.
            </p>

            <div style="
              margin:20px 0;
              padding:18px;
              border-radius:12px;
              background:#f4f4f8;
            ">

              <small>LICENCIA</small>

              <div
                id="popup-license"
                style="
                  margin-top:8px;
                  font-size:20px;
                  font-weight:700;
                  word-break:break-all;
                "
              ></div>

            </div>

            <a
              id="popup-download"
              class="btn primary"
              target="_blank"
              rel="noopener"
            >
              Descargar Calendario Ruster
            </a>

            <p style="font-size:13px;margin-top:15px;">
              El enlace de descarga es válido por 48 horas.
            </p>
          `
        );


        deliveryModal.querySelector("#popup-license").textContent =
          accessData.licenseCode;

        deliveryModal.querySelector("#popup-download").href =
          accessData.downloadUrl;


      } catch (error) {

        verifyButton.disabled = false;
        verifyButton.textContent = "Verificar mi compra";

        accessResult.textContent =
          "No se pudo verificar la compra.";
      }
    };

  } catch (error) {

    mostrarVentana(
      "Error",
      `
        <p>No se pudo consultar el pedido.</p>
      `
    );
  }
};
