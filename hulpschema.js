document.addEventListener('DOMContentLoaded', () => {
    // --- Detecteer op welke pagina we zijn ---
    const isPlusPage = document.getElementById('schema') !== null;
    const isMinPage = document.getElementById('schema-min') !== null;

    // --- Algemene Elementen ---
    const blokjesBtn = document.getElementById('blokjes');
    const schijfjesBtn = document.getElementById('schijfjes');
    const resetBtn = document.getElementById('reset');
    const terugBtn = document.getElementById('terug');
    const toolbarTools = document.querySelectorAll('#toolbar .tool');

    let actiefElement = null;
    let offsetX = 0, offsetY = 0;

    // --- Knop Logica ---
    function disableKnoppen(except) {
        if (except === 'blokjes' && schijfjesBtn) schijfjesBtn.disabled = true;
        else if (except === 'schijfjes' && blokjesBtn) blokjesBtn.disabled = true;
    }
    function enableKnoppen() {
        if (blokjesBtn) blokjesBtn.disabled = false;
        if (schijfjesBtn) schijfjesBtn.disabled = false;
    }
    
    if (blokjesBtn) {
        blokjesBtn.addEventListener('click', () => {
            document.getElementById('kubus').style.display = 'block';
            document.getElementById('staaf').style.display = 'block';
            document.getElementById('schijf-geel').style.display = 'none';
            document.getElementById('schijf-groen').style.display = 'none';
        });
    }
    if (schijfjesBtn) {
        schijfjesBtn.addEventListener('click', () => {
            document.getElementById('kubus').style.display = 'none';
            document.getElementById('staaf').style.display = 'none';
            document.getElementById('schijf-geel').style.display = 'block';
            document.getElementById('schijf-groen').style.display = 'block';
        });
    }
    
    // --- Reset Logica ---
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.querySelectorAll('body > .tool').forEach(el => el.remove());
            document.querySelectorAll('.vak .tool, .cirkel .tool, .light-t .tool').forEach(el => el.remove());
            document.querySelectorAll('.cirkel, .light-t, .wissel-vak').forEach(zone => zone.innerHTML = '');
            toolbarTools.forEach(tool => tool.style.display = 'none');
            enableKnoppen();
            if (isMinPage) {
                document.getElementById('t-count').textContent = '0';
                document.getElementById('e-count').textContent = '0';
                document.getElementById('vuilbak-container').style.display = 'block';
            }
            if (isPlusPage && wisselKnopPlus) wisselKnopPlus.remove();
        });
    }

    // --- Terugknop Logica ---
    if (terugBtn) {
        terugBtn.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            window.location.href = params.get("terug") || "index.html";
        });
    }

    // --- Sleep Logica ---
    function startDragPointer(e) {
        const tool = e.target.closest('.tool');
        if (!tool) return;

        e.preventDefault();
        
        const isClone = tool.closest('#toolbar') !== null;
        
        if (isClone) {
            actiefElement = tool.cloneNode(true);
            actiefElement.id = tool.id + '-clone-' + Date.now();
        } else {
            actiefElement = tool;
        }

        const rect = tool.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        // AANGEPAST: Neutraliseer transformatie voor soepel oppakken
        actiefElement.style.transform = 'none';
        actiefElement.style.position = 'absolute';
        actiefElement.style.zIndex = 1000;
        actiefElement.style.left = `${rect.left}px`;
        actiefElement.style.top = `${rect.top}px`;
        
        document.body.appendChild(actiefElement);

        document.addEventListener('pointermove', dragMove);
        document.addEventListener('pointerup', dragEnd, { once: true });
    }

    function dragMove(e) {
        if (!actiefElement) return;
        actiefElement.style.left = `${e.clientX - offsetX}px`;
        actiefElement.style.top = `${e.clientY - offsetY}px`;
    }

    function dragEnd(e) {
        document.removeEventListener('pointermove', dragMove);

        if (!actiefElement) return;

        actiefElement.style.visibility = 'hidden';
        const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
        actiefElement.style.visibility = 'visible';

        const targetZone = dropTarget ? dropTarget.closest('.cirkel, .vak, .light-t, .wissel-vak, #vuilbak') : null;

        if (targetZone) {
            if (targetZone.id === 'vuilbak' && isMinPage) {
                handleVuilbakDrop(actiefElement);
            } else {
                targetZone.appendChild(actiefElement);
                actiefElement.style.position = 'absolute';
                if (targetZone.classList.contains('cirkel')) {
                    actiefElement.style.left = '50%';
                    actiefElement.style.top = '50%';
                    actiefElement.style.transform = 'translate(-50%, -50%)';
                } else {
                    const zoneRect = targetZone.getBoundingClientRect();
                    actiefElement.style.left = `${e.clientX - zoneRect.left - offsetX}px`;
                    actiefElement.style.top = `${e.clientY - zoneRect.top - offsetY}px`;
                    actiefElement.style.transform = 'none';
                }
                if (isPlusPage) handlePlusDrop(targetZone);
                if (isMinPage) handleMinDrop(targetZone, actiefElement);
            }
        } else {
            actiefElement.remove();
        }
        actiefElement = null;
    }
    
    document.body.addEventListener('pointerdown', startDragPointer);

    // --- PAGINA-SPECIFIEKE LOGICA ---
    let wisselKnopPlus = null;
    function handlePlusDrop(targetZone) {
        if (targetZone.classList.contains('cirkel')) {
            const tool = targetZone.querySelector('.tool');
            if(tool.classList.contains('geel-blok')) disableKnoppen('blokjes');
            if(tool.classList.contains('schijf')) disableKnoppen('schijfjes');
            controleerCirkelsPlus();
        }
    }
    
    function toonWisselKnopPlus(type) {
        const lightVak = document.querySelector('.light-t');
        if (wisselKnopPlus) wisselKnopPlus.remove();
        wisselKnopPlus = document.createElement('button');
        wisselKnopPlus.textContent = 'Wissel om';
        wisselKnopPlus.className = 'wissel-knop';
        wisselKnopPlus.addEventListener('click', () => {
            document.querySelectorAll('#schema .cirkel').forEach(c => c.innerHTML = '');
            let groenTool;
            if (type === 'schijfjes') {
                groenTool = document.getElementById('schijf-groen').cloneNode(true);
            } else {
                groenTool = document.getElementById('staaf').cloneNode(true);
            }
            groenTool.style.position = 'absolute';
            groenTool.style.left = '50%';
            groenTool.style.top = '50%';
            groenTool.style.transform = 'translate(-50%, -50%)';
            groenTool.style.display = 'block';
            if(groenTool.classList.contains('schijf')) groenTool.style.display = 'flex';
            lightVak.innerHTML = '';
            lightVak.appendChild(groenTool);
            if (wisselKnopPlus) wisselKnopPlus.remove();
            wisselKnopPlus = null;
        });
        if(lightVak) lightVak.appendChild(wisselKnopPlus);
    }
    
    function controleerCirkelsPlus() {
        const cirkels = document.querySelectorAll('#schema .cirkel');
        const toolsInCirkels = Array.from(cirkels).map(c => c.querySelector('.tool')).filter(t => t);
        if (toolsInCirkels.length === 10) {
            if (toolsInCirkels.every(t => t.classList.contains('geel-blok'))) {
                toonWisselKnopPlus('blokjes');
            } else if (toolsInCirkels.every(t => t.classList.contains('schijf') && t.classList.contains('geel'))) {
                toonWisselKnopPlus('schijfjes');
            }
        } else {
            if (wisselKnopPlus) wisselKnopPlus.remove();
            wisselKnopPlus = null;
        }
    }

    function handleMinDrop(targetZone, tool) {
        if (targetZone.classList.contains('wissel-vak')) {
            const isGroeneStaaf = tool.classList.contains('staaf-groen');
            const isGroeneSchijf = tool.classList.contains('schijf') && tool.classList.contains('groen');
            if (isGroeneStaaf || isGroeneSchijf) {
                tool.style.left = '50%';
                tool.style.top = '50%';
                tool.style.transform = 'translate(-50%, -50%)';
                toonWisselKnopMin(targetZone, tool);
            }
        } else {
            const wisselvak = document.querySelector('.wissel-vak');
            if(wisselvak) wisselvak.querySelectorAll('.wissel-knop').forEach(k => k.remove());
        }
    }

    function toonWisselKnopMin(wisselVak, tool) {
        wisselVak.querySelectorAll('.wissel-knop').forEach(k => k.remove());
        const knop = document.createElement('button');
        knop.className = 'wissel-knop';
        knop.textContent = 'Wissel om';
        knop.addEventListener('click', () => {
            const legeCirkels = Array.from(document.querySelectorAll('#schema-min .cirkel:empty'));
            if (legeCirkels.length < 10) return;
            const isStaaf = tool.classList.contains('staaf-groen');
            const bron = isStaaf ? document.getElementById('kubus') : document.getElementById('schijf-geel');
            for (let i = 0; i < 10; i++) {
                const nieuweEenheid = bron.cloneNode(true);
                nieuweEenheid.style.display = 'block';
                if (nieuweEenheid.classList.contains('schijf')) nieuweEenheid.style.display = 'flex';
                nieuweEenheid.style.position = 'absolute';
                nieuweEenheid.style.left = '50%';
                nieuweEenheid.style.top = '50%';
                nieuweEenheid.style.transform = 'translate(-50%, -50%)';
                legeCirkels[i].appendChild(nieuweEenheid);
            }
            tool.remove();
            knop.remove();
        });
        wisselVak.appendChild(knop);
    }

    function handleVuilbakDrop(tool) {
        const tCountEl = document.getElementById('t-count');
        const eCountEl = document.getElementById('e-count');
        let t = parseInt(tCountEl.textContent);
        let e = parseInt(eCountEl.textContent);
        const isGroeneStaaf = tool.classList.contains('staaf-groen');
        const isGroeneSchijf = tool.classList.contains('schijf') && tool.classList.contains('groen');
        const isGeleBlok = tool.classList.contains('geel-blok');
        const isGeleSchijf = tool.classList.contains('schijf') && tool.classList.contains('geel');
        if (isGroeneStaaf || isGroeneSchijf) {
            t++;
            tCountEl.textContent = t;
        } else if (isGeleBlok || isGeleSchijf) {
            e++;
            eCountEl.textContent = e;
        }
        tool.remove();
    }
});