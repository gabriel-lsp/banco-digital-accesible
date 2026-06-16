"use strict";

const LIMITE_INICIAL = 8;

const SECUENCIAS = [
  "padre nuestro",
  "ave maria",
  "himno nacional"
];

const NOMBRES_SECUENCIAS = {
  "padre nuestro": "Padre Nuestro",
  "ave maria": "Ave María",
  "himno nacional": "Himno Nacional"
};

const RUTAS_DICCIONARIO = [
  "datos/diccionario_lsp.json",
  "https://raw.githubusercontent.com/gabriel-lsp/banco-digital-lsp/main/datos/diccionario_lsp.json"
];

const elementos = {
  busqueda: document.querySelector("#busqueda"),
  categoria: document.querySelector("#categoria"),
  contador: document.querySelector("#contador"),
  mostrando: document.querySelector("#mostrando"),
  estado: document.querySelector("#estado"),
  galeria: document.querySelector("#galeria"),
  cargarMas: document.querySelector("#cargar-mas"),
  limpiar: document.querySelector("#limpiar"),
  plantilla: document.querySelector("#plantilla-tarjeta"),
  pestanasSecuencia: [...document.querySelectorAll(".pestana-secuencia")]
};

let banco = [];
let resultadosActuales = [];
let vistaInicialAleatoria = [];
let cantidadVisible = LIMITE_INICIAL;
let secuenciaActiva = "";

function normalizarTexto(texto) {
  return String(texto || "")
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatearCategoria(categoria) {
  return String(categoria || "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letra) => letra.toLocaleUpperCase("es"));
}

function mezclarResultados(lista) {
  return [...lista]
    .map((item) => ({ item, orden: Math.random() }))
    .sort((a, b) => a.orden - b.orden)
    .map(({ item }) => item);
}

function generarVistaInicialAleatoria() {
  vistaInicialAleatoria = mezclarResultados(
    banco.filter((item) => !esSecuencia(item))
  );
}

function obtenerCategoriaNormalizada(item) {
  return normalizarTexto(item.categoria);
}

function esSecuencia(item) {
  const categoria = obtenerCategoriaNormalizada(item);
  return SECUENCIAS.includes(categoria);
}

function coincideSecuencia(item, secuencia) {
  return obtenerCategoriaNormalizada(item) === normalizarTexto(secuencia);
}

function obtenerTextoConsultable(item) {
  return normalizarTexto(
    `${item.palabra || ""} ${item.categoria || ""} ${item.descripcion || ""}`
  );
}

function ordenarResultados(lista) {
  return [...lista].sort((a, b) => {
    const categoriaA = formatearCategoria(a.categoria);
    const categoriaB = formatearCategoria(b.categoria);
    const palabraA = a.palabra || "";
    const palabraB = b.palabra || "";

    const comparacionCategoria = categoriaA.localeCompare(categoriaB, "es", {
      numeric: true,
      sensitivity: "base"
    });

    if (comparacionCategoria !== 0) {
      return comparacionCategoria;
    }

    return palabraA.localeCompare(palabraB, "es", {
      numeric: true,
      sensitivity: "base"
    });
  });
}

function obtenerCategorias() {
  const categorias = banco
    .filter((item) => !esSecuencia(item))
    .map((item) => item.categoria)
    .filter(Boolean);

  return [...new Set(categorias)].sort((a, b) =>
    formatearCategoria(a).localeCompare(formatearCategoria(b), "es", {
      numeric: true,
      sensitivity: "base"
    })
  );
}

function cargarCategorias() {
  elementos.categoria.innerHTML = "";

  const opcionTodas = document.createElement("option");
  opcionTodas.value = "";
  opcionTodas.textContent = "Todas las categorías";
  elementos.categoria.appendChild(opcionTodas);

  obtenerCategorias().forEach((categoria) => {
    const opcion = document.createElement("option");
    opcion.value = categoria;
    opcion.textContent = formatearCategoria(categoria);
    elementos.categoria.appendChild(opcion);
  });
}

function actualizarPestanasSecuencia() {
  elementos.pestanasSecuencia.forEach((boton) => {
    const activa = normalizarTexto(boton.dataset.secuencia) === secuenciaActiva;
    boton.classList.toggle("activa", activa);
    boton.setAttribute("aria-pressed", String(activa));
  });
}

function obtenerResultados() {
  const consulta = normalizarTexto(elementos.busqueda.value);
  const categoriaSeleccionada = elementos.categoria.value;
  const esVistaInicial = consulta === "" && categoriaSeleccionada === "" && secuenciaActiva === "";

  if (esVistaInicial) {
    return vistaInicialAleatoria;
  }

  const resultados = banco.filter((item) => {
    const coincideBusqueda =
      consulta === "" || obtenerTextoConsultable(item).includes(consulta);

    if (secuenciaActiva !== "") {
      return coincideSecuencia(item, secuenciaActiva) && coincideBusqueda;
    }

    const coincideCategoria =
      categoriaSeleccionada === "" || item.categoria === categoriaSeleccionada;

    return !esSecuencia(item) && coincideCategoria && coincideBusqueda;
  });

  return ordenarResultados(resultados);
}

function limpiarGaleria() {
  elementos.galeria.innerHTML = "";
}

function crearTarjeta(item) {
  const tarjeta = elementos.plantilla.content.firstElementChild.cloneNode(true);

  const imagen = tarjeta.querySelector(".imagen-sena");
  const categoria = tarjeta.querySelector(".categoria-tarjeta");
  const palabra = tarjeta.querySelector(".palabra-tarjeta");
  const fuente = tarjeta.querySelector(".fuente-tarjeta");

  imagen.src = item.archivo_imagen;
  imagen.alt = item.palabra
    ? `Representación visual de ${item.palabra} en Lengua de Señas Peruana`
    : "Representación visual en Lengua de Señas Peruana";

  if (esSecuencia(item)) {
    categoria.textContent = "";
    categoria.hidden = true;
  } else {
    categoria.textContent = formatearCategoria(item.categoria);
  }

  palabra.textContent = item.palabra || "Contenido sin título";

  if (fuente) {
    fuente.textContent = "";
    fuente.hidden = true;
  }

  return tarjeta;
}

function actualizarResumen() {
  const total = resultadosActuales.length;
  const visible = Math.min(cantidadVisible, total);

  if (secuenciaActiva !== "") {
    const nombre = NOMBRES_SECUENCIAS[secuenciaActiva] || formatearCategoria(secuenciaActiva);

    elementos.contador.textContent = total === 1
      ? `${nombre}: 1 parte encontrada`
      : `${nombre}: ${total} partes encontradas`;

    elementos.cargarMas.textContent = "Mostrar más partes";
  } else {
    elementos.contador.textContent = total === 1
      ? "1 seña encontrada"
      : `${total} señas encontradas`;

    elementos.cargarMas.textContent = "Mostrar más señas";
  }

  elementos.mostrando.textContent = total > 0
    ? `Mostrando ${visible} de ${total}`
    : "";

  elementos.cargarMas.hidden = visible >= total;
}

function renderizar() {
  resultadosActuales = obtenerResultados();

  limpiarGaleria();

  if (resultadosActuales.length === 0) {
    elementos.estado.hidden = false;

    elementos.estado.textContent = secuenciaActiva !== ""
      ? "No se encontraron partes de esta secuencia con los criterios indicados."
      : "No se encontraron señas con los criterios indicados.";

    elementos.cargarMas.hidden = true;
    elementos.mostrando.textContent = "";
    elementos.contador.textContent = "Sin resultados";
    return;
  }

  elementos.estado.hidden = true;

  const fragmento = document.createDocumentFragment();
  const visibles = resultadosActuales.slice(0, cantidadVisible);

  visibles.forEach((item) => {
    fragmento.appendChild(crearTarjeta(item));
  });

  elementos.galeria.appendChild(fragmento);
  actualizarResumen();
}

function activarSecuencia(secuencia) {
  secuenciaActiva = normalizarTexto(secuencia);
  elementos.categoria.value = "";
  cantidadVisible = LIMITE_INICIAL;

  actualizarPestanasSecuencia();
  renderizar();
}

function limpiarBusqueda() {
  elementos.busqueda.value = "";
  elementos.categoria.value = "";
  secuenciaActiva = "";
  cantidadVisible = LIMITE_INICIAL;

  generarVistaInicialAleatoria();
  actualizarPestanasSecuencia();
  renderizar();
  elementos.busqueda.focus();
}

function mostrarMas() {
  cantidadVisible += LIMITE_INICIAL;
  renderizar();
}

async function cargarJsonDesdeRutas() {
  let ultimoError = null;

  for (const ruta of RUTAS_DICCIONARIO) {
    try {
      const respuesta = await fetch(ruta, { cache: "no-store" });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status} en ${ruta}`);
      }

      const datos = await respuesta.json();

      if (!Array.isArray(datos)) {
        throw new TypeError(`El archivo cargado desde ${ruta} no contiene una lista.`);
      }

      return datos;
    } catch (error) {
      ultimoError = error;
      console.warn("No se pudo cargar el diccionario desde:", ruta, error);
    }
  }

  throw ultimoError || new Error("No se pudo cargar el diccionario LSP.");
}

async function cargarBanco() {
  try {
    elementos.estado.hidden = false;
    elementos.estado.textContent = "Preparando el banco de señas…";

    banco = await cargarJsonDesdeRutas();

    generarVistaInicialAleatoria();
    cargarCategorias();
    actualizarPestanasSecuencia();
    renderizar();
  } catch (error) {
    console.error("No fue posible cargar el banco:", error);

    elementos.estado.hidden = false;
    elementos.estado.textContent =
      "No fue posible cargar el banco. Verifica que el archivo datos/diccionario_lsp.json esté disponible o que el respaldo del repositorio principal esté accesible.";

    elementos.contador.textContent = "Datos no disponibles";
    elementos.mostrando.textContent = "";
    elementos.cargarMas.hidden = true;
  }
}

elementos.busqueda.addEventListener("input", () => {
  cantidadVisible = LIMITE_INICIAL;
  renderizar();
});

elementos.categoria.addEventListener("change", () => {
  secuenciaActiva = "";
  cantidadVisible = LIMITE_INICIAL;

  actualizarPestanasSecuencia();
  renderizar();
});

elementos.limpiar.addEventListener("click", limpiarBusqueda);
elementos.cargarMas.addEventListener("click", mostrarMas);

elementos.pestanasSecuencia.forEach((boton) => {
  boton.addEventListener("click", () => {
    activarSecuencia(boton.dataset.secuencia);
  });
});

cargarBanco();
