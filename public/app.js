const modal=document.querySelector("#modal"),buy=document.querySelector("#buy"),close=document.querySelector("#close"),form=document.querySelector("#form"),result=document.querySelector("#result");buy.onclick=()=>modal.classList.add("open");close.onclick=()=>modal.classList.remove("open");modal.onclick=e=>{if(e.target===modal)modal.classList.remove("open")};fetch("/api/config").then(r=>r.json()).then(c=>{if(c.price)document.querySelector("#price").textContent=Number(c.price).toFixed(2)});form.onsubmit=async e=>{e.preventDefault();result.textContent="Preparando pedido...";try{const r=await fetch("/api/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form)))});const j=await r.json();result.textContent=j.message||"Pedido preparado."}catch(x){result.textContent="No se pudo preparar el pedido."}};
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
  result.textContent="Pago registrado. Estamos verificando tu pedido.";
};

paymentPopup.onclick=e=>{
  if(e.target===paymentPopup){
    paymentPopup.classList.remove("open");
  }
};
