// function parseNumber(str) {
//     str = str.toLowerCase().replace(',', '.').replace(/\s+/g, '');

//     if (str.includes('milhão') || str.includes('million') || str.includes('m')) {
//         return parseFloat(str) * 1_000_000;
//     }

//     if (str.includes('mi')) return parseFloat(str) * 1_000_000;
//     if (str.includes('mil') || str.includes('k')) return parseFloat(str) * 1_000;

//     return parseFloat(str);
// }

// function parseDateToDays(texto) {
//     const match = texto.match(/(\d+)\s*(dia|dias|semana|semanas|mês|meses|day|days|week|weeks|month|months)/i);
//     if (!match) return null;
//     const valor = parseInt(match[1]);
//     const unidade = match[2].toLowerCase();

//     switch (unidade) {
//         case 'dia':
//         case 'dias':
//         case 'day':
//         case 'days':
//             return valor;
//         case 'semana':
//         case 'semanas':
//         case 'week':
//         case 'weeks':
//             return valor * 7;
//         case 'mês':
//         case 'meses':
//         case 'month':
//         case 'months':
//             return valor * 30;
//         default:
//             return null;
//     }
// }

// function videoAtendeRequisitos(dias, views) {
//     if (dias <= 10 && views >= 50000) return true;
//     if (dias <= 21 && views >= 100000) return true;
//     if (dias <= 30 && views >= 200000) return true;
//     if (dias <= 60 && views >= 500000) return true;
//     return false;
// }

// function processarVideos(videos, modo) {
//     videos.forEach(video => {
//         if (video.dataset.filtrado === 'true') return;

//         try {
//             let infos = [];

//             if (modo === 'novo') {
//                 const metaSpans = video.querySelectorAll('.yt-lockup-metadata-view-model-wiz__metadata div');
//                 infos = [...metaSpans].map(el => el.textContent.trim());
//             } else if (modo === 'classico') {
//                 const spans = video.querySelectorAll('.inline-metadata-item');
//                 infos = spans.length ? [...spans].map(el => el.textContent.trim()) : [];
//             }

//             let views = 0;
//             let dias = 999;

//             if (infos.length < 2) {
//                 const fallbackText = video.innerText.toLowerCase();
//                 console.log(`[!] Fallback innerText:\n`, fallbackText);

//                 const viewsMatch = fallbackText.match(/(\d+[.,]?\d*)\s*(milhão|mil|mi|k|m|million)?\s*(visualizações|views)/i);
//                 const dataMatch = fallbackText.match(/((há\s*)?(\d+)\s*(dia|dias|semana|semanas|mês|meses|day|days|week|weeks|month|months))/i);

//                 if (viewsMatch) {
//                     views = parseNumber(viewsMatch[1] + (viewsMatch[2] || ''));
//                 }

//                 if (dataMatch) {
//                     dias = parseDateToDays(dataMatch[1]);
//                 }
//             } else {
//                 infos.forEach(info => {
//                     const lower = info.toLowerCase();
//                     if (lower.includes('visualiza') || lower.includes('views')) {
//                         const clean = lower.replace(/de visualizações|visualizações|views/g, '').trim();
//                         views = parseNumber(clean);
//                     }
//                     if (lower.includes('há') || lower.includes('ago')) {
//                         dias = parseDateToDays(info);
//                     }
//                 });
//             }

//             console.log(`📊 [${modo}] Dias: ${dias} | Views: ${views}`);

//             if (!videoAtendeRequisitos(dias, views)) {
//                 video.style.display = 'none';
//             }

//             video.dataset.filtrado = 'true';
//         } catch (e) {
//             console.error(`[ERRO] ${modo}:`, e);
//         }
//     });
// }

// function ocultarVideosInvalidos() {
//     const novos = document.querySelectorAll('yt-lockup-view-model');
//     const antigos = document.querySelectorAll('ytd-rich-item-renderer');

//     processarVideos(novos, 'novo');
//     processarVideos(antigos, 'classico');
// }

// chrome.storage.local.get(['enabled'], (result) => {
//     if (result.enabled === false) return;

//     const initObserver = () => {
//         const targetNode = document.querySelector('#content') || document.querySelector('ytd-rich-grid-renderer #contents');
//         if (!targetNode) {
//             requestAnimationFrame(initObserver);
//             return;
//         }

//         ocultarVideosInvalidos();

//         const observer = new MutationObserver(() => {
//             setTimeout(ocultarVideosInvalidos, 300);
//         });

//         observer.observe(targetNode, {
//             childList: true,
//             subtree: true
//         });
//     };

//     initObserver();
// });
