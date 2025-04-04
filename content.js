// Versão FINAL com MutationObserver por vídeo
function parseNumber(str) {
    str = str.toLowerCase().replace(',', '.').replace(/\s+/g, '');

    if (str.includes('milhão') || str.includes('million') || str.includes('m')) {
        return parseFloat(str) * 1_000_000;
    }
    if (str.includes('mi')) return parseFloat(str) * 1_000_000;
    if (str.includes('mil') || str.includes('k')) return parseFloat(str) * 1_000;
    return parseFloat(str);
}

function parseDateToDays(texto) {
    const match = texto.match(/(\d+)\s*(dia|dias|semana|semanas|mês|meses|day|days|week|weeks|month|months|year|years|ano|anos)/i);
    if (!match) return null;
    const valor = parseInt(match[1]);
    const unidade = match[2].toLowerCase();

    switch (unidade) {
        case 'dia': case 'dias': case 'day': case 'days': return valor;
        case 'semana': case 'semanas': case 'week': case 'weeks': return valor * 7;
        case 'mês': case 'meses': case 'month': case 'months': return valor * 30;
        case 'ano': case 'anos': case 'year': case 'years': return valor * 365;
        default: return null;
    }
}

function parseInscritos(str) {
    const match = str.match(/(\d+[.,]?\d*)\s*(milhão|mil|mi|k|m|million)?(?:\s+de)?\s+(subscribers?|inscritos)/i);
    if (!match) return 0;
    return Math.round(parseNumber(match[1] + (match[2] || '')));
}

function videoAtendeRequisitos(inscritos, dias, views) {
    if (inscritos > 200000) return false;

    if (inscritos <= 20000) {
        if (dias <= 10 && views >= 50000) return true;
        if (dias > 10 && dias <= 21 && views >= 100000) return true;
        if (dias > 21 && dias <= 30 && views >= 200000) return true;
    }

    if (inscritos > 20000 && inscritos <= 200000) {
        if (dias <= 60 && views >= 500000) return true;
    }

    return false;
}

function extrairInfos(video) {
    let infos = [];
    const spans = video.querySelectorAll('.inline-metadata-item');
    if (spans.length) infos = [...spans].map(el => el.textContent.trim());

    let views = 0;
    let dias = 999;
    const fallbackText = video.innerText.toLowerCase();

    if (infos.length < 2) {
        const viewsMatch = fallbackText.match(/(\d+[.,]?\d*)\s*(milhão|mil|mi|k|m|million)?\s*(visualizações|views)/i);
        const dataMatch = fallbackText.match(/((há\s*)?(\d+)\s*(dia|dias|semana|semanas|mês|meses|day|days|week|weeks|month|months|year|years|ano|anos))/i);
        if (viewsMatch) views = parseNumber(viewsMatch[1] + (viewsMatch[2] || ''));
        if (dataMatch) dias = parseDateToDays(dataMatch[1]);
    } else {
        infos.forEach(info => {
            const lower = info.toLowerCase();
            if (lower.includes('visualiza') || lower.includes('views')) {
                views = parseNumber(lower.replace(/.*?(\d+[.,]?\d*).*/, '$1'));
            }
            if (lower.includes('há') || lower.includes('ago')) dias = parseDateToDays(info);
        });
    }

    return { views, dias };
}

function filtrarVideo(video) {
    if (video.dataset.filtrado === 'true') return;

    const canalTextRaw = video.querySelector('#channel-name #text')?.innerText?.toLowerCase() || '';
    const inscritos = parseInscritos(canalTextRaw);
    const { views, dias } = extrairInfos(video);

    console.log('📌 Canal text bruto:', canalTextRaw);
    console.log(`📊 Inscritos: ${inscritos} | Dias: ${dias} | Views: ${views}`);

    if (dias !== null && !videoAtendeRequisitos(inscritos, dias, views)) {
        console.warn('❌ Ocultando vídeo com dados:', JSON.stringify({ inscritos, dias, views }, null, 2));
        video.style.display = 'none';
    } else {
        console.info('✅ Permitido:', { inscritos, dias, views });
    }

    video.dataset.filtrado = 'true';
}

function observarInscritos(video) {
    const alvo = video.querySelector('#channel-name #text');
    if (!alvo) return filtrarVideo(video);

    const observer = new MutationObserver(() => {
        const texto = alvo.innerText.toLowerCase();
        if (texto.includes('subscribers') || texto.includes('inscritos')) {
            observer.disconnect();
            filtrarVideo(video);
        }
    });

    observer.observe(alvo, { childList: true, subtree: true, characterData: true });

    setTimeout(() => {
        observer.disconnect();
        filtrarVideo(video);
    }, 3000);
}

function ocultarVideosInvalidos() {
    const videos = document.querySelectorAll('ytd-rich-item-renderer');
    videos.forEach(video => observarInscritos(video));
}

chrome.storage.local.get(['enabled'], (result) => {
    if (result.enabled === false) return;

    const initObserver = () => {
        const targetNode = document.querySelector('#content') || document.querySelector('ytd-rich-grid-renderer #contents');
        if (!targetNode) {
            requestAnimationFrame(initObserver);
            return;
        }

        ocultarVideosInvalidos();

        const observer = new MutationObserver((mutationsList) => {
            const added = mutationsList.some(m => m.addedNodes.length);
            if (added) {
                setTimeout(ocultarVideosInvalidos, 500);
            }
        });

        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
    };

    initObserver();
});
