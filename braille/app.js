"use strict";

const CANTIDAD_INICIAL_VISIBLE = 6;
const INCREMENTO_VISIBLE = 6;

const elementos = {
  buscador: document.querySelector("#buscador"),
  filtros: [...document.querySelectorAll(".filtro")],
  lista: document.querySelector("#lista-tarjetas"),
  contador: document.querySelector("#contador-resultados"),
  estadoVacio: document.querySelector("#estado-vacio"),
  limpiarFiltros: document.querySelector("#limpiar-filtros"),
  mostrarAleatorio: document.querySelector("#mostrar-aleatorio"),
  mensajeError: document.querySelector("#mensaje-error")
};

const nombresCategorias = {
  alfabeto: "Alfabeto",
  numeros: "Números",
  "signos-basicos": "Signos básicos",
  "vocales-acentuadas": "Vocales acentuadas",
  "palabras-basicas": "Palabras básicas"
};

const ordenCategorias = [
  "alfabeto",
  "numeros",
  "signos-basicos",
  "vocales-acentuadas",
  "palabras-basicas"
];

const ordenNumeros = {
  "0": 0,
  "cero": 0,
  "numero cero": 0,
  "número cero": 0,
  "1": 1,
  "uno": 1,
  "numero uno": 1,
  "número uno": 1,
  "2": 2,
  "dos": 2,
  "numero dos": 2,
  "número dos": 2,
  "3": 3,
  "tres": 3,
  "numero tres": 3,
  "número tres": 3,
  "4": 4,
  "cuatro": 4,
  "numero cuatro": 4,
  "número cuatro": 4,
  "5": 5,
  "cinco": 5,
  "numero cinco": 5,
  "número cinco": 5,
  "6": 6,
  "seis": 6,
  "numero seis": 6,
  "número seis": 6,
  "7": 7,
  "siete": 7,
  "numero siete": 7,
  "número siete": 7,
  "8": 8,
  "ocho": 8,
  "numero ocho": 8,
  "número ocho": 8,
  "9": 9,
  "nueve": 9,
  "numero nueve": 9,
  "número nueve": 9
};

let contenidos = [];
let categoriaActiva = "todas";
let cantidadVisible = CANTIDAD_INICIAL_VISIBLE;
let claveResultadosActual = "";
let resultadosPreparados = [];

function normalizarTexto(texto) {
  return String(texto || "")
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function mezclarAleatoriamente(lista) {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const indiceAleatorio = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[indiceAleatorio]] = [copia[indiceAleatorio], copia[i]];
  }

  return copia;
}

function obtenerClaveResultados() {
  const consulta = normalizarTexto(elementos.buscador.value);
  return `${categoriaActiva}|${consulta}`;
}

function obtenerOrdenCategoria(categoria) {
  const indice = ordenCategorias.indexOf(categoria);
  return indice === -1 ? 999 : indice;
}

function obtenerOrdenNumero(item) {
  const nombre = normalizarTexto(item.nombre);
  const simbolo = normalizarTexto(item.simbolo);

  if (ordenNumeros[nombre] !== undefined) {
    return ordenNumeros[nombre];
  }

  if (ordenNumeros[simbolo] !== undefined) {
    return ordenNumeros[simbolo];
  }

  const numeroEncontrado = nombre.match(/\d+/);

  if (numeroEncontrado) {
    return Number(numeroEncontrado[0]);
  }

  return 999;
}

function ordenarResultados(lista) {
  return [...lista].sort((a, b) => {
    const ordenCategoriaA = obtenerOrdenCategoria(a.categoria);
    const ordenCategoriaB = obtenerOrdenCategoria(b.categoria);

    if (ordenCategoriaA !== ordenCategoriaB) {
      return ordenCategoriaA - ordenCategoriaB;
    }

    if (a.categoria === "numeros") {
      return obtenerOrdenNumero(a) - obtenerOrdenNumero(b);
    }

    return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", {
      numeric: true,
      sensitivity: "base"
    });
  });
}

function prepararResultados(resultados) {
  if (categoriaActiva === "todas" && elementos.buscador.value.trim() === "") {
    return mezclarAleatoriamente(resultados);
  }

  return ordenarResultados(resultados);
}

function crearTarjeta(item) {
  const articulo = document.createElement("article");
  articulo.className = "tarjeta";
  articulo.dataset.categoria = item.categoria;

  const visual = document.createElement("div");
  visual.className = "tarjeta-visual";

  const simbolo = document.createElement("div");
  simbolo.className = "simbolo-visual";
  simbolo.textContent = item.simbolo;
  simbolo.setAttribute("aria-label", `Símbolo visual: ${item.nombre}`);

  const braille = document.createElement("div");
  braille.className = "simbolo-braille";
  braille.textContent = item.braille;
  braille.setAttribute("aria-label", `Representación Braille de ${item.nombre}: ${item.braille}`);

  const cuerpo = document.createElement("div");
  cuerpo.className = "tarjeta-cuerpo";

  const categoria = document.createElement("p");
  categoria.className = "categoria";
  categoria.textContent = nombresCategorias[item.categoria] || item.categoria;

  const titulo = document.createElement("h3");
  titulo.textContent = item.nombre;

  const descripcion = document.createElement("p");
  descripcion.className = "descripcion";
  descripcion.textContent = item.descripcion;

  visual.append(simbolo, braille);
  cuerpo.append(categoria, titulo, descripcion);
  articulo.append(visual, cuerpo);

  return articulo;
}

function obtenerResultados() {
  const consulta = normalizarTexto(elementos.buscador.value);

  return contenidos.filter((item) => {
    const coincideCategoria = categoriaActiva === "todas" || item.categoria === categoriaActiva;
    const textoConsultable = normalizarTexto(
      `${item.simbolo} ${item.nombre} ${item.descripcion} ${nombresCategorias[item.categoria] || ""}`
    );
    const coincideBusqueda = consulta === "" || textoConsultable.includes(consulta);

    return coincideCategoria && coincideBusqueda;
  });
}

function actualizarContador(cantidadMostrada, cantidadTotalFiltrada) {
  if (cantidadTotalFiltrada === 0) {
    elementos.contador.textContent = "0 resultados encontrados";
    return;
  }

  if (cantidadMostrada >= cantidadTotalFiltrada) {
    elementos.contador.textContent =
      cantidadTotalFiltrada === 1
        ? "Mostrando 1 resultado"
        : `Mostrando ${cantidadTotalFiltrada} resultados`;
    return;
  }

  elementos.contador.textContent =
    `Mostrando ${cantidadMostrada} de ${cantidadTotalFiltrada} resultados`;
}

function renderizar() {
  const resultados = obtenerResultados();
  const claveResultados = obtenerClaveResultados();

  if (claveResultados !== claveResultadosActual) {
    claveResultadosActual = claveResultados;
    cantidadVisible = CANTIDAD_INICIAL_VISIBLE;
    resultadosPreparados = prepararResultados(resultados);
  }

  const resultadosVisibles = resultadosPreparados.slice(0, cantidadVisible);
  const fragmento = document.createDocumentFragment();

  resultadosVisibles.forEach((item) => {
    fragmento.appendChild(crearTarjeta(item));
  });

  elementos.lista.replaceChildren(fragmento);

  elementos.lista.hidden = resultados.length === 0;
  elementos.estadoVacio.hidden = resultados.length !== 0;

  if (elementos.mostrarAleatorio) {
    elementos.mostrarAleatorio.hidden =
      resultados.length === 0 || cantidadVisible >= resultados.length;
  }

  actualizarContador(resultadosVisibles.length, resultados.length);
}

function mostrarMasSignos() {
  cantidadVisible += INCREMENTO_VISIBLE;
  renderizar();
}

function seleccionarCategoria(botonSeleccionado) {
  categoriaActiva = botonSeleccionado.dataset.categoria;

  elementos.filtros.forEach((boton) => {
    const estaActivo = boton === botonSeleccionado;
    boton.classList.toggle("activo", estaActivo);
    boton.setAttribute("aria-pressed", String(estaActivo));
  });

  renderizar();
}

function restablecerVista() {
  elementos.buscador.value = "";
  const botonTodas = elementos.filtros.find((boton) => boton.dataset.categoria === "todas");

  if (botonTodas) {
    seleccionarCategoria(botonTodas);
  }

  elementos.buscador.focus();
}

async function cargarContenidos() {
  try {
    const respuesta = await fetch("braille.json");

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos)) {
      throw new TypeError("El archivo braille.json debe contener una lista.");
    }

    contenidos = datos;
    elementos.lista.setAttribute("aria-busy", "false");
    renderizar();
  } catch (error) {
    console.error("No fue posible cargar braille.json:", error);
    elementos.lista.setAttribute("aria-busy", "false");
    elementos.lista.hidden = true;
    elementos.contador.textContent = "Contenido no disponible";
    elementos.mensajeError.hidden = false;

    if (elementos.mostrarAleatorio) {
      elementos.mostrarAleatorio.hidden = true;
    }
  }
}

elementos.buscador.addEventListener("input", renderizar);

elementos.filtros.forEach((boton) => {
  boton.addEventListener("click", () => seleccionarCategoria(boton));
});

if (elementos.limpiarFiltros) {
  elementos.limpiarFiltros.addEventListener("click", restablecerVista);
}

if (elementos.mostrarAleatorio) {
  elementos.mostrarAleatorio.addEventListener("click", mostrarMasSignos);
}

cargarContenidos();
