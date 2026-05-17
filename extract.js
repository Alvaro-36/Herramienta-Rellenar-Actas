const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const { JSDOM } = require('jsdom');

async function extractPlaceholders(docxPath) {
    const data = fs.readFileSync(docxPath);
    const zip = await JSZip.loadAsync(data);
    const xmlFiles = Object.keys(zip.files).filter(name =>
        name.startsWith("word/") && name.endsWith(".xml")
    );

    const placeholders = new Set();
    const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    for (const name of xmlFiles) {
        const content = await zip.file(name).async("string");
        const dom = new JSDOM(content, { contentType: "application/xml" });
        const doc = dom.window.document;
        
        let paragraphs = doc.getElementsByTagName("w:p");
        if (paragraphs.length === 0) paragraphs = doc.getElementsByTagNameNS(ns, "p");

        for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i];
            let runs = p.getElementsByTagName("w:r");
            if (runs.length === 0) runs = p.getElementsByTagNameNS(ns, "r");
            
            let textoCompleto = "";
            for (let j = 0; j < runs.length; j++) {
                const run = runs[j];
                let tElements = run.getElementsByTagName("w:t");
                if (tElements.length === 0) tElements = run.getElementsByTagNameNS(ns, "t");
                for (let k = 0; k < tElements.length; k++) {
                    textoCompleto += tElements[k].textContent;
                }
            }

            // Regex to find user placeholders in uppercase like <NOMBRE>, <HORA-ACTUAL>, <NOMB.M/P-ESP> etc.
            const regex = /<[A-Z0-9ÁÉÍÓÚÑ.,\/()_ -]+>/g;
            let match;
            while ((match = regex.exec(textoCompleto)) !== null) {
                const tag = match[0];
                if (tag.length > 2) {
                    placeholders.add(tag);
                }
            }
        }
    }

    return Array.from(placeholders);
}

function toCamelCase(str) {
    // Dictionary to normalize common abbreviations
    const dictionary = {
        'nomb': 'nombre',
        'int': 'interesado',
        'nro': 'numero',
        'dni': 'dni',
        'esp': 'español',
        'nac': 'nacimiento',
        'domic': 'domicilio',
        'act': 'actual',
        'recup': 'recuperacion',
        'vec': 'vecindad',
        'm/p': 'padreMadre',
        'm_p': 'padreMadre',
        'consul': 'consulado'
    };

    // Normalize accents and convert to lower case, but preserve ñ
    let cleaned = str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u0302\u0304-\u036f]/g, "") // Remove accents except tilde (ñ)
        .normalize("NFC");

    // Apply dictionary translations for abbreviations
    Object.entries(dictionary).forEach(([abbr, full]) => {
        const regex = new RegExp(`\\b${abbr}\\b`, 'g');
        cleaned = cleaned.replace(regex, full);
    });

    // Special case for "m/p" which contains slash
    cleaned = cleaned.replace(/m\/p/g, 'padreMadre');

    // Split by non-alphanumeric characters
    const words = cleaned.split(/[^a-z0-9ñ]/gi).filter(Boolean);

    if (words.length === 0) return 'campo';

    return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Uso: node extract.js <ruta-al-docx>");
        process.exit(1);
    }

    const docxPath = args[0];
    if (!fs.existsSync(docxPath)) {
        console.error(`El archivo no existe: ${docxPath}`);
        process.exit(1);
    }

    try {
        const tags = await extractPlaceholders(docxPath);
        const name = path.basename(docxPath, '.docx');
        
        const camposFormulario = {};
        tags.forEach(tag => {
            // Remove < and >
            const inner = tag.slice(1, -1).trim();
            const key = toCamelCase(inner);
            camposFormulario[key] = tag;
        });

        const jsonContent = {
            nombreFormulario: name,
            camposFormulario
        };

        const outPath = path.join(path.dirname(docxPath), '..', `${name.toLowerCase()}.json`);
        fs.writeFileSync(outPath, JSON.stringify(jsonContent, null, 4), 'utf8');
        console.log(`JSON generado exitosamente en: ${outPath}`);
        console.log(JSON.stringify(jsonContent, null, 4));
    } catch (err) {
        console.error("Error procesando el archivo:", err);
    }
}

main();
