async function translateAndDownload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = async function(event) {
            const originalText = event.target.result;
            const translatedText = await translateText(originalText);
            downloadFile(translatedText, getTranslatedFileName(file.name));
        };

        reader.readAsText(file);
    } else {
        alert('Por favor, selecione um arquivo .txt.');
    }
}

async function translateText(originalText) {
    const lines = originalText.split('\n');
    let translatedText = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (shouldIgnoreTranslation(line)) {
            translatedText += line + '\n'; // Mantém a linha original se deve ser ignorada
        } else {
            const translatedLine = await translateLine(line);
            translatedText += translatedLine + '\n';
        }
        updateProgressBar(i + 1, lines.length);
    }

    return translatedText;
}

async function translateLine(line) {
    const regex = /"([^"]*)"/g;
    let translatedLine = line;
    const matches = [...line.matchAll(regex)];

    for (let i = 0; i < matches.length; i++) {
        const textInsideQuotes = matches[i][1];
        // Ignora a tradução se for o segundo texto em aspas duplas em uma linha npctalk
        if (matches.length > 1 && line.includes('npctalk') && i === 1) {
            continue;
        }
        const translatedSpeech = await translateSpeech(textInsideQuotes.trim());
        translatedLine = translatedLine.replace(`"${textInsideQuotes}"`, `"${translatedSpeech}"`);
    }

    return translatedLine;
}

async function translateSpeech(text) {
    const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURI(text)}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data[0][0][0];
    } catch (error) {
        console.error('Erro ao traduzir texto:', error);
        return text; // Retornar o texto original em caso de erro
    }
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function getTranslatedFileName(originalFileName) {
    const parts = originalFileName.split('.');
    const extension = parts.pop();
    const name = parts.join('.');
    return `${name}_traduzido.${extension}`;
}

function updateProgressBar(current, total) {
    const progressBar = document.getElementById('progress-bar');
    const percentage = Math.round((current / total) * 100);
    progressBar.style.width = percentage + '%';
    progressBar.textContent = percentage + '%';
}

function shouldIgnoreTranslation(line) {
    const keywords = ['cloakoffnpc', 'cloakonnpc', 'instance_create', 'instance_npcname', 'duplicate', 'instance_live_info', 'atoi', 'cutin'];
    for (const keyword of keywords) {
        if (line.includes(keyword)) {
            return true;
        }
    }
    return false;
}