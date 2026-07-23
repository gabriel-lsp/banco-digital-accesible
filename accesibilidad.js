"use strict";

(function(){
  const CLAVES = {
    contraste:"bda-accesibilidad-contraste",
    texto:"bda-accesibilidad-texto-nivel",
    textoAnterior:"bda-accesibilidad-texto-grande",
    fuente:"bda-accesibilidad-fuente-legible",
    espaciado:"bda-accesibilidad-espaciado-amplio",
    enlaces:"bda-accesibilidad-enlaces-resaltados",
    grises:"bda-accesibilidad-escala-grises",
    movimiento:"bda-accesibilidad-reducir-movimiento"
  };

  const pasosBase = [
    { selector:".navegacion, .navegacion-bda-hero", titulo:"Navegación principal", texto:"En esta zona puedes regresar al Banco Digital Accesible, volver al inicio principal o abrir el contacto institucional." },
    { selector:".portada, .presentacion-bda-hero", titulo:"Portada del módulo", texto:"Aquí se presenta la identidad del recurso y una breve descripción de su finalidad educativa." },
    { selector:".hero-busqueda, .panel-busqueda, .panel-biblioteca", titulo:"Área de consulta", texto:"Este bloque reúne las opciones principales de búsqueda, filtros, accesos o presentación del contenido disponible." },
    { selector:".grid-materiales, .galeria, .lista-tarjetas, .lista-recursos, #lista-biblioteca, #lista-gutendex, .pagina-teoria", titulo:"Resultados o contenido", texto:"En esta sección aparecen los módulos, recursos, señas, signos, libros o contenidos que puedes revisar." },
    { selector:".footer-crebe", titulo:"Pie de página institucional", texto:"Al final encontrarás enlaces relacionados, contacto y reconocimiento de autoría del desarrollo original." }
  ];

  let panel = null;
  let botonAbrir = null;
  let resaltado = null;
  let cajaGuia = null;
  let pasosActivos = [];
  let indicePaso = 0;
  let lecturaActiva = false;
  let fragmentosLectura = [];
  let indiceLectura = 0;

  document.addEventListener("DOMContentLoaded", iniciarAccesibilidad);

  function obtener(clave){
    try{return localStorage.getItem(clave);}catch(error){return null;}
  }

  function guardar(clave, valor){
    try{localStorage.setItem(clave, valor);}catch(error){/* Funciona durante la sesión. */}
  }

  function eliminar(clave){
    try{localStorage.removeItem(clave);}catch(error){/* Sin persistencia. */}
  }

  function iniciarAccesibilidad(){
    if(document.documentElement.dataset.bdaAccesibilidadInicializada === "true") return;
    document.documentElement.dataset.bdaAccesibilidadInicializada = "true";
    document.documentElement.classList.add("js-activo");
    reforzarEstructuraBase();
    migrarPreferenciasAnteriores();
    aplicarPreferenciasGuardadas();
    crearPanelAccesibilidad();
    prepararEventosGlobales();
  }

  function reforzarEstructuraBase(){
    if(!document.documentElement.lang) document.documentElement.lang = "es";

    let principal = document.querySelector("main");
    if(principal && !principal.id) principal.id = "contenido-principal";

    if(principal && !document.querySelector(".salto-contenido")){
      const salto = document.createElement("a");
      salto.className = "salto-contenido";
      salto.href = `#${principal.id}`;
      salto.textContent = "Ir al contenido";
      document.body.prepend(salto);
    }

    document.querySelectorAll('a[target="_blank"]').forEach(enlace => {
      const valores = new Set((enlace.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
      valores.add("noopener");
      valores.add("noreferrer");
      enlace.setAttribute("rel", Array.from(valores).join(" "));
    });

    document.querySelectorAll("iframe:not([title])").forEach((marco, indice) => {
      marco.title = marco.getAttribute("aria-label") || `Contenido integrado ${indice + 1}`;
    });

    const actual = new URL(window.location.href);
    document.querySelectorAll("nav a[href]").forEach(enlace => {
      try{
        const destino = new URL(enlace.href, actual);
        if(destino.origin === actual.origin && destino.pathname.replace(/index\.html$/,"") === actual.pathname.replace(/index\.html$/, "")){
          enlace.setAttribute("aria-current","page");
        }
      }catch(error){/* Dirección no válida. */}
    });
  }

  function migrarPreferenciasAnteriores(){
    if(!obtener(CLAVES.texto) && obtener(CLAVES.textoAnterior) === "true"){
      guardar(CLAVES.texto,"grande");
      eliminar(CLAVES.textoAnterior);
    }
  }

  function estadoBooleano(clave){return obtener(clave) === "true";}

  function aplicarPreferenciasGuardadas(){
    const body = document.body;
    const html = document.documentElement;
    const nivelTexto = obtener(CLAVES.texto) || "normal";

    body.classList.toggle("modo-contraste", estadoBooleano(CLAVES.contraste));
    body.classList.toggle("fuente-legible", estadoBooleano(CLAVES.fuente));
    body.classList.toggle("espaciado-amplio", estadoBooleano(CLAVES.espaciado));
    body.classList.toggle("enlaces-resaltados", estadoBooleano(CLAVES.enlaces));
    html.classList.toggle("escala-grises", estadoBooleano(CLAVES.grises));
    html.classList.toggle("reducir-movimiento", estadoBooleano(CLAVES.movimiento));
    html.classList.remove("texto-grande","texto-muy-grande");
    if(nivelTexto === "grande") html.classList.add("texto-grande");
    if(nivelTexto === "muy-grande") html.classList.add("texto-muy-grande");
  }

  function crearAnunciador(){
    let anunciador = document.querySelector("#bda-anunciador-accesibilidad");
    if(anunciador) return anunciador;
    anunciador = document.createElement("div");
    anunciador.id = "bda-anunciador-accesibilidad";
    anunciador.className = "solo-lectores";
    anunciador.setAttribute("aria-live","polite");
    anunciador.setAttribute("aria-atomic","true");
    document.body.appendChild(anunciador);
    return anunciador;
  }

  function anunciar(mensaje){
    const anunciador = crearAnunciador();
    anunciador.textContent = "";
    window.setTimeout(() => {anunciador.textContent = mensaje;},30);
  }

  function crearPanelAccesibilidad(){
    if(document.querySelector(".control-accesibilidad")) return;

    const contenedor = document.createElement("div");
    contenedor.className = "control-accesibilidad";
    contenedor.setAttribute("aria-label","Opciones de accesibilidad");

    botonAbrir = document.createElement("button");
    botonAbrir.className = "boton-accesibilidad";
    botonAbrir.type = "button";
    botonAbrir.setAttribute("aria-expanded","false");
    botonAbrir.setAttribute("aria-controls","panel-accesibilidad-bda");
    botonAbrir.textContent = "Accesibilidad";

    panel = document.createElement("section");
    panel.id = "panel-accesibilidad-bda";
    panel.className = "panel-accesibilidad";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby","titulo-panel-accesibilidad-bda");

    panel.innerHTML = `
      <h2 id="titulo-panel-accesibilidad-bda">Opciones de accesibilidad</h2>
      <p>Personaliza la lectura y visualización. Las preferencias se guardan en este dispositivo.</p>
      <div class="opciones-accesibilidad">
        <button class="opcion-accesibilidad" type="button" data-accion="contraste" aria-pressed="false">Alto contraste</button>
        <button class="opcion-accesibilidad" type="button" data-accion="texto" aria-pressed="false">Texto grande</button>
        <button class="opcion-accesibilidad" type="button" data-accion="fuente" aria-pressed="false">Fuente legible</button>
        <button class="opcion-accesibilidad" type="button" data-accion="espaciado" aria-pressed="false">Espaciado amplio</button>
        <button class="opcion-accesibilidad" type="button" data-accion="enlaces" aria-pressed="false">Resaltar enlaces</button>
        <button class="opcion-accesibilidad" type="button" data-accion="grises" aria-pressed="false">Escala de grises</button>
        <button class="opcion-accesibilidad" type="button" data-accion="movimiento" aria-pressed="false">Reducir movimiento</button>
        <button class="opcion-accesibilidad" type="button" data-accion="lectura" aria-pressed="false">Leer página</button>
        <button class="opcion-accesibilidad" type="button" data-accion="recorrido">Iniciar recorrido</button>
        <button class="opcion-accesibilidad opcion-restablecer" type="button" data-accion="restablecer">Restablecer</button>
      </div>
    `;

    contenedor.appendChild(panel);
    contenedor.appendChild(botonAbrir);
    document.body.appendChild(contenedor);

    const botonLectura = panel.querySelector('[data-accion="lectura"]');
    if(!("speechSynthesis" in window)) botonLectura.disabled = true;

    actualizarEstadoBotones();

    botonAbrir.addEventListener("click", () => {
      const abierto = panel.hidden;
      panel.hidden = !abierto;
      botonAbrir.setAttribute("aria-expanded", String(abierto));
      if(abierto) panel.querySelector("button")?.focus();
    });

    panel.addEventListener("click", (evento) => {
      const boton = evento.target.closest("button[data-accion]");
      if(!boton) return;
      const accion = boton.dataset.accion;
      if(accion === "contraste") alternarBooleano(CLAVES.contraste,"modo-contraste","Alto contraste",document.body);
      if(accion === "texto") alternarTexto();
      if(accion === "fuente") alternarBooleano(CLAVES.fuente,"fuente-legible","Fuente legible",document.body);
      if(accion === "espaciado") alternarBooleano(CLAVES.espaciado,"espaciado-amplio","Espaciado amplio",document.body);
      if(accion === "enlaces") alternarBooleano(CLAVES.enlaces,"enlaces-resaltados","Resaltado de enlaces",document.body);
      if(accion === "grises") alternarBooleano(CLAVES.grises,"escala-grises","Escala de grises",document.documentElement);
      if(accion === "movimiento") alternarBooleano(CLAVES.movimiento,"reducir-movimiento","Reducción de movimiento",document.documentElement);
      if(accion === "lectura") alternarLectura();
      if(accion === "recorrido") iniciarRecorrido();
      if(accion === "restablecer") restablecerAccesibilidad();
    });
  }

  function alternarBooleano(clave, clase, etiqueta, elemento){
    const activo = !elemento.classList.contains(clase);
    elemento.classList.toggle(clase,activo);
    guardar(clave,String(activo));
    actualizarEstadoBotones();
    anunciar(`${etiqueta}: ${activo ? "activado" : "desactivado"}.`);
  }

  function alternarTexto(){
    const actual = obtener(CLAVES.texto) || "normal";
    const nuevo = actual === "normal" ? "grande" : actual === "grande" ? "muy-grande" : "normal";
    guardar(CLAVES.texto,nuevo);
    aplicarPreferenciasGuardadas();
    actualizarEstadoBotones();
    anunciar(nuevo === "normal" ? "Tamaño de texto normal." : nuevo === "grande" ? "Texto grande activado." : "Texto muy grande activado.");
  }

  function restablecerAccesibilidad(){
    Object.values(CLAVES).forEach(eliminar);
    document.body.classList.remove("modo-contraste","fuente-legible","espaciado-amplio","enlaces-resaltados");
    document.documentElement.classList.remove("texto-grande","texto-muy-grande","escala-grises","reducir-movimiento");
    detenerLectura(false);
    cerrarRecorrido();
    actualizarEstadoBotones();
    anunciar("Se restablecieron las opciones de accesibilidad.");
  }

  function actualizarEstadoBotones(){
    if(!panel) return;
    const nivelTexto = obtener(CLAVES.texto) || "normal";
    const estados = {
      contraste:document.body.classList.contains("modo-contraste"),
      texto:nivelTexto !== "normal",
      fuente:document.body.classList.contains("fuente-legible"),
      espaciado:document.body.classList.contains("espaciado-amplio"),
      enlaces:document.body.classList.contains("enlaces-resaltados"),
      grises:document.documentElement.classList.contains("escala-grises"),
      movimiento:document.documentElement.classList.contains("reducir-movimiento")
    };

    Object.entries(estados).forEach(([accion,activo]) => {
      panel.querySelector(`[data-accion="${accion}"]`)?.setAttribute("aria-pressed",String(activo));
    });

    const botonTexto = panel.querySelector('[data-accion="texto"]');
    if(botonTexto) botonTexto.textContent = nivelTexto === "normal" ? "Texto grande" : nivelTexto === "grande" ? "Texto muy grande" : "Texto normal";
  }

  function obtenerTextoLectura(){
    const principal = document.querySelector("main") || document.body;
    const copia = principal.cloneNode(true);
    copia.querySelectorAll("script,style,noscript,[hidden],[aria-hidden='true'],.control-accesibilidad,.solo-lectores").forEach(nodo => nodo.remove());
    return (copia.innerText || copia.textContent || "").replace(/\s+/g," ").trim();
  }

  function dividirTexto(texto, limite){
    const oraciones = texto.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [texto];
    const partes = [];
    let actual = "";
    oraciones.forEach(oracion => {
      const limpia = oracion.trim();
      if(!limpia) return;
      if((actual + " " + limpia).trim().length <= limite){
        actual = (actual + " " + limpia).trim();
      }else{
        if(actual) partes.push(actual);
        if(limpia.length <= limite){actual = limpia;}
        else{
          for(let i=0;i<limpia.length;i+=limite) partes.push(limpia.slice(i,i+limite));
          actual = "";
        }
      }
    });
    if(actual) partes.push(actual);
    return partes;
  }

  function alternarLectura(){
    if(!("speechSynthesis" in window)){
      anunciar("La lectura en voz alta no está disponible en este navegador.");
      return;
    }
    if(lecturaActiva){detenerLectura();return;}
    const texto = obtenerTextoLectura();
    if(!texto){anunciar("No se encontró contenido para leer.");return;}
    fragmentosLectura = dividirTexto(texto,220);
    indiceLectura = 0;
    lecturaActiva = true;
    const boton = panel.querySelector('[data-accion="lectura"]');
    boton.textContent = "Detener lectura";
    boton.setAttribute("aria-pressed","true");
    anunciar("Lectura en voz alta iniciada.");
    reproducirSiguiente();
  }

  function reproducirSiguiente(){
    if(!lecturaActiva || indiceLectura >= fragmentosLectura.length){
      detenerLectura(false);
      anunciar("Lectura finalizada.");
      return;
    }
    const voz = new SpeechSynthesisUtterance(fragmentosLectura[indiceLectura]);
    voz.lang = "es-PE";
    voz.rate = .95;
    voz.onend = () => {indiceLectura += 1;reproducirSiguiente();};
    voz.onerror = () => detenerLectura(false);
    window.speechSynthesis.speak(voz);
  }

  function detenerLectura(anunciarEstado){
    if("speechSynthesis" in window) window.speechSynthesis.cancel();
    lecturaActiva = false;
    fragmentosLectura = [];
    indiceLectura = 0;
    const boton = panel?.querySelector('[data-accion="lectura"]');
    if(boton){boton.textContent = "Leer página";boton.setAttribute("aria-pressed","false");}
    if(anunciarEstado !== false) anunciar("Lectura detenida.");
  }

  function obtenerPasos(){
    const pasos = [];
    pasosBase.forEach((paso) => {
      const elemento = document.querySelector(paso.selector);
      if(elemento && elemento.offsetParent !== null) pasos.push({...paso,elemento});
    });
    document.querySelectorAll("[data-guia-titulo], [data-guia-texto]").forEach((elemento) => {
      if(elemento.offsetParent === null || pasos.some((paso) => paso.elemento === elemento)) return;
      pasos.push({elemento,titulo:elemento.dataset.guiaTitulo || "Sección de la página",texto:elemento.dataset.guiaTexto || "Revisa este bloque para conocer mejor el contenido disponible."});
    });
    return pasos;
  }

  function iniciarRecorrido(){
    pasosActivos = obtenerPasos();
    if(!pasosActivos.length){anunciar("No se encontraron secciones para el recorrido.");return;}
    panel.hidden = true;
    botonAbrir.setAttribute("aria-expanded","false");
    indicePaso = 0;
    crearElementosGuia();
    mostrarPaso();
  }

  function crearElementosGuia(){
    cerrarRecorrido();
    resaltado = document.createElement("div");
    resaltado.className = "guia-resaltado";
    resaltado.setAttribute("aria-hidden","true");
    cajaGuia = document.createElement("section");
    cajaGuia.className = "caja-guia";
    cajaGuia.setAttribute("role","dialog");
    cajaGuia.setAttribute("aria-modal","true");
    cajaGuia.setAttribute("aria-live","polite");
    document.body.append(resaltado,cajaGuia);
  }

  function mostrarPaso(){
    const paso = pasosActivos[indicePaso];
    if(!paso || !resaltado || !cajaGuia) return;
    const reducir = document.documentElement.classList.contains("reducir-movimiento") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    paso.elemento.scrollIntoView({behavior:reducir ? "auto" : "smooth",block:"center",inline:"nearest"});
    window.setTimeout(() => {posicionarResaltado(paso.elemento);posicionarCaja(paso.elemento);},reducir ? 0 : 220);
    cajaGuia.innerHTML = `<p class="guia-progreso">Paso ${indicePaso + 1} de ${pasosActivos.length}</p><h2>${escaparHtml(paso.titulo)}</h2><p>${escaparHtml(paso.texto)}</p><div class="controles-guia"><button type="button" data-tour="anterior" ${indicePaso === 0 ? "disabled" : ""}>Anterior</button><button type="button" data-tour="cerrar">Cerrar</button><button type="button" data-tour="siguiente">${indicePaso === pasosActivos.length - 1 ? "Finalizar" : "Siguiente"}</button></div>`;
    cajaGuia.querySelector('[data-tour="siguiente"]')?.focus({preventScroll:true});
  }

  function posicionarResaltado(elemento){
    const rect = elemento.getBoundingClientRect();
    const margen = 8;
    resaltado.style.top = `${Math.max(rect.top-margen,8)}px`;
    resaltado.style.left = `${Math.max(rect.left-margen,8)}px`;
    resaltado.style.width = `${Math.min(rect.width+margen*2,window.innerWidth-16)}px`;
    resaltado.style.height = `${Math.min(rect.height+margen*2,window.innerHeight-16)}px`;
  }

  function posicionarCaja(elemento){
    const rect = elemento.getBoundingClientRect();
    const espacio = 14;
    const ancho = Math.min(360,window.innerWidth-32);
    const altoEstimado = 220;
    let top = rect.bottom + espacio;
    const left = Math.min(Math.max(rect.left,16),window.innerWidth-ancho-16);
    if(top+altoEstimado>window.innerHeight) top=Math.max(16,rect.top-altoEstimado-espacio);
    cajaGuia.style.top = `${top}px`;
    cajaGuia.style.left = `${left}px`;
  }

  function avanzarPaso(){if(indicePaso>=pasosActivos.length-1){cerrarRecorrido();return;}indicePaso+=1;mostrarPaso();}
  function retrocederPaso(){if(indicePaso<=0)return;indicePaso-=1;mostrarPaso();}
  function cerrarRecorrido(){resaltado?.remove();cajaGuia?.remove();resaltado=null;cajaGuia=null;}

  function prepararEventosGlobales(){
    document.addEventListener("click", (evento) => {
      const botonTour = evento.target.closest("button[data-tour]");
      if(botonTour){
        const accion = botonTour.dataset.tour;
        if(accion === "anterior") retrocederPaso();
        if(accion === "siguiente") avanzarPaso();
        if(accion === "cerrar") cerrarRecorrido();
        return;
      }
      if(panel && botonAbrir && !panel.hidden && !panel.contains(evento.target) && evento.target !== botonAbrir){
        panel.hidden = true;
        botonAbrir.setAttribute("aria-expanded","false");
      }
    });

    document.addEventListener("keydown", (evento) => {
      if(evento.altKey && evento.shiftKey && evento.key.toLowerCase() === "a"){
        evento.preventDefault();
        botonAbrir?.click();
      }
      if(evento.key === "Escape"){
        if(lecturaActiva) detenerLectura();
        if(cajaGuia) cerrarRecorrido();
        if(panel && !panel.hidden){panel.hidden=true;botonAbrir.setAttribute("aria-expanded","false");botonAbrir.focus();}
      }
      if(cajaGuia && evento.key === "ArrowRight") avanzarPaso();
      if(cajaGuia && evento.key === "ArrowLeft") retrocederPaso();
    });

    window.addEventListener("resize",reposicionarGuia);
    window.addEventListener("scroll",reposicionarGuia,{passive:true});
    window.addEventListener("beforeunload",() => {if("speechSynthesis" in window) window.speechSynthesis.cancel();});
  }

  function reposicionarGuia(){
    if(!cajaGuia || !resaltado || !pasosActivos[indicePaso]) return;
    const elemento = pasosActivos[indicePaso].elemento;
    posicionarResaltado(elemento);
    posicionarCaja(elemento);
  }

  function escaparHtml(texto){const div=document.createElement("div");div.textContent=texto;return div.innerHTML;}
})();