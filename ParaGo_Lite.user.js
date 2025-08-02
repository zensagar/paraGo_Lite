// ==UserScript==
// @name         ParaGo Lite - Open Paragon Dynamic Links (AAP, Optimus & Highway)
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Adds a button to open specific dynamic links (AAP, Optimus & Highway) in new tabs without switching focus
// @author       zensagar
// @match        https://paragon-na.amazon.com/*
// @icon         https://www.google.com/s2/favicons?domain=amazon.com
// @grant        GM_openInTab
// ==/UserScript==


(function () {
    'use strict';

    function extractLinks() {
        const urlRegex = /https?:\/\/[^\s<>"']+/g;
        const keywords = ['aap', 'optimus', 'highway'];
        const links = new Map();

        keywords.forEach(keyword => links.set(keyword, null));

        const contentArea = document.querySelector('.case-details, .case-comments') || document.body;
        const text = contentArea.innerText;

        if (!text.includes('https://')) return [];

        const matches = text.match(urlRegex) || [];

        for (const link of matches) {
            keywords.forEach(keyword => {
                if (link.toLowerCase().includes(keyword.toLowerCase()) && !links.get(keyword)) {
                    links.set(keyword, link);
                }
            });

            if ([...links.values()].every(v => v !== null)) break;
        }

        return [...links.values()].filter(link => link !== null);
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .outer-container {
                position: fixed;
                top: 85px;
                right: 10px;
                z-index: 9999;
                padding: 16px;
                background: #000000;
                border-radius: 11px;
                box-shadow: 0 0 20px rgba(0,0,0,0.15);
            }

            .dynamic-link-button {
                background-color: #FF9900;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 11px 15px;
                cursor: pointer;
                font-size: 15px;
                font-weight: bold;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transition: background-color 0.3s ease;
                min-width: 230px;
            }

            .dynamic-link-button:hover {
                background-color: #e88b00;
            }
        `;
        document.head.appendChild(style);
    }

    function openLinkInBackground(url) {
        if (typeof GM_openInTab === 'function') {
            GM_openInTab(url, { active: false, insert: true });
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }

    function createButton() {
        const outerContainer = document.createElement('div');
        outerContainer.className = 'outer-container';

        const button = document.createElement('button');
        button.className = 'dynamic-link-button';
        button.innerText = 'paraGo Lite';

        button.addEventListener('click', () => {
            const links = extractLinks();
            if (links.length) {
                const originalText = button.innerText;
                button.innerText = 'zensagar';

                links.forEach(link => {
                    openLinkInBackground(link);
                });

                setTimeout(() => {
                    button.innerText = originalText;
                }, 101);
            } else {
                alert('No matching links found (AAP, Optimus, or Highway)');
            }
        });

        outerContainer.appendChild(button);
        document.body.appendChild(outerContainer);
    }

    function init() {
        injectStyles();
        const observer = new MutationObserver((mutations, obs) => {
            if (document.querySelector('.case-details')) {
                createButton();
                obs.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            if (!document.querySelector('.dynamic-link-button')) {
                createButton();
            }
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
