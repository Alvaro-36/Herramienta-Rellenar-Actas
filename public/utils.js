/**
 * Reemplaza todas las ocurrencias de una palabra en un archivo DOCX.
 * Procesa el cuerpo del documento, headers y footers.
 *
 * @param {File|ArrayBuffer} docxFile - El archivo DOCX (File del input o ArrayBuffer).
 * @param {string} palabraClave - La palabra a buscar.
 * @param {string} palabraReemplazo - La palabra con la que se reemplaza.
 * @returns {Promise<Blob>} - Un Blob del DOCX modificado listo para descargar.
 */
async function reemplazarPalabraEnDocx(docxFile, palabraClave, palabraReemplazo) {
    const arrayBuffer = docxFile instanceof ArrayBuffer
        ? docxFile
        : await docxFile.arrayBuffer();

    const zip = await JSZip.loadAsync(arrayBuffer);

    const archivosXml = Object.keys(zip.files).filter(nombre =>
        nombre.startsWith("word/") && nombre.endsWith(".xml")
    );

    let totalReemplazos = 0;

    for (const nombreArchivo of archivosXml) {
        const contenidoXml = await zip.file(nombreArchivo).async("string");
        const resultado = reemplazarEnXml(contenidoXml, palabraClave, palabraReemplazo);
        if (resultado.cantidadReemplazos > 0) {
            zip.file(nombreArchivo, resultado.xmlModificado);
            totalReemplazos += resultado.cantidadReemplazos;
            console.log(`${nombreArchivo}: ${resultado.cantidadReemplazos} reemplazo(s)`);
        }
    }

    console.log(`Total de reemplazos realizados: ${totalReemplazos}`);

    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    return blob;
}

/**
 * Reemplaza texto dentro de un string XML de DOCX.
 * Maneja el caso donde la palabra esta distribuida en multiples <w:t> dentro de un <w:r>.
 */
function reemplazarEnXml(xmlString, palabraClave, palabraReemplazo) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "application/xml");
    const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    let cantidadReemplazos = 0;

    let parrafos = doc.getElementsByTagName("w:p");
    if (parrafos.length === 0) parrafos = doc.getElementsByTagNameNS(ns, "p");

    for (let i = 0; i < parrafos.length; i++) {
        const parrafo = parrafos[i];
        let runs = parrafo.getElementsByTagName("w:r");
        if (runs.length === 0) runs = parrafo.getElementsByTagNameNS(ns, "r");

        const nodosTexto = [];
        let textoCompleto = "";

        for (let j = 0; j < runs.length; j++) {
            const run = runs[j];
            let tElements = run.getElementsByTagName("w:t");
            if (tElements.length === 0) tElements = run.getElementsByTagNameNS(ns, "t");
            for (let k = 0; k < tElements.length; k++) {
                const tElem = tElements[k];
                const texto = tElem.textContent;
                nodosTexto.push({
                    nodo: tElem,
                    inicio: textoCompleto.length,
                    fin: textoCompleto.length + texto.length
                });
                textoCompleto += texto;
            }
        }

        if (!textoCompleto.includes(palabraClave)) continue;

        const textoReemplazado = textoCompleto.split(palabraClave).join(palabraReemplazo);
        const ocurrencias = (textoCompleto.split(palabraClave).length - 1);
        cantidadReemplazos += ocurrencias;

        distribuirTextoEnNodos(nodosTexto, textoReemplazado);
    }

    const serializer = new XMLSerializer();
    const xmlModificado = serializer.serializeToString(doc);
    return { xmlModificado, cantidadReemplazos };
}

/**
 * Distribuye un texto resultante de vuelta en los nodos <w:t> originales.
 * Pone todo el texto en el primer nodo y vacia el resto,
 * preservando el formato del primer run.
 */
function distribuirTextoEnNodos(nodosTexto, textoNuevo) {
    if (nodosTexto.length === 0) return;

    nodosTexto[0].nodo.textContent = textoNuevo;
    nodosTexto[0].nodo.setAttribute("xml:space", "preserve");

    for (let i = 1; i < nodosTexto.length; i++) {
        nodosTexto[i].nodo.textContent = "";
    }
}

/**
 * Descarga un Blob como archivo.
 */
function descargarBlob(blob, nombreArchivo) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
