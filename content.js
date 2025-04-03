// content.js

function parseNumber(str) {
    str = str.toLowerCase().replace(',', '.').replace(/\s+/g, '');

    if (str.includes('milhão') || str.includes('million') || str.includes('m')) {
        return parseFloat(str) * 1_000_000;
    }

    if (str.includes('mi')) {
        return parseFloat(str) * 1_000_000;
    }

    if (str.includes('mil') || str.includes('k')) {
        return parseFloat(str) * 1_000;
    }

    return parseFloat(str);
}

function parseDateToDays(texto) {
    const match = texto.match(/(\d+)\s*(day|days|week|weeks|month|months|dia|semana|mês|meses)/i);
    if (!match) return null;
    const valor = parseInt(match[1]);
    const unidade = match[2].toLowerCase();

    switch (unidade) {
        case 'day':
        case 'days':
        case 'dia':
            return valor;
        case 'week':
        case 'weeks':
        case 'semana':
            return valor * 7;
        case 'month':
        case 'months':
        case 'mês':
        case 'meses':
            return valor * 30;
        default:
            return null;
    }
}

function parseInscritos(numero, sufixo) {
    return parseNumber(numero + (sufixo || ''));
}

function videoAtendeRequisitos(inscritos, dias, views) {
    if (inscritos > 200000) return false; // Oculta canais com mais de 200 mil inscritos

    if (inscritos <= 20000) {
        if (dias <= 10 && views >= 50000) return true;
        if (dias <= 21 && views >= 100000) return true;
        if (dias <= 30 && views >= 200000) return true;
    }

    if (inscritos >= 100000 && dias <= 60 && views >= 500000) {
        return true;
    }

    return false;
}

function ocultarVideosInvalidos() {
    const videos = document.querySelectorAll('ytd-rich-item-renderer');

    videos.forEach(video => {
        try {
            const metaInfo = video.querySelector('#metadata-line');
            const infos = metaInfo && metaInfo.children ? [...metaInfo.children].map(el => el.textContent) : [];

            const innerText = video?.innerText?.toLowerCase?.() || '';
            const inscritoRegex = innerText.match(/(\d+[.,]?\d*)\s*(milhão|mil|mi|k|m|million)?\s+(inscritos|subscribers)/i);
            const inscritos = inscritoRegex ? parseInscritos(inscritoRegex[1], inscritoRegex[2]) : 0;
            console.log('Inscritos detectados:', inscritoRegex?.[0], '-', inscritos);

            let views = 0;
            let dias = 999;

            infos.forEach(info => {
                const lower = info.toLowerCase();

                if (lower.includes('visualiza') || lower.includes('views')) {
                    const clean = lower.replace(/de visualizações|visualizações|views/g, '').trim();
                    views = parseNumber(clean);
                }

                if (lower.includes('há') || lower.includes('ago')) {
                    dias = parseDateToDays(info);
                }
            });

            if (!videoAtendeRequisitos(inscritos, dias, views)) {
                video.style.display = 'none';
            }
        } catch (e) {
            console.error('Erro ao processar vídeo:', e);
        }
    });
}

// Checa se o filtro está ativado antes de rodar
chrome.storage.local.get(['enabled'], (result) => {
    if (result.enabled === false) return;
    ocultarVideosInvalidos();
    setInterval(ocultarVideosInvalidos, 5000);
});
