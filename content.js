// content.js

function parseNumber(str) {
    str = str.toLowerCase().replace(',', '.').replace(/\s+/g, '');
    if (str.includes('million')) return parseFloat(str) * 1_000_000;
    if (str.includes('milhão') || str.includes('mi')) return parseFloat(str) * 1_000_000;
    if (str.includes('mil') || str.includes('k')) return parseFloat(str) * 1_000;
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

function parseInscritos(str) {
    return parseNumber(str);
}

function videoAtendeRequisitos(inscritos, dias, views) {
    if (inscritos <= 20000) {
        if (dias <= 10 && views >= 50000) return true;
        if (dias <= 21 && views >= 100000) return true;
        if (dias <= 30 && views >= 200000) return true;
    }
    if (inscritos >= 100000 && inscritos <= 200000 && dias <= 60 && views >= 500000) {
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
            const inscritoTextRaw = innerText.match(/\d+[.,]?\d*\s*(milhão|mil|mi|k|million)?\s+(inscritos|subscribers)/i);
            const inscritos = inscritoTextRaw ? parseInscritos(inscritoTextRaw[0]) : 0;
            console.log('Inscritos detectados:', inscritoTextRaw?.[0], '-', inscritos);

            let views = 0;
            let dias = 999;

            infos.forEach(info => {
                if (info.toLowerCase().includes('visualiza') || info.toLowerCase().includes('views')) {
                    views = parseNumber(info);
                }
                if (info.toLowerCase().includes('há') || info.toLowerCase().includes('ago')) {
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
