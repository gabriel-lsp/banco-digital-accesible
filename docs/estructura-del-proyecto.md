# Estructura del proyecto

Este documento propone una organización básica para el Banco Digital Accesible.

La estructura del repositorio busca separar los archivos principales, los módulos internos, los datos, las imágenes, los materiales descargables y los documentos de respaldo, de manera que el proyecto pueda mantenerse ordenado, revisarse con facilidad y ampliarse progresivamente.

Estructura sugerida:

```text
banco-digital-accesible/
│
├── index.html
├── estilos.css
├── app.js
├── README.md
├── LICENSE
│
├── lsp/
│   ├── index.html
│   ├── app.js
│   ├── datos/
│   └── imagenes/
│
├── braille/
│   ├── index.html
│   ├── app.js
│   ├── teoria.html
│   └── datos/
│
├── datos/
│   └── recursos.json
│
├── imagenes/
│   └── recursos/
│
├── materiales/
│   └── descargables/
│
└── docs/
    ├── alcance-pedagogico.md
    ├── fuentes-y-creditos.md
    ├── uso-permitido.md
    ├── respaldo-institucional.md
    ├── estructura-del-proyecto.md
    └── bitacora-de-cambios.md
```

Descripción de archivos y carpetas:

`index.html` contiene la estructura principal de la plataforma web.

`estilos.css` define la apariencia visual, el diseño responsivo, la organización de módulos, el contraste, los espaciados y la presentación general de la plataforma.

`app.js` contiene la lógica de interacción, búsqueda, filtros, enlaces, carga de datos y presentación dinámica de recursos, si corresponde.

`lsp/` contiene el módulo interno de Lengua de Señas Peruana, incluyendo sus páginas, datos, imágenes o recursos propios.

`braille/` contiene el módulo interno del Sistema Braille, incluyendo sus páginas, datos, teoría o recursos propios.

`datos/` almacena información organizada sobre recursos, categorías, enlaces, descripciones, módulos y materiales asociados.

`imagenes/` contiene recursos visuales propios, institucionalmente autorizados o de licencia compatible. Debe evitarse incorporar imágenes sin fuente clara.

`materiales/` puede contener fichas descargables, guías, orientaciones, documentos de apoyo o recursos complementarios para docentes y familias.

`docs/` reúne documentos de respaldo pedagógico, autoral, institucional y organizativo.

Para mantener el repositorio ordenado, se recomienda usar nombres de archivo en minúsculas, sin tildes, sin espacios y con guiones medios. Por ejemplo: `banco-lsp.html`, `banco-braille.html`, `materiales-docentes.pdf`, `recursos.json`.

Cada nuevo módulo o recurso integrado debe registrar su fuente, fecha de incorporación, responsable de revisión y relación con la finalidad educativa del proyecto.

Cuando el Banco Digital Accesible enlace otros repositorios o plataformas, se recomienda mantener una descripción breve del recurso, su finalidad, autoría, fuente y condición de uso.