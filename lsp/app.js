"use strict";

const BASE_ORIGINAL = "https://crebe-ucayali.github.io/banco-digital-lsp/";
const BASE_BDA = "https://crebe-ucayali.github.io/banco-digital-accesible/lsp/";
const RUTAS = [
  { url: BASE_ORIGINAL + "datos/diccionario_lsp.json", base: BASE_ORIGINAL },
  { url: "datos/diccionario_lsp.json", base: BASE_BDA },
  { url: BASE_BDA + "datos/diccionario_lsp.json", base: BASE_BDA }
];

const SECUENCIAS = {
  ave_maria: "Ave María",
  himno_nacional: "Himno Nacional",
  padre_nuestro: "Padre Nuestro"
};

const $ = (selector) => document.querySelector(selector);
const limpiarTexto = (texto) => String(texto || "")
  .toLocaleLowerCase("es")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[_-]/g, " ")
  .replace(/[^a-z0-9ñ\s]/gi, " ")
  .replace(/\s+/g, " ")
  .trim();
const nombrar = (texto) => String(texto || "").replace(/[_-]/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (letra) => letra.toLocaleUpperCase("es"));
const esSecuencia = (item) => Object.prototype.hasOwnProperty.call(SECUENCIAS, item.categoria);

const elementos = {
  busqueda: $("#busqueda"),
  categoria: $("#categoria"),
  contador: $("#contador"),
  mostrando: $("#mostrando"),
  estado: $("#estado"),
  galeria: $("#galeria"),
  cargarMas: $("#cargar-mas"),
  limpiar: $("#limpiar"),
  plantilla: $("#plantilla-tarjeta")
};

let banco = [];
let bancoSenas = [];
let bancoSecuencias = [];
let resultados = [];
let baseImagenes = BASE_ORIGINAL;
let visibles = 8;
let secuenciaActiva = "";

function rutaImagen(ruta) {
  const limpia = String(ruta || "").trim();
  if (!limpia) return "";
  if (/^https?:\/\//i.test(limpia)) return limpia;
  return baseImagenes + limpia.replace(/^\.\//, "");
}

function obtenerNumeroSecuencia(item) {
  const campos = [
    item.orden,
    item.numero,
    item.parte,
    item.paso,
    item.archivo_imagen,
    item.palabra,
    item.id
  ];

  for (const campo of campos) {
    const texto = String(campo || "");
    const coincidencia = texto.match(/(?:^|[^0-9])(\d{1,4})(?=[^0-9]|$)/);
    if (coincidencia) return Number(coincidencia[1]);
  }

  return Number.MAX_SAFE_INTEGER;
}

function compararPorSecuencia(a, b) {
  const numeroA = obtenerNumeroSecuencia(a);
  const numeroB = obtenerNumeroSecuencia(b);

  if (numeroA !== numeroB) return numeroA - numeroB;

  return String(a.archivo_imagen || a.palabra || a.id || "")
    .localeCompare(String(b.archivo_imagen || b.palabra || b.id || ""), "es", { numeric: true });
}

function asignarOrdenAleatorio() {
  bancoSenas = bancoSenas.map((item) => ({ ...item, ordenAleatorio: Math.random() }));
}

function cargarCategorias() {
  const categorias = [...new Set(bancoSenas.map((item) => item.categoria).filter(Boolean))]
    .sort((a, b) => nombrar(a).localeCompare(nombrar(b), "es"));
  elementos.categoria.innerHTML = '<option value="">Todas las categorías</option>';
  categorias.forEach((categoria) => {
    const opcion = document.createElement("option");
    opcion.value = categoria;
    opcion.textContent = nombrar(categoria);
    elementos.categoria.appendChild(opcion);
  });
}

function crearAccesosSecuencias() {
  const existente = document.querySelector("#accesos-secuencias");
  if (existente) existente.remove();
  if (!bancoSecuencias.length) return;

  const contenedor = document.createElement("div");
  contenedor.id = "accesos-secuencias";
  contenedor.className = "pestanas-secuencias";
  contenedor.setAttribute("aria-label", "Accesos a señas con secuencia determinada");

  const etiqueta = document.createElement("span");
  etiqueta.className = "solo-lectores";
  etiqueta.textContent = "Secuencias disponibles";
  contenedor.appendChild(etiqueta);

  Object.entries(SECUENCIAS).forEach(([categoria, titulo]) => {
    if (!bancoSecuencias.some((item) => item.categoria === categoria)) return;
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "pestana-secuencia";
    boton.dataset.secuencia = categoria;
    boton.textContent = titulo;
    boton.addEventListener("click", () => mostrarSecuencia(categoria));
    contenedor.appendChild(boton);
  });

  const referencia = document.querySelector(".resultado-resumen");
  referencia.parentNode.insertBefore(contenedor, referencia);
}

function obtenerPrioridadBusqueda(item, tokens, consulta) {
  if (!tokens.length) return 0;

  const palabra = limpiarTexto(item.palabra);
  const categoria = limpiarTexto(item.categoria);

  if (palabra === consulta) return 1;
  if (tokens.every((token) => palabra.includes(token))) return 2;
  if (tokens.every((token) => categoria.includes(token))) return 3;

  return 0;
}

function filtrar() {
  const consulta = limpiarTexto(elementos.busqueda.value);
  const tokens = consulta ? consulta.split(" ").filter(Boolean) : [];
  const categoria = elementos.categoria.value;

  if (secuenciaActiva) {
    resultados = bancoSecuencias
      .filter((item) => item.categoria === secuenciaActiva)
      .sort(compararPorSecuencia);
    return;
  }

  resultados = bancoSenas
    .map((item) => ({ ...item, prioridadBusqueda: obtenerPrioridadBusqueda(item, tokens, consulta) }))
    .filter((item) => {
      const coincideTexto = !tokens.length || item.prioridadBusqueda > 0;
      const coincideCategoria = !categoria || item.categoria === categoria;
      return coincideTexto && coincideCategoria;
    });

  if (!tokens.length && !categoria) {
    resultados.sort((a, b) => a.ordenAleatorio - b.ordenAleatorio);
  } else {
    resultados.sort((a, b) => {
      if (a.prioridadBusqueda !== b.prioridadBusqueda) {
        return a.prioridadBusqueda - b.prioridadBusqueda;
      }

      return String(a.palabra || "").localeCompare(String(b.palabra || ""), "es", { numeric: true });
    });
  }
}

function crearTarjeta(item) {
  const tarjeta = elementos.plantilla.content.firstElementChild.cloneNode(true);
  const imagen = tarjeta.querySelector(".imagen-sena");
  const categoria = tarjeta.querySelector(".categoria-tarjeta");
  const palabra = tarjeta.querySelector(".palabra-tarjeta");
  const descripcion = tarjeta.querySelector(".descripcion-tarjeta");
  const fuente = tarjeta.querySelector(".fuente-tarjeta");

  imagen.src = rutaImagen(item.archivo_imagen);
  imagen.alt = item.palabra ? `Representación visual de ${item.palabra} en Lengua de Señas Peruana` : "Representación visual en Lengua de Señas Peruana";
  imagen.onerror = () => {
    imagen.removeAttribute("src");
    imagen.alt = "Imagen de seña no disponible";
  };

  categoria.textContent = esSecuencia(item) ? SECUENCIAS[item.categoria] : nombrar(item.categoria);
  palabra.textContent = item.palabra || "Contenido sin título";

  if (item.descripcion) {
    descripcion.textContent = item.descripcion;
    descripcion.hidden = false;
  }

  if (item.fuente) {
    fuente.textContent = item.fuente;
    fuente.hidden = false;
  }

  return tarjeta;
}

function actualizarBotonesSecuencia() {
  document.querySelectorAll(".pestana-secuencia").forEach((boton) => {
    boton.classList.toggle("activa", boton.dataset.secuencia === secuenciaActiva);
  });
}

function renderizar() {
  filtrar();
  elementos.galeria.innerHTML = "";
  elementos.galeria.classList.toggle("galeria-secuencia", Boolean(secuenciaActiva));
  actualizarBotonesSecuencia();

  const total = resultados.length;
  const lista = resultados.slice(0, secuenciaActiva ? total : visibles);

  if (!total) {
    elementos.estado.hidden = false;
    elementos.estado.textContent = secuenciaActiva ? "No se encontraron partes para esta secuencia." : "No se encontraron señas con los criterios indicados.";
    elementos.contador.textContent = "Sin resultados";
    elementos.mostrando.textContent = "";
    elementos.cargarMas.hidden = true;
    return;
  }

  elementos.estado.hidden = true;
  const fragmento = document.createDocumentFragment();
  lista.forEach((item) => fragmento.appendChild(crearTarjeta(item)));
  elementos.galeria.appendChild(fragmento);

  if (secuenciaActiva) {
    const titulo = SECUENCIAS[secuenciaActiva] || "Secuencia";
    elementos.contador.textContent = `${titulo}: ${total} partes en orden`;
    elementos.mostrando.textContent = "Secuencia completa";
    elementos.cargarMas.hidden = true;
  } else {
    elementos.contador.textContent = total === 1 ? "1 seña encontrada" : `${total} señas encontradas`;
    elementos.mostrando.textContent = `Mostrando ${lista.length} de ${total}`;
    elementos.cargarMas.hidden = lista.length >= total;
  }
}

function mostrarSecuencia(categoria) {
  secuenciaActiva = categoria;
  visibles = 8;
  elementos.busqueda.value = "";
  elementos.categoria.value = "";
  renderizar();
}

function volverABusqueda() {
  secuenciaActiva = "";
  visibles = 8;
  renderizar();
}

async function cargarDatos() {
  let errorFinal = null;
  elementos.estado.hidden = false;
  elementos.estado.textContent = "Preparando el banco de señas…";

  for (const ruta of RUTAS) {
    try {
      const respuesta = await fetch(ruta.url, { cache: "no-store" });
      if (!respuesta.ok) throw new Error("No disponible");
      const datos = await respuesta.json();
      if (!Array.isArray(datos)) throw new Error("Formato no válido");
      banco = datos;
      bancoSenas = banco.filter((item) => !esSecuencia(item));
      bancoSecuencias = banco.filter(esSecuencia);
      asignarOrdenAleatorio();
      baseImagenes = ruta.base;
      cargarCategorias();
      crearAccesosSecuencias();
      renderizar();
      return;
    } catch (error) {
      errorFinal = error;
    }
  }

  console.error(errorFinal);
  elementos.estado.hidden = false;
  elementos.estado.textContent = "No fue posible cargar el banco original. Se requiere que el repositorio LSP original esté accesible o migrar sus datos e imágenes reales dentro de BDA.";
  elementos.contador.textContent = "Datos no disponibles";
  elementos.mostrando.textContent = "";
  elementos.cargarMas.hidden = true;
}

elementos.busqueda.addEventListener("input", () => { secuenciaActiva = ""; visibles = 8; renderizar(); });
elementos.categoria.addEventListener("change", () => { secuenciaActiva = ""; visibles = 8; renderizar(); });
elementos.limpiar.addEventListener("click", () => {
  elementos.busqueda.value = "";
  elementos.categoria.value = "";
  secuenciaActiva = "";
  visibles = 8;
  asignarOrdenAleatorio();
  renderizar();
  elementos.busqueda.focus();
});
elementos.cargarMas.addEventListener("click", () => { visibles += 8; renderizar(); });

cargarDatos();