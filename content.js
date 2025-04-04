// Listener para detectar mudanças na configuração e recarregar a página
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.enabled) {
        location.reload();
    }
});

// Função para interpretar os números de forma flexível
function parseNumber(str) {
    str = str.toLowerCase().replace(',', '.').replace(/\s+/g, '');
    if (str.includes('m')) {
        return Math.round(parseFloat(str) * 1_000_000);
    }
    if (str.includes('k')) return Math.round(parseFloat(str) * 1_000);
    return Math.round(parseFloat(str)); 
}

// Função para interpretar as views corretamente (K = 1000, M = 1000000)
function parseViews(texto) {
    const match = texto.match(/(\d+[.,]?\d*)\s*(K|M)\s*views/i);
    if (!match) return 0;
    const number = match[1];
    const unit = match[2].toUpperCase();
    let views = parseNumber(number + unit);
    return views;
}

// Função para transformar a data em dias, corrigindo valores baixos
function parseDateToDays(texto) {
    const match = texto.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/i);
    if (!match) return null;
    const valor = parseInt(match[1]);
    const unidade = match[2].toLowerCase();
    let dias;
    switch (unidade) {
        case 'day': case 'days': dias = valor; break;
        case 'week': case 'weeks': dias = valor * 7; break;
        case 'month': case 'months': dias = valor * 30; break;
        case 'year': case 'years': dias = valor * 365; break;
        default: dias = null; break;
    }
    if (dias !== null && dias >= 0 && dias <= 1) {
        dias = 0;
    }
    return dias;
}

// Função para extrair o número de inscritos
function parseInscritos(str) {
    const match = str.match(/(\d+[.,]?\d*)\s*(K|M)?\s*(subscribers)/i);
    if (!match) return 0;
    const number = match[1];
    const unit = match[2] || '';
    return parseNumber(number + unit);
}

// Função que verifica se o vídeo atende aos requisitos
function videoAtendeRequisitos(inscritos, dias, views) {
    if (inscritos > 200000) return false;
    if (inscritos <= 20000) {
        if (dias <= 10 && views >= 50000) return true;
        if (dias <= 21 && views >= 100000) return true;
        if (dias <= 30 && views >= 200000) return true;
    }
    if (inscritos >= 20001 && inscritos <= 200000) {
        if (dias <= 60 && views >= 500000) return true;
    }
    return false;
}

// Função que extrai as informações de cada vídeo
function extrairInfos(video) {
    let infos = [];
    const spans = video.querySelectorAll('.inline-metadata-item');
    if (spans.length) infos = [...spans].map(el => el.textContent.trim());
    let views = 0;
    let dias = 999;
    const fallbackText = video.innerText.toLowerCase();
    if (infos.length < 2) {
        const viewsMatch = fallbackText.match(/(\d+[.,]?\d*)\s*(K|M)\s*views/i);
        const dataMatch = fallbackText.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/i);
        if (viewsMatch) views = parseViews(viewsMatch[0]);
        if (dataMatch) dias = parseDateToDays(dataMatch[0]);
    } else {
        infos.forEach(info => {
            const lower = info.toLowerCase();
            if (lower.includes('views')) {
                views = parseViews(info);
            }
            if (lower.includes('day') || lower.includes('week') || lower.includes('month') || lower.includes('year')) {
                dias = parseDateToDays(info);
            }
        });
    }
    return { views, dias };
}

// Função que filtra os vídeos conforme os requisitos
function filtrarVideo(video) {
    if (video.dataset.filtrado === 'true') return;
    const canalTextRaw = video.querySelector('#channel-name #text')?.innerText?.toLowerCase() || '';
    const inscritos = parseInscritos(canalTextRaw);
    const { views, dias } = extrairInfos(video);
    if (dias !== null && dias !== undefined && !videoAtendeRequisitos(inscritos, dias, views)) {
        video.style.display = 'none';
    }
    video.dataset.filtrado = 'true';
}

// Função que observa as mudanças no canal de cada vídeo
function observarInscritos(video) {
    const alvo = video.querySelector('#channel-name #text');
    if (!alvo) return filtrarVideo(video);
    const observer = new MutationObserver(() => {
        const texto = alvo.innerText?.toLowerCase() || '';
        if (texto.includes('subscribers')) {
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

// Função que oculta os vídeos que não atendem aos critérios
function ocultarVideosInvalidos() {
    const videos = document.querySelectorAll('ytd-rich-item-renderer');
    videos.forEach(video => observarInscritos(video));
}

// Carregar e aplicar o filtro, se ativado
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
