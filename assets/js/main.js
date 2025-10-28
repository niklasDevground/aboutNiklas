(function () {
    const storageKey = 'preferredLanguage';
    const supportedLanguages = ['de', 'en'];
    const defaultLanguage = 'de';

    const translations = {
        de: {
            'common.navStart': 'Start',
            'common.navProjects': 'Projekte',
            'nav.tanks': 'Mini-Tank-Battle',
            'common.navAriaLabel': 'Hauptnavigation',
            'common.langToggleLabel': 'Sprache wechseln',
            'start.metaTitle': 'Über Niklas',
            'start.heroTitle': 'Hey, ich bin Niklas Henniger 👋',
            'start.heroIntro': 'Software Engineer aus Basel mit einem Herz für clevere Automatisierungen und nutzerzentrierte Lösungen. Bei Schneider &amp; Cie. AG in Basel verbinde ich unterschiedliche Systeme zu robusten Kundenportalen, Schnittstellen und smarten Prozessen.',
            'start.introAria': 'Portrait und Über mich',
            'start.aboutHeading': 'Über mich',
            'start.aboutParagraph1': 'Ich liebe es, Strukturen zu schaffen, die Menschen den Arbeitsalltag erleichtern. Bei Schneider &amp; Cie. AG gestalte ich digitale Produkte – vom Kundenportal über integrationsstarke Schnittstellen bis hin zu automatisierten Workflows, die im Alltag spürbar entlasten.',
            'start.aboutParagraph2': 'Geboren 1999 und tief im Dreiländereck verwurzelt, verbringe ich meine Freizeit gerne auf dem Tennisplatz oder beim Konzipieren neuer Webideen. Mein Motto: <span class="highlight">„Verstehen, verbessern, teilen.“</span> Aktuell tauche ich immer tiefer in KI-Anwendungen ein, um diese Expertise Schritt für Schritt ins Unternehmen zu tragen.',
            'start.badgeBirthday': 'Geburtstag: 20.01.1999',
            'start.badgeLocation': 'Basel-Landschaft, Schweiz',
            'start.badgeLanguages': 'Deutsch · Englisch (C1)',
            'start.portraitAlt': 'Abstraktes Platzhaltermotiv',
            'start.experienceHeading': 'Berufserfahrung',
            'start.experience1Title': 'Software Engineer Lobster Solutions',
            'start.experience1Subheading': 'Schneider &amp; Cie. AG, Basel · seit 05/2022',
            'start.experience1List': '<li>Entwicklung und Betrieb des Kundenportals mit Lobster Pro und Lobster Data.</li><li>Implementierung von Schnittstellen, die Kund:innen und Partnern Echtzeitdaten bereitstellen.</li><li>Automatisierung interner Prozesse sowie Self-Service-Flows, die User mit ihrem Input starten können.</li>',
            'start.experience2Title': 'Software Engineer, Configurator Services',
            'start.experience2Subheading': 'Vitra IT Services GmbH · 11/2021 – 04/2022',
            'start.experience2List': '<li>Automatisierung von OFML-Anfragen und diversen Update-Prozessen mit C#.</li><li>Entwicklung eines Lizenz-Auswertungstools in Java und C#.</li><li>Gestaltung von Register-Pages für internationale Kampagnen.</li>',
            'start.currentProjectHeading': 'Aktuelles Projekt',
            'start.currentProjectTitle': 'On-Prem LLM mit WebUI',
            'start.currentProjectIntro': 'Aufbau einer lokalen KI-Plattform, die sensible Informationen sicher hält und dennoch für Kolleg:innen leicht zugänglich macht. Ziel ist ein zuverlässiger Wissensassistent, der ohne Cloud-Abhängigkeiten produktiv unterstützt.',
            'start.currentProjectList': '<li>Bereitstellung eines performanten LLM-Stacks auf dedizierter Hardware inklusive GPU-Optimierung.</li><li>Entwicklung einer schlanken WebUI mit Rollen- und Rechtekonzept für den sicheren Zugriff.</li><li>Integration von Unternehmenswissen über Vektordatenbanken und Retrieval-Augmented-Generation.</li>',
            'start.educationHeading': 'Ausbildung',
            'start.educationItem1Title': 'Duales Studium Informatik (ohne Abschluss)',
            'start.educationItem1Subtitle': 'DHBW Lörrach · 2020 – 2021',
            'start.educationItem2Title': 'Ausbildung Fachinformatiker Systemintegration',
            'start.educationItem2Subtitle': 'Vitra IT Services · 2017 – 2020',
            'start.educationItem3Title': 'Staatlich geprüfter informations- und kommunikationstechnischer Assistent',
            'start.educationItem3Subtitle': 'Gewerbeschule Lörrach · 2015 – 2017',
            'start.educationItem4Title': 'Fachhochschulreife',
            'start.educationItem4Subtitle': 'Gewerbeschule Lörrach · 2015 – 2017',
            'start.skillsHeading': 'Skills &amp; Tools',
            'start.skillsIntro': 'Technologien und Methoden, die ich in Projekten einsetze:',
            'start.engagementHeading': 'Engagement &amp; Interessen',
            'start.engagementList': '<li>Webmaster für Tennisclub und Tennishalle Grenzach-Wyhlen – Konzeption, Pflege und Support.</li><li>Tennisspieler seit über 16 Jahren sowie ehemaliges Fußball-Clubmitglied.</li><li>Begeistert von klaren UI-Konzepten und kontinuierlichem Lernen.</li>',
            'start.moreProjectsHeading': 'Mehr Projekte entdecken',
            'start.moreProjectsIntro': 'Du möchtest tiefer eintauchen? Auf meiner Projektseite sammle ich private Side-Projects, Experimente und Community-Arbeit, die außerhalb meines Berufs entstanden sind.',
            'start.moreProjectsLink': '<strong>Zu den Projekten</strong><br />Sammlung ausgewählter privater Arbeiten, Experimente und Vereinsinitiativen.',
            'start.focusHeading': 'Aktueller Fokus',
            'start.focusIntro': 'Mit Blick auf das kommende Jahr konzentriere ich mich darauf, KI-Initiativen greifbar zu machen: Use-Cases identifizieren, Prototypen bauen und Teams beim Einsatz unterstützen.',
            'start.focusList': '<li>Evaluierung von KI-gestützten Automatisierungen entlang bestehender Prozessketten.</li><li>Workshops und Wissensaufbau rund um verantwortungsvollen KI-Einsatz.</li><li>Proof-of-Concepts, die Mehrwert schnell sichtbar machen.</li>',
            'start.contactHeading': 'Kontakt',
            'start.contactIntro': 'Lass uns sprechen – egal ob zu spannenden Projekten oder Automatisierungsideen.',
            'start.contactLocation': 'Kanton Basel-Landschaft, Schweiz',
            'start.footerText': '© <span id="year"></span> Niklas. Gebaut mit ❤️ und einer Prise Neugier.',
            'projects.metaTitle': 'Projekte · Niklas Henniger',
            'projects.headerTitle': 'Private Projekte &amp; Experimente',
            'projects.headerIntro': 'Neben meiner Arbeit bei Schneider &amp; Cie. AG tüftele ich gerne an eigenen Ideen. Hier findest du persönliche Web-, Automatisierungs- und KI-Projekte, bei denen ich frei gestalten und ausprobieren kann.',
            'projects.featuredHeading': 'Lieblingsprojekte',
            'projects.siteTitle': 'Erstellung meiner Webseite',
            'projects.siteStack': 'Stack: HTML, CSS, JavaScript',
            'projects.siteFocus': 'Fokus: persönliche Marke',
            'projects.siteList': '<li>Konzeption eines klaren Storytellings, das meine Stationen und Stärken übersichtlich präsentiert.</li><li>Designsystem mit wiederverwendbaren Komponenten, damit neue Inhalte im Handumdrehen online sind.</li><li>Feinschliff bei Performance und Barrierefreiheit, inklusive Lighthouse-Checks und semantischer Struktur.</li>',
            'projects.pcTitle': 'Bauen meines eigenen Computers',
            'projects.pcStack': 'Stack: Hardware, BIOS-Tuning',
            'projects.pcFocus': 'Fokus: Custom Setup',
            'projects.pcList': '<li>Recherche und Auswahl der Komponenten für ein leises, leistungsstarkes System mit Fokus auf Entwicklung und KI-Workloads.</li><li>Eigenständige Montage inklusive Kabelmanagement, Temperatur-Optimierung und BIOS-Feinschliff.</li><li>Dokumentation der Build-Schritte, damit zukünftige Upgrades und Wartungen strukturiert ablaufen.</li>',
            'projects.llmTitle': 'On-Prem LLM verwenden inklusive WebUI',
            'projects.llmStack': 'Stack: Docker, GPU-Beschleunigung',
            'projects.llmFocus': 'Fokus: KI im eigenen Netzwerk',
            'projects.llmList': '<li>Setup einer lokalen LLM-Instanz mit optimierten Modellen, die sensible Daten im eigenen Netz belässt.</li><li>Entwicklung einer WebUI mit Rollen, Prompt-Vorlagen und Verlauf, um das Team strukturiert einzubinden.</li><li>Monitoring von GPU-Auslastung und Antwortqualität, um Modelle gezielt nachzuschärfen.</li>',
            'projects.tennisTitle': 'Website für den Tennisclub',
            'projects.tennisStack': 'Stack: Astro, Tailwind CSS',
            'projects.tennisFocus': 'Fokus: Vereinskommunikation',
            'projects.tennisList': '<li>Informationsarchitektur gestaltet, damit Mitglieder Trainingspläne, Termine und Neuigkeiten schnell finden.</li><li>Wartungsfreundliches CMS-Setup vorbereitet, sodass das Vorstandsteam Inhalte ohne Entwickler:innenpfad aktualisiert.</li><li>Fotogalerien und Sponsorenbereiche integriert, um Vereinsleben und Partner sichtbar zu machen.</li>',
            'projects.footerText': 'Zurück zur <a href="../start/">Startseite</a> · © <span id="year"></span> Niklas Henniger'
        },
        en: {
            'common.navStart': 'Home',
            'common.navProjects': 'Projects',
            'nav.tanks': 'Mini-Tank-Battle',
            'common.navAriaLabel': 'Primary navigation',
            'common.langToggleLabel': 'Change language',
            'start.metaTitle': 'About Niklas',
            'start.heroTitle': "Hey, I'm Niklas Henniger 👋",
            'start.heroIntro': 'Software engineer from Basel with a heart for smart automation and user-centred solutions. At Schneider &amp; Cie. AG in Basel I connect different systems to create robust customer portals, integrations and streamlined processes.',
            'start.introAria': 'Portrait and about me',
            'start.aboutHeading': 'About me',
            'start.aboutParagraph1': 'I love building structures that make everyday work easier. At Schneider &amp; Cie. AG I design digital products – from customer portals and integration-heavy interfaces to automated workflows that provide tangible relief.',
            'start.aboutParagraph2': 'Born in 1999 and deeply rooted in the tri-border region, I spend my spare time on the tennis court or sketching new web ideas. My motto: <span class="highlight">“Understand, improve, share.”</span> Right now I am diving deeper into AI applications to bring this expertise into the company step by step.',
            'start.badgeBirthday': 'Date of birth: 20/01/1999',
            'start.badgeLocation': 'Basel-Landschaft, Switzerland',
            'start.badgeLanguages': 'German · English (C1)',
            'start.portraitAlt': 'Abstract placeholder motif',
            'start.experienceHeading': 'Professional experience',
            'start.experience1Title': 'Software Engineer Lobster Solutions',
            'start.experience1Subheading': 'Schneider &amp; Cie. AG, Basel · since 05/2022',
            'start.experience1List': '<li>Developing and operating the customer portal powered by Lobster Pro and Lobster Data.</li><li>Implementing interfaces that provide real-time data to customers and partners.</li><li>Automating internal processes and self-service flows that users can trigger with their input.</li>',
            'start.experience2Title': 'Software Engineer, Configurator Services',
            'start.experience2Subheading': 'Vitra IT Services GmbH · 11/2021 – 04/2022',
            'start.experience2List': '<li>Automated OFML requests and update processes with C#.</li><li>Developed a licence analytics tool in Java and C#.</li><li>Designed registration pages for international campaigns.</li>',
            'start.currentProjectHeading': 'Current project',
            'start.currentProjectTitle': 'On-prem LLM with WebUI',
            'start.currentProjectIntro': 'Building a local AI platform that keeps sensitive information secure while remaining accessible to colleagues. The goal is a reliable knowledge assistant that works without cloud dependencies.',
            'start.currentProjectList': '<li>Providing a high-performance LLM stack on dedicated hardware with GPU optimisation.</li><li>Developing a lightweight WebUI with role and permission concepts for secure access.</li><li>Integrating company knowledge via vector databases and retrieval-augmented generation.</li>',
            'start.educationHeading': 'Education',
            'start.educationItem1Title': 'Dual studies in computer science (not completed)',
            'start.educationItem1Subtitle': 'DHBW Lörrach · 2020 – 2021',
            'start.educationItem2Title': 'Apprenticeship as IT specialist for system integration',
            'start.educationItem2Subtitle': 'Vitra IT Services · 2017 – 2020',
            'start.educationItem3Title': 'State-certified information and communication technology assistant',
            'start.educationItem3Subtitle': 'Gewerbeschule Lörrach · 2015 – 2017',
            'start.educationItem4Title': 'University entrance qualification',
            'start.educationItem4Subtitle': 'Gewerbeschule Lörrach · 2015 – 2017',
            'start.skillsHeading': 'Skills &amp; Tools',
            'start.skillsIntro': 'Technologies and methods I use in projects:',
            'start.engagementHeading': 'Engagement &amp; interests',
            'start.engagementList': '<li>Webmaster for Tennisclub and Tennishalle Grenzach-Wyhlen – responsible for concept, maintenance and support.</li><li>Tennis player for more than 16 years and former football club member.</li><li>Passionate about clear UI concepts and continuous learning.</li>',
            'start.moreProjectsHeading': 'Discover more projects',
            'start.moreProjectsIntro': 'Want to dive deeper? My projects page collects personal side projects, experiments and community work created outside my day job.',
            'start.moreProjectsLink': '<strong>Go to the projects</strong><br />Collection of selected personal work, experiments and club initiatives.',
            'start.focusHeading': 'Current focus',
            'start.focusIntro': 'Looking ahead, I am focused on making AI initiatives tangible: identifying use cases, building prototypes and helping teams adopt them.',
            'start.focusList': '<li>Evaluating AI-supported automation along existing process chains.</li><li>Running workshops and building knowledge around responsible AI usage.</li><li>Developing proofs of concept that showcase value quickly.</li>',
            'start.contactHeading': 'Contact',
            'start.contactIntro': 'Let’s talk – about exciting projects or automation ideas.',
            'start.contactLocation': 'Canton of Basel-Landschaft, Switzerland',
            'start.footerText': '© <span id="year"></span> Niklas. Built with ❤️ and a dash of curiosity.',
            'projects.metaTitle': 'Projects · Niklas Henniger',
            'projects.headerTitle': 'Personal projects &amp; experiments',
            'projects.headerIntro': 'Alongside my work at Schneider &amp; Cie. AG I love tinkering with my own ideas. Here are personal web, automation and AI projects where I can experiment freely.',
            'projects.featuredHeading': 'Favourite projects',
            'projects.siteTitle': 'Building my website',
            'projects.siteStack': 'Stack: HTML, CSS, JavaScript',
            'projects.siteFocus': 'Focus: personal brand',
            'projects.siteList': '<li>Designed a clear storytelling structure that presents my milestones and strengths at a glance.</li><li>Created a design system with reusable components so new content goes live in no time.</li><li>Polished performance and accessibility, including Lighthouse checks and semantic markup.</li>',
            'projects.pcTitle': 'Building my own computer',
            'projects.pcStack': 'Stack: Hardware, BIOS tuning',
            'projects.pcFocus': 'Focus: custom setup',
            'projects.pcList': '<li>Researched and selected components for a quiet yet powerful rig tailored to development and AI workloads.</li><li>Assembled everything myself including cable management, thermal optimisation and BIOS fine-tuning.</li><li>Documented each build step so future upgrades and maintenance are structured.</li>',
            'projects.llmTitle': 'Running an on-prem LLM including WebUI',
            'projects.llmStack': 'Stack: Docker, GPU acceleration',
            'projects.llmFocus': 'Focus: AI on the local network',
            'projects.llmList': '<li>Deployed a local LLM instance with optimised models that keep sensitive data within the network.</li><li>Built a WebUI featuring roles, prompt templates and history so the team can collaborate effectively.</li><li>Monitored GPU utilisation and response quality to fine-tune the models.</li>',
            'projects.tennisTitle': 'Website for the tennis club',
            'projects.tennisStack': 'Stack: Astro, Tailwind CSS',
            'projects.tennisFocus': 'Focus: club communications',
            'projects.tennisList': '<li>Designed the information architecture so members quickly find schedules, events and news.</li><li>Prepared a maintainable CMS setup so the board can update content without a developer.</li><li>Integrated photo galleries and sponsor sections to showcase club life and partners.</li>',
            'projects.footerText': 'Back to the <a href="../start/">start page</a> · © <span id="year"></span> Niklas Henniger'
        }
    };

    function getStoredLanguage() {
        try {
            const stored = window.localStorage.getItem(storageKey);
            return stored && supportedLanguages.includes(stored) ? stored : null;
        } catch (error) {
            return null;
        }
    }

    function storeLanguage(lang) {
        try {
            window.localStorage.setItem(storageKey, lang);
        } catch (error) {
            // Ignore storage errors (e.g., private mode)
        }
    }

    function detectLanguage() {
        const navigatorLanguage = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (navigatorLanguage.startsWith('de')) {
            return 'de';
        }
        return 'en';
    }

    function updateYear() {
        const yearEl = document.getElementById('year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear().toString();
        }
    }

    function applyTranslations(lang) {
        const fallbackDictionary = translations[defaultLanguage];
        const dictionary = translations[lang] || fallbackDictionary;
        const appliedLang = translations[lang] ? lang : defaultLanguage;

        document.documentElement.setAttribute('lang', appliedLang);

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.dataset.i18n;
            const value = dictionary[key] ?? fallbackDictionary[key];
            if (!value) {
                return;
            }

            const attribute = element.dataset.i18nAttr;
            if (attribute) {
                element.setAttribute(attribute, value);
            } else {
                element.innerHTML = value;
            }
        });

        const toggle = document.querySelector('[data-lang-toggle]');
        if (toggle) {
            toggle.textContent = appliedLang.toUpperCase();
        }

        updateYear();

        return appliedLang;
    }

    function setLanguage(lang) {
        const appliedLang = applyTranslations(lang);
        storeLanguage(appliedLang);
        return appliedLang;
    }

    const initialLanguage = getStoredLanguage() || detectLanguage();
    let currentLanguage = setLanguage(initialLanguage);

    const toggle = document.querySelector('[data-lang-toggle]');
    if (toggle) {
        toggle.addEventListener('click', () => {
            currentLanguage = setLanguage(currentLanguage === 'de' ? 'en' : 'de');
        });
    }
})();

// --- Easter egg: only on triple‑clicking the footer heart ---
(function () {
    function showEasterEgg() {
        if (!document.body || document.getElementById('ee-overlay')) return;

        const name = document.body.dataset ? document.body.dataset.easterName : '';
        const presetMsg = document.body.dataset ? document.body.dataset.easterMessage : '';
        const message = presetMsg || (name ? `Für ${name} 💖` : ''); // no default "Für dich"

        const overlay = document.createElement('div');
        overlay.id = 'ee-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '2147483646';
        document.body.appendChild(overlay);

        if (message) {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.position = 'fixed';
            toast.style.left = '50%';
            toast.style.bottom = '24px';
            toast.style.transform = 'translateX(-50%)';
            toast.style.background = 'rgba(0,0,0,0.78)';
            toast.style.color = '#fff';
            toast.style.padding = '10px 14px';
            toast.style.borderRadius = '12px';
            toast.style.fontFamily = 'inherit';
            toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
            toast.style.zIndex = '2147483647';
            toast.style.userSelect = 'none';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 5200);
        }

        const durationMs = 5000;
        const start = Date.now();
        const spawnInterval = setInterval(() => {
            if (Date.now() - start > durationMs) {
                clearInterval(spawnInterval);
                return;
            }
            const heart = document.createElement('div');
            heart.textContent = '💖';
            const size = 16 + Math.floor(Math.random() * 18); // 16–34px
            const left = Math.random() * 100; // vw
            const travel = 60 + Math.random() * 25; // vh
            heart.style.position = 'fixed';
            heart.style.left = left + 'vw';
            heart.style.bottom = '-10vh';
            heart.style.fontSize = size + 'px';
            heart.style.opacity = '0.95';
            heart.style.transition = 'transform 3.2s linear, opacity 3.2s linear';
            heart.style.transform = 'translateY(0)';
            overlay.appendChild(heart);
            requestAnimationFrame(() => {
                heart.style.transform = `translateY(-${travel}vh)`;
                heart.style.opacity = '0';
            });
            setTimeout(() => heart.remove(), 3400);
        }, 120);

        setTimeout(() => {
            overlay.remove();
        }, durationMs + 800);
    }

    function ensureHeartWrapper() {
        const footer = document.querySelector('footer');
        if (!footer) return null;

        // Already present?
        let heartEl = footer.querySelector('[data-footer-heart]');
        if (heartEl) return heartEl;

        const container = footer.querySelector('span');
        const heartRegex = /^(\s*)(?:❤️|❤|♥)/;

        if (container && heartRegex.test(container.textContent || '')) {
            const html = container.innerHTML.replace(heartRegex, `$1<span data-footer-heart role="button" aria-label="Herz" tabindex="0" style="cursor:pointer">❤️</span>`);
            container.innerHTML = html;
            return container.querySelector('[data-footer-heart]');
        }

        // Otherwise, prepend our own heart
        heartEl = document.createElement('span');
        heartEl.setAttribute('data-footer-heart', '');
        heartEl.setAttribute('role', 'button');
        heartEl.setAttribute('aria-label', 'Herz');
        heartEl.tabIndex = 0;
        heartEl.style.cursor = 'pointer';
        heartEl.textContent = '❤️';
        if (container) {
            container.prepend(heartEl, document.createTextNode(' '));
        } else {
            footer.prepend(heartEl);
        }
        return heartEl;
    }

    function setupHeartTripleClick() {
        return; // disabled: use existing footer heart only
        const heartEl = ensureHeartWrapper();
        if (!heartEl) return;

        let clicks = 0;
        let timer = null;
        const reset = () => { clicks = 0; if (timer) { clearTimeout(timer); timer = null; } };

        const onActivate = () => {
            clicks += 1;
            if (clicks === 3) {
                showEasterEgg();
                reset();
                return;
            }
            if (timer) clearTimeout(timer);
            timer = setTimeout(reset, 700); // "schnell" Fenster
        };

        heartEl.addEventListener('click', onActivate);
        heartEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate();
            }
        });
    }

    setupHeartTripleClick();
})();

// --- Easter egg binding using existing footer heart only ---
(function () {
    function showEasterEgg() {
        if (!document.body || document.getElementById('ee-overlay')) return;

        const name = document.body.dataset ? document.body.dataset.easterName : '';
        const presetMsg = document.body.dataset ? document.body.dataset.easterMessage : '';
        const message = presetMsg || (name ? `Für ${name} 💖` : '');

        const overlay = document.createElement('div');
        overlay.id = 'ee-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '2147483646';
        document.body.appendChild(overlay);

        if (message) {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.position = 'fixed';
            toast.style.left = '50%';
            toast.style.bottom = '24px';
            toast.style.transform = 'translateX(-50%)';
            toast.style.background = 'rgba(0,0,0,0.78)';
            toast.style.color = '#fff';
            toast.style.padding = '10px 14px';
            toast.style.borderRadius = '12px';
            toast.style.fontFamily = 'inherit';
            toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
            toast.style.zIndex = '2147483647';
            toast.style.userSelect = 'none';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 5200);
        }

        const durationMs = 5000;
        const start = Date.now();
        const spawn = () => {
            if (Date.now() - start > durationMs) return;
            const heart = document.createElement('div');
            heart.textContent = '💖';
            const size = 16 + Math.floor(Math.random() * 18);
            const left = Math.random() * 100;
            const travel = 60 + Math.random() * 25;
            heart.style.position = 'fixed';
            heart.style.left = left + 'vw';
            heart.style.bottom = '-10vh';
            heart.style.fontSize = size + 'px';
            heart.style.opacity = '0.95';
            heart.style.transition = 'transform 3.2s linear, opacity 3.2s linear';
            heart.style.transform = 'translateY(0)';
            overlay.appendChild(heart);
            requestAnimationFrame(() => {
                heart.style.transform = `translateY(-${travel}vh)`;
                heart.style.opacity = '0';
            });
            setTimeout(() => heart.remove(), 3400);
            if (Date.now() - start <= durationMs) setTimeout(spawn, 120);
        };
        spawn();

        setTimeout(() => overlay.remove(), durationMs + 800);
    }

    function findAndBindHeart() {
        const footer = document.querySelector('footer');
        if (!footer) return;
        // Find an existing heart character inside the footer and wrap it if needed
        let heartEl = footer.querySelector('[data-footer-heart]');
        if (!heartEl) {
            const tw = document.createTreeWalker(footer, NodeFilter.SHOW_TEXT);
            const re = /[❤️❤♥]/;
            let node;
            while ((node = tw.nextNode())) {
                const t = node.nodeValue || '';
                const idx = t.search(re);
                if (idx !== -1) {
                    const before = document.createTextNode(t.slice(0, idx));
                    const after = document.createTextNode(t.slice(idx + 1));
                    heartEl = document.createElement('span');
                    heartEl.setAttribute('data-footer-heart', '');
                    heartEl.setAttribute('role', 'button');
                    heartEl.setAttribute('aria-label', 'Herz');
                    heartEl.tabIndex = 0;
                    heartEl.style.cursor = 'pointer';
                    heartEl.textContent = t[idx];
                    const parent = node.parentNode;
                    if (!parent) return;
                    parent.replaceChild(after, node);
                    parent.insertBefore(heartEl, after);
                    parent.insertBefore(before, heartEl);
                    break;
                }
            }
        }

        if (!heartEl || heartEl.dataset.eeBound) return;
        heartEl.dataset.eeBound = '1';
        let clicks = 0;
        let timer = null;
        let pressedLong = false; // long-press just opened the menu
        const reset = () => { clicks = 0; if (timer) { clearTimeout(timer); timer = null; } };
        const onActivate = () => {
            if (pressedLong) { // ignore click caused by long-press release
                pressedLong = false;
                reset();
                return;
            }
            clicks += 1;
            if (clicks === 3) {
                showEasterEgg();
                reset();
                return;
            }
            if (timer) clearTimeout(timer);
            timer = setTimeout(reset, 700);
        };
        heartEl.addEventListener('click', onActivate);
        heartEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(); }
        });

        // Hidden games menu: long-press (hold ~1.2s) on the heart
        let pressTimer = null;
        const pressDelay = 1200;
        const showSecretMenu = () => {
            if (document.getElementById('secret-menu')) return;
            pressedLong = true;
            const menu = document.createElement('div');
            menu.id = 'secret-menu';
            menu.style.position = 'fixed';
            menu.style.bottom = '64px';
            menu.style.left = '50%';
            menu.style.transform = 'translateX(-50%)';
            menu.style.background = 'rgba(0,0,0,0.82)';
            menu.style.color = '#fff';
            menu.style.padding = '10px 12px';
            menu.style.borderRadius = '12px';
            menu.style.display = 'inline-flex';
            menu.style.gap = '8px';
            menu.style.zIndex = '2147483647';
            menu.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';
            const link = (href, label) => {
                const a = document.createElement('a');
                a.href = href; a.textContent = label; a.target = '_self';
                a.style.color = '#fff'; a.style.textDecoration = 'none';
                a.style.background = 'rgba(255,255,255,0.12)';
                a.style.padding = '6px 10px'; a.style.borderRadius = '10px';
                a.onmouseenter = () => { a.style.background = 'rgba(255,255,255,0.22)'; };
                a.onmouseleave = () => { a.style.background = 'rgba(255,255,255,0.12)'; };
                return a;
            };
            menu.appendChild(link('../reaction-flow/', 'Reaction Flow'));
            menu.appendChild(link('../sudoku/', 'Sudoku'));
            menu.appendChild(link('../games/space-shooter.html', 'Space Shooter'));
            menu.appendChild(link('../games/tanks.html', 'Mini-Tank-Battle'));
            document.body.appendChild(menu);
            let suppressOnce = true; // ignore the first click after opening
            const close = (e) => {
                if (suppressOnce) { suppressOnce = false; return; }
                if (heartEl.contains(e.target)) return;
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', close, true);
                    document.removeEventListener('keydown', onEsc, true);
                }
            };
            const onEsc = (e) => { if (e.key === 'Escape') close(e); };
            setTimeout(() => {
                document.addEventListener('click', close, true);
                document.addEventListener('keydown', onEsc, true);
            }, 0);
        };
        const startPress = () => { clearTimeout(pressTimer); pressTimer = setTimeout(showSecretMenu, pressDelay); };
        const endPress = () => { clearTimeout(pressTimer); };
        heartEl.addEventListener('mousedown', startPress);
        heartEl.addEventListener('touchstart', startPress, { passive: true });
        heartEl.addEventListener('mouseup', endPress);
        heartEl.addEventListener('mouseleave', endPress);
        heartEl.addEventListener('touchend', endPress);
        heartEl.addEventListener('touchcancel', endPress);
    }

    // Initial bind
    findAndBindHeart();

    // Re-bind on footer content changes (e.g., language toggle)
    const footerNode = document.querySelector('footer');
    if (window.MutationObserver && footerNode) {
        const mo = new MutationObserver(() => findAndBindHeart());
        mo.observe(footerNode, { childList: true, subtree: true, characterData: true });
    }
})();

// --- Theme toggle (light/dark) with persistence ---
(function () {
    const storageKey = 'preferredTheme';

    function getStoredTheme() {
        try { return localStorage.getItem(storageKey); } catch { return null; }
    }

    function storeTheme(theme) {
        try { localStorage.setItem(storageKey, theme); } catch {}
    }

    function detectTheme() {
        const stored = getStoredTheme();
        if (stored === 'dark' || stored === 'light') return stored;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        const t = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', t);
        updateToggleUI();
        return t;
    }

    function labelByLang() {
        const lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
        return lang.startsWith('de') ? 'Theme wechseln' : 'Toggle theme';
    }

    function updateToggleUI() {
        const btn = document.querySelector('[data-theme-toggle]');
        if (!btn) return;
        const current = document.documentElement.getAttribute('data-theme') || detectTheme();
        btn.textContent = current === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('aria-label', labelByLang());
        btn.setAttribute('title', labelByLang());
    }

    function init() {
        const initial = detectTheme();
        applyTheme(initial);
        const btn = document.querySelector('[data-theme-toggle]');
        if (btn) {
            btn.addEventListener('click', () => {
                const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
                const applied = applyTheme(next);
                storeTheme(applied);
            });
        }

        // Keep label in sync when language changes
        if (window.MutationObserver) {
            const mo = new MutationObserver(() => updateToggleUI());
            mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
