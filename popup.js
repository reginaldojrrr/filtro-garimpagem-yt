const toggle = document.getElementById('toggle');

chrome.storage.local.get(['enabled'], (result) => {
    toggle.checked = result.enabled ?? true;
});

toggle.addEventListener('change', () => {
    chrome.storage.local.set({ enabled: toggle.checked });
});
