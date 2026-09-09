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

consultOrder.onclick = async () => {
  const orderId = orderIdInput.value.trim();

  if (!orderId) {
    orderResult.textContent = "Ingresa tu número de pedido.";
    return;
  }

  orderResult.textContent = "Consultando...";

  try {
    const r = await fetch(
      `/api/order-status/${encodeURIComponent(orderId)}`
    );

    const j = await r.json();

    if (!j.ok) {
      orderResult.textContent =
        j.message || "No encontramos ese pedido.";
      return;
    }

    if (j.order.status !== "aprobado") {
      orderResult.textContent =
        "🟡 Pedido pendiente de pago.";
      return;
    }

    orderResult.innerHTML = `
      <div style="margin-top:15px;">
        🟢 <strong>Pedido aprobado.</strong>
        <p>Ingresa el correo utilizado en tu compra.</p>

        <input
          type="email"
          id="access-email"
          placeholder="Tu correo electrónico"
          style="width:100%;margin-bottom:10px;"
        >

        <button
          class="btn primary"
          id="verify-purchase"
          type="button"
        >
          Verificar mi compra
        </button>

        <div id="access-result"></div>
      </div>
    `;

    const verifyPurchase =
      document.querySelector("#verify-purchase");

    verifyPurchase.onclick = async () => {
      const email =
        document.querySelector("#access-email").value.trim();

      const accessResult =
        document.querySelector("#access-result");

      if (!email) {
        accessResult.textContent =
          "Ingresa el correo utilizado en la compra.";
        return;
      }

      accessResult.textContent = "Verificando...";

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
          accessResult.textContent =
            accessData.message ||
            "No se pudo verificar la compra.";
          return;
        }

        accessResult.innerHTML = `
          <div style="margin-top:15px;">
            🟢 <strong>Compra verificada.</strong>

            <p>
              Licencia:
              <strong>${accessData.licenseCode}</strong>
            </p>

            <a
              class="btn primary"
              href="${accessData.downloadUrl}"
            >
              Descargar Calendario Ruster
            </a>
          </div>
        `;

      } catch (error) {
        accessResult.textContent =
          "No se pudo verificar la compra.";
      }
    };

  } catch (error) {
    orderResult.textContent =
      "No se pudo consultar el pedido.";
  }
};
