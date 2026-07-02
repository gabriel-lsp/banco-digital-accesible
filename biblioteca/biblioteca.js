const busquedaPrincipal = document.getElementById('busqueda-principal');
const tipoPrincipal = document.getElementById('tipo-principal');
const formPrincipal = document.getElementById('form-busqueda-principal');
const atajosBusqueda = Array.from(document.querySelectorAll('.atajo-busqueda'));
const tabs = Array.from(document.querySelectorAll('.tab-biblioteca'));
const panelesTab = Array.from(document.querySelectorAll('.panel-tab'));

const contadorCatalogo = document.getElementById('contador-biblioteca');
const listaCatalogo = document.getElementById('lista-biblioteca');
const estadoCatalogo = document.getElementById('estado-catalogo');

const formGutendex = document.getElementById('form-gutendex');
const busquedaGutendex = document.getElementById('busqueda-gutendex');
const idiomaGutendex = document.getElementById('idioma-gutendex');
const listaGutendex = document.getElementById('lista-gutendex');
const contadorGutendex = document.getElementById('contador-gutendex');
const estadoGutendex = document.getElementById('estado-gutendex');
const sugerenciasGutendex = Array.from(document.querySelectorAll('.sugerencia-api'));

let recursos = [];
let filtroCatalogoTexto = '';
let filtroCatalogoTipo = '';

const equivalenciasGutendex = {
  educacion:'education', educativo:'education', escuela:'school',
  infancia:'children', nino:'children', ninos:'children',
  lenguaje:'language', comunicacion:'language', psicologia:'psychology',
  inclusion:'education', discapacidad:'disability', familia:'family'
};

function normalizar(texto){
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function cambiarTab(tabId){
  tabs.forEach((tab) => {
    const activo = tab.dataset.tab === tabId;
    tab.classList.toggle('activo', activo);
    tab.setAttribute('aria-selected', activo ? 'true' : 'false');
  });
  panelesTab.forEach((panel) => {
    panel.hidden = panel.id !== tabId;
  });
}

function claseEstado(estado){
  if(estado === 'abierto') return 'abierto';
  if(estado === 'restringido') return 'restringido';
  if(estado === 'disponible') return 'disponible';
  return 'pendiente';
}

function crearMeta(nombre, valor){
  const caja = document.createElement('div');
  const span = document.createElement('span');
  span.textContent = nombre;
  const parrafo = document.createElement('p');
  parrafo.textContent = valor || 'Por definir';
  caja.append(span, parrafo);
  return caja;
}

function crearTarjetaRecurso(recurso){
  const articulo = document.createElement('article');
  articulo.className = 'tarjeta-recurso';
  articulo.dataset.tipo = recurso.tipo || '';
  articulo.dataset.estado = recurso.estado || '';
  articulo.dataset.texto = normalizar([
    recurso.titulo, recurso.autor, recurso.anio, recurso.tipoEtiqueta,
    recurso.descripcion, recurso.resumen, recurso.area, recurso.tema,
    recurso.nivel, recurso.publico, recurso.idioma, recurso.fuente,
    recurso.repositorio, recurso.formato, recurso.licencia, recurso.condicion,
    Array.isArray(recurso.palabrasClave) ? recurso.palabrasClave.join(' ') : ''
  ].join(' '));

  const contenido = document.createElement('div');
  const cabecera = document.createElement('div');
  cabecera.className = 'cabecera-recurso';

  const icono = document.createElement('div');
  icono.className = 'icono-recurso';
  icono.setAttribute('aria-hidden','true');
  icono.textContent = recurso.icono || 'BD';

  const datosTitulo = document.createElement('div');
  const etiqueta = document.createElement('p');
  etiqueta.className = 'tipo-recurso';
  etiqueta.textContent = recurso.tipoEtiqueta || 'Recurso';
  const titulo = document.createElement('h3');
  titulo.textContent = recurso.titulo || 'Recurso sin título';
  datosTitulo.append(etiqueta, titulo);
  cabecera.append(icono, datosTitulo);

  const descripcion = document.createElement('p');
  descripcion.textContent = recurso.descripcion || 'Recurso pendiente de descripción.';

  const meta = document.createElement('div');
  meta.className = 'meta-recurso';
  meta.append(
    crearMeta('Autor / entidad', recurso.autor),
    crearMeta('Año', recurso.anio),
    crearMeta('Área', recurso.area),
    crearMeta('Formato', recurso.formato),
    crearMeta('Fuente', recurso.fuente),
    crearMeta('Condición', recurso.condicion)
  );

  contenido.append(cabecera, descripcion, meta);

  if(recurso.cita){
    const cita = document.createElement('div');
    cita.className = 'cita-recurso';
    cita.textContent = `Cita sugerida: ${recurso.cita}`;
    contenido.appendChild(cita);
  }

  const pie = document.createElement('div');
  pie.className = 'tarjeta-pie';
  const estado = document.createElement('span');
  estado.className = `estado-material ${claseEstado(recurso.estado)}`;
  estado.textContent = recurso.estadoEtiqueta || 'Pendiente';
  pie.appendChild(estado);

  const ficha = document.createElement('a');
  ficha.className = 'boton-secundario';
  ficha.href = `recurso.html?id=${encodeURIComponent(recurso.id)}`;
  ficha.textContent = 'Ver ficha';
  pie.appendChild(ficha);

  if(recurso.enlace){
    const enlace = document.createElement('a');
    enlace.className = 'enlace-material';
    enlace.href = recurso.enlace;
    enlace.textContent = recurso.accion || 'Acceder';
    if(/^https?:\/\//.test(recurso.enlace)){
      enlace.target = '_blank';
      enlace.rel = 'noopener noreferrer';
    }
    pie.appendChild(enlace);
  }else{
    const pendiente = document.createElement('span');
    pendiente.className = 'enlace-material deshabilitado';
    pendiente.textContent = recurso.accion || 'Configurar';
    pie.appendChild(pendiente);
  }

  articulo.append(contenido, pie);
  return articulo;
}

function renderizarCatalogo(){
  const texto = normalizar(filtroCatalogoTexto);
  const tipoSeleccionado = filtroCatalogoTipo;
  let visibles = 0;
  listaCatalogo.innerHTML = '';

  recursos.forEach((recurso) => {
    const tarjeta = crearTarjetaRecurso(recurso);
    const coincideTexto = !texto || tarjeta.dataset.texto.includes(texto);
    const coincideTipo = !tipoSeleccionado || tipoSeleccionado === 'todos' || recurso.tipo === tipoSeleccionado;
    if(coincideTexto && coincideTipo){
      listaCatalogo.appendChild(tarjeta);
      visibles += 1;
    }
  });

  contadorCatalogo.textContent = visibles === 1 ? 'Mostrando 1 recurso bibliográfico.' : `Mostrando ${visibles} recursos bibliográficos.`;
  estadoCatalogo.hidden = visibles > 0;
  if(visibles === 0){
    estadoCatalogo.textContent = 'No se encontraron recursos con esa búsqueda. Prueba con otra palabra o cambia el tipo de búsqueda principal.';
  }
}

async function cargarCatalogo(){
  try{
    const respuesta = await fetch('datos/recursos.json?v=4');
    if(!respuesta.ok){throw new Error('No se pudo cargar el archivo de datos.');}
    recursos = await respuesta.json();
    estadoCatalogo.hidden = true;
    renderizarCatalogo();
  }catch(error){
    recursos = [];
    listaCatalogo.innerHTML = '';
    contadorCatalogo.textContent = 'No hay recursos cargados.';
    estadoCatalogo.hidden = false;
    estadoCatalogo.textContent = 'No se pudo cargar el catálogo. Revisa el archivo datos/recursos.json o la conexión del sitio.';
  }
}

function obtenerFormatoDisponible(formatos){
  const prioridad = [['text/html', 'Leer en línea'],['application/epub+zip', 'Descargar EPUB'],['application/pdf', 'Ver PDF'],['text/plain', 'Texto simple']];
  for(const [clave, etiqueta] of prioridad){
    const entrada = Object.entries(formatos || {}).find(([tipo]) => tipo.includes(clave));
    if(entrada){return {url: entrada[1], etiqueta};}
  }
  const alternativa = Object.values(formatos || {}).find(Boolean);
  return alternativa ? {url: alternativa, etiqueta: 'Acceder'} : null;
}

function crearTarjetaGutendex(libro){
  const articulo = document.createElement('article');
  articulo.className = 'tarjeta-api';
  const autores = Array.isArray(libro.authors) && libro.authors.length ? libro.authors.map((autor) => autor.name).join(', ') : 'Autor no identificado';
  const idiomas = Array.isArray(libro.languages) && libro.languages.length ? libro.languages.join(', ').toUpperCase() : 'No indicado';
  const materias = Array.isArray(libro.subjects) && libro.subjects.length ? libro.subjects.slice(0,3).join('; ') : 'Sin materias registradas';
  const formato = obtenerFormatoDisponible(libro.formats);

  const contenido = document.createElement('div');
  const etiqueta = document.createElement('p');
  etiqueta.className = 'tipo-recurso';
  etiqueta.textContent = 'Libro abierto';
  const titulo = document.createElement('h3');
  titulo.textContent = libro.title || 'Libro sin título';
  const datos = document.createElement('p');
  datos.innerHTML = `<strong>Autor:</strong> ${autores}<br><strong>Idioma:</strong> ${idiomas}<br><strong>Temas:</strong> ${materias}`;
  const formatos = document.createElement('div');
  formatos.className = 'api-formatos';
  formatos.innerHTML = `<span>Fuente:</span> Project Gutenberg mediante Gutendex`;
  const cita = document.createElement('div');
  cita.className = 'cita-recurso';
  cita.textContent = `Cita sugerida: ${autores}. (s. f.). ${libro.title || 'Título no identificado'}. Project Gutenberg.`;
  contenido.append(etiqueta, titulo, datos, formatos, cita);

  const pie = document.createElement('div');
  pie.className = 'tarjeta-pie';
  const estado = document.createElement('span');
  estado.className = 'estado-material abierto';
  estado.textContent = 'Consulta externa';
  pie.appendChild(estado);

  if(formato && formato.url){
    const enlace = document.createElement('a');
    enlace.className = 'enlace-material';
    enlace.href = formato.url;
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    enlace.textContent = formato.etiqueta;
    pie.appendChild(enlace);
  }else{
    const pendiente = document.createElement('span');
    pendiente.className = 'enlace-material deshabilitado';
    pendiente.textContent = 'Sin enlace directo';
    pie.appendChild(pendiente);
  }

  articulo.append(contenido, pie);
  return articulo;
}

async function consultarGutendex(consulta, idioma){
  const parametros = new URLSearchParams({search: consulta});
  if(idioma){parametros.set('languages', idioma);}
  const respuesta = await fetch(`https://gutendex.com/books/?${parametros.toString()}`);
  if(!respuesta.ok){throw new Error('No se pudo consultar Gutendex.');}
  const datos = await respuesta.json();
  return Array.isArray(datos.results) ? datos.results.slice(0,8) : [];
}

function consultasAlternativas(consulta){
  const base = normalizar(consulta).trim();
  const alternativas = [consulta, base];
  Object.entries(equivalenciasGutendex).forEach(([clave, valor]) => {
    if(base.includes(clave)){alternativas.push(valor);}
  });
  alternativas.push('education');
  return [...new Set(alternativas.filter(Boolean))];
}

function mostrarResultadosGutendex(resultados, mensaje){
  listaGutendex.innerHTML = '';
  resultados.forEach((libro) => listaGutendex.appendChild(crearTarjetaGutendex(libro)));
  contadorGutendex.textContent = resultados.length === 1 ? 'Mostrando 1 libro abierto.' : `Mostrando ${resultados.length} libros abiertos.`;
  estadoGutendex.hidden = !mensaje;
  if(mensaje){estadoGutendex.textContent = mensaje;}
}

async function ejecutarBusquedaGutendex(consulta, idioma, esInicial = false){
  listaGutendex.innerHTML = '';
  estadoGutendex.hidden = false;
  estadoGutendex.textContent = 'Consultando libros abiertos...';
  contadorGutendex.textContent = 'Buscando libros abiertos.';
  const intentos = consultasAlternativas(consulta);

  try{
    for(const intento of intentos){
      let resultados = await consultarGutendex(intento, idioma);
      if(!resultados.length && idioma){resultados = await consultarGutendex(intento, '');}
      if(resultados.length){
        const mensaje = intento !== consulta || idioma ? `Resultados encontrados usando "${intento}". Si el filtro de idioma no devuelve libros, se muestran coincidencias generales.` : '';
        mostrarResultadosGutendex(resultados, esInicial ? 'Búsqueda inicial cargada automáticamente para comprobar el funcionamiento de libros abiertos.' : mensaje);
        return;
      }
    }
    mostrarResultadosGutendex([], 'No se encontraron libros con esos criterios. Prueba con los botones sugeridos o usa términos como education, children, language o psychology.');
  }catch(error){
    listaGutendex.innerHTML = '';
    contadorGutendex.textContent = 'No se pudo completar la búsqueda.';
    estadoGutendex.hidden = false;
    estadoGutendex.textContent = 'La consulta externa no respondió. Intenta nuevamente o revisa la conexión.';
  }
}

async function buscarGutendex(evento){
  evento.preventDefault();
  const consulta = busquedaGutendex.value.trim();
  const idioma = idiomaGutendex.value;
  if(!consulta){
    listaGutendex.innerHTML = '';
    contadorGutendex.textContent = 'Escribe una palabra para buscar libros abiertos.';
    estadoGutendex.hidden = false;
    estadoGutendex.textContent = 'La búsqueda necesita una palabra, tema, título o autor.';
    busquedaGutendex.focus();
    return;
  }
  await ejecutarBusquedaGutendex(consulta, idioma);
}

function ejecutarBusquedaPrincipal(evento){
  evento.preventDefault();
  const texto = busquedaPrincipal.value.trim();
  const tipo = tipoPrincipal.value;
  filtroCatalogoTexto = texto;
  filtroCatalogoTipo = tipo === 'externos' ? '' : tipo;
  renderizarCatalogo();

  if(tipo === 'externos' || tipo === 'libros'){
    busquedaGutendex.value = texto || 'education';
    ejecutarBusquedaGutendex(busquedaGutendex.value, '');
    cambiarTab('panel-externos');
  }else{
    cambiarTab('panel-catalogo');
  }
  document.getElementById('resultados-biblioteca').scrollIntoView({behavior:'smooth', block:'start'});
}

formPrincipal.addEventListener('submit', ejecutarBusquedaPrincipal);
atajosBusqueda.forEach((boton) => {
  boton.addEventListener('click', () => {
    busquedaPrincipal.value = boton.dataset.consulta || '';
    tipoPrincipal.value = boton.dataset.tipo || 'todos';
    formPrincipal.requestSubmit();
  });
});
tabs.forEach((tab) => tab.addEventListener('click', () => cambiarTab(tab.dataset.tab)));
formGutendex.addEventListener('submit', buscarGutendex);
sugerenciasGutendex.forEach((boton) => {
  boton.addEventListener('click', () => {
    busquedaGutendex.value = boton.dataset.consulta || '';
    idiomaGutendex.value = '';
    ejecutarBusquedaGutendex(busquedaGutendex.value, '');
  });
});

cargarCatalogo();
cambiarTab('panel-catalogo');
busquedaGutendex.value = 'education';
ejecutarBusquedaGutendex('education', '', true);
