class I18n {
    constructor() {
        this.currentLang = this.detectLanguage();
        this.translations = {};
        this.init();
    }

    detectLanguage() {
        // Check URL parameter first (highest priority)
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && ['en', 'id', 'ar'].includes(urlLang)) return urlLang;

        // Check localStorage next
        const saved = localStorage.getItem('tawazn-language');
        if (saved && ['en', 'id', 'ar'].includes(saved)) return saved;

        // Check browser language with comprehensive detection
        const browserLang = navigator.language || navigator.userLanguage || '';
        const langLower = browserLang.toLowerCase();

        // Indonesian detection
        if (langLower.startsWith('id') ||
            langLower.includes('indonesia') ||
            langLower.includes('bahasa')) {
            return 'id';
        }

        // Arabic detection
        if (langLower.startsWith('ar') ||
            langLower.includes('arabic') ||
            langLower.includes('العربية')) {
            return 'ar';
        }

        // Check broader language codes
        const primaryLang = browserLang.split('-')[0].toLowerCase();
        if (primaryLang === 'id') return 'id';
        if (primaryLang === 'ar') return 'ar';

        // Default to Indonesian
        return 'id';
    }

    async init() {
        await this.loadTranslations(this.currentLang);
        this.updateLanguage();
        this.setupLanguageSelector();
        this.setupRTL();
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`translations/${lang}.json`);
            this.translations = await response.json();
        } catch (error) {
            console.error('Failed to load translations:', error);
            // Fallback to English
            if (lang !== 'en') {
                await this.loadTranslations('en');
            }
        }
    }

    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            value = value?.[k];
        }

        if (typeof value === 'string') {
            // Replace parameters in the string
            return value.replace(/\{\{(\w+)\}\}/g, (match, param) => params[param] || match);
        }

        return value || key; // Return key as fallback
    }

    async setLanguage(lang) {
        if (lang === this.currentLang) return;

        this.currentLang = lang;
        localStorage.setItem('tawazn-language', lang);

        await this.loadTranslations(lang);
        this.updateLanguage();
        this.setupRTL();

        // Update language selector display
        this.updateLanguageSelectorDisplay();

        // Update all buttons
        this.updateAllButtons();

        // Update URL parameter
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url);

        // Emit event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    updateLanguage() {
        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang;

        // Update title
        document.title = this.t('meta.title');
        document.querySelector('meta[name="description"]').content = this.t('meta.description');

        // Update all translatable elements
        this.updateNavigation();
        this.updateHero();
        this.updateTimeCapsule();
        this.updateFeatures();
        this.updateImpact();
        this.updatePricing();
        this.updateCTA();
        this.updateFooter();
        this.updateModal();
    }

    updateNavigation() {
        this.updateText('nav a[href="#features"]', 'navigation.features');
        this.updateText('nav a[href="#impact"]', 'navigation.impact');
        this.updateText('nav a[href="#pricing"]', 'navigation.pricing');
        this.updateText('nav .btn-primary', 'navigation.writeResolution');
    }

    updateHero() {
        this.updateText('.hero-badge', 'hero.badge');
        this.updateHeroTitle();
        this.updateText('.hero-subtitle', 'hero.subtitle');
        this.updateText('.hero-actions .btn-primary', 'hero.writeResolutionBtn');
        this.updateText('.hero-actions .btn-secondary', 'hero.seeFeaturesBtn');

        this.updateText('.sticker-1', 'hero.stickers.timeSaved');
        this.updateText('.sticker-2', 'hero.stickers.charity');
        this.updateText('.sticker-3', 'hero.stickers.noAds');

        this.updateText('.phone-greeting', 'hero.phone.greeting');
        this.updateText('.phone-date', 'hero.phone.todayBalance');
        this.updateText('.phone-time-label', 'hero.phone.screenTime');

        // Update phone apps
        this.updatePhoneApps();
    }

    updateHeroTitle() {
        const titleElement = document.querySelector('.hero-title');
        if (titleElement) {
            titleElement.innerHTML = this.t('hero.title');
        }
    }

    updatePhoneApps() {
        // Update Instagram app
        this.updateText('.phone-app:nth-child(1) .phone-app-name', 'hero.phone.apps.instagram.name');
        this.updateText('.phone-app:nth-child(1) .phone-app-status', 'hero.phone.apps.instagram.status');

        // Update Quran app
        this.updateText('.phone-app:nth-child(2) .phone-app-name', 'hero.phone.apps.quran.name');
        this.updateText('.phone-app:nth-child(2) .phone-app-status', 'hero.phone.apps.quran.status');

        // Update Prayer app
        this.updateText('.phone-app:nth-child(3) .phone-app-name', 'hero.phone.apps.prayer.name');
        this.updateText('.phone-app:nth-child(3) .phone-app-status', 'hero.phone.apps.prayer.status');
    }

    updateTimeCapsule() {
        this.updateText('.capsule-title', 'timeCapsule.title');
        this.updateText('.capsule-subtitle', 'timeCapsule.subtitle');

        // Form labels
        this.updateText('label[for="name"]', 'timeCapsule.form.nameLabel');
        this.updateText('label[for="email"]', 'timeCapsule.form.emailLabel');
        this.updateText('label[for="resolution"]', 'timeCapsule.form.resolutionLabel');

        // Form placeholders
        this.updatePlaceholder('#name', 'timeCapsule.form.namePlaceholder');
        this.updatePlaceholder('#email', 'timeCapsule.form.emailPlaceholder');
        this.updatePlaceholder('#resolution', 'timeCapsule.form.resolutionPlaceholder');

        // Prompts
        this.updatePromptTags();

        // Helper text
        this.updateText('.form-helper', 'timeCapsule.form.helper');

        // Note
        this.updateCapsuleNote();

        // Submit button
        this.updateText('.capsule-form .btn-accent', 'timeCapsule.form.submitBtn');

        // Delivery date
        this.updateDeliveryDate();
    }

    updatePromptTags() {
        const prompts = [
            { selector: '.prompt-tag:nth-child(1)', text: 'timeCapsule.form.prompts.lessPhone', prompt: 'timeCapsule.form.promptTexts.lessPhone' },
            { selector: '.prompt-tag:nth-child(2)', text: 'timeCapsule.form.prompts.achievement', prompt: 'timeCapsule.form.promptTexts.achievement' },
            { selector: '.prompt-tag:nth-child(3)', text: 'timeCapsule.form.prompts.letterToSelf', prompt: 'timeCapsule.form.promptTexts.letterToSelf' },
            { selector: '.prompt-tag:nth-child(4)', text: 'timeCapsule.form.prompts.familyFocus', prompt: 'timeCapsule.form.promptTexts.familyFocus' },
            { selector: '.prompt-tag:nth-child(5)', text: 'timeCapsule.form.prompts.spiritualGrowth', prompt: 'timeCapsule.form.promptTexts.spiritualGrowth' }
        ];

        prompts.forEach(({ selector, text, prompt }) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = this.t(text);
                element.setAttribute('data-prompt', this.t(prompt));
            }
        });
    }

    updateCapsuleNote() {
        const noteText = document.querySelector('.capsule-note-text');
        if (noteText) {
            const title = this.t('timeCapsule.form.note.title');
            const text = this.t('timeCapsule.form.note.text');
            noteText.innerHTML = `<strong>${title}</strong> ${text}`;
        }
    }

    updateDeliveryDate() {
        const deliveryDate = document.querySelector('.delivery-date');
        if (deliveryDate) {
            const label = this.t('timeCapsule.form.deliveryDate');
            const date = this.t('timeCapsule.form.deliveryDateValue');
            deliveryDate.innerHTML = `${label}<strong>${date}</strong>`;
        }
    }

    updateFeatures() {
        this.updateText('.section-header .section-tag', 'features.tag');
        this.updateText('.section-header .section-title', 'features.title');
        this.updateText('.section-header .section-subtitle', 'features.subtitle');

        // Features introduction
        this.updateFeaturesIntro();

        // Feature cards
        this.updateFeatureCards();
    }

    updateFeaturesIntro() {
        this.updateText('.features-intro-text', 'features.intro');
    }

    updateFeatureCards() {
        const cards = this.t('features.cards');
        const featureCards = document.querySelectorAll('.feature-card');

        featureCards.forEach((card, index) => {
            if (cards[index]) {
                const titleElement = card.querySelector('.feature-title');
                const descElement = card.querySelector('.feature-desc');

                if (titleElement) titleElement.textContent = cards[index].title;
                if (descElement) descElement.textContent = cards[index].desc;
            }
        });
    }

    updateImpact() {
        this.updateText('.impact .section-tag', 'impact.tag');
        this.updateText('.impact-content h2', 'impact.title');
        this.updateImpactContent();
        this.updateImpactStatBox();
        this.updateImpactCauses();
    }

    updateImpactContent() {
        const paragraphs = document.querySelectorAll('.impact-content p');
        if (paragraphs[0]) {
            paragraphs[0].innerHTML = this.t('impact.paragraph1');
        }
        if (paragraphs[1]) {
            paragraphs[1].innerHTML = this.t('impact.paragraph2');
        }
    }

    updateImpactStatBox() {
        this.updateText('.impact-stat-label', 'impact.statLabel');
        this.updateText('.impact-stat-number', 'impact.statNumber');
        this.updateText('.impact-stat-desc', 'impact.statDesc');
    }

    updateImpactCauses() {
        const causes = [
            { selector: '.cause-tag:nth-child(1)', key: 'impact.causes.education' },
            { selector: '.cause-tag:nth-child(2)', key: 'impact.causes.water' },
            { selector: '.cause-tag:nth-child(3)', key: 'impact.causes.food' },
            { selector: '.cause-tag:nth-child(4)', key: 'impact.causes.health' }
        ];

        causes.forEach(({ selector, key }) => {
            this.updateText(selector, key);
        });
    }

    updatePricing() {
        this.updateText('.pricing .section-header .section-tag', 'pricing.tag');
        this.updateText('.pricing .section-header .section-title', 'pricing.title');
        this.updateText('.pricing .section-header .section-subtitle', 'pricing.subtitle');

        // Pricing cards
        this.updatePricingCards();
    }

    updatePricingCards() {
        const cards = this.t('pricing.cards');
        const pricingCards = document.querySelectorAll('.pricing-card');

        pricingCards.forEach((card, index) => {
            if (cards[index]) {
                const cardData = cards[index];

                // Update name
                const nameElement = card.querySelector('.pricing-name');
                if (nameElement) nameElement.textContent = cardData.name;

                // Update price
                const amountElement = card.querySelector('.pricing-amount');
                const periodElement = card.querySelector('.pricing-period');
                if (amountElement) amountElement.textContent = cardData.price;
                if (periodElement) periodElement.textContent = cardData.period;

                // Update badge
                const badgeElement = card.querySelector('.pricing-badge');
                if (badgeElement && cardData.badge) {
                    badgeElement.textContent = cardData.badge;
                    badgeElement.style.display = 'block';
                } else if (badgeElement && !cardData.badge) {
                    badgeElement.style.display = 'none';
                }

                // Update features
                this.updatePricingFeatures(card, cardData.features);

                // Update button
                const buttonElement = card.querySelector('.btn');
                if (buttonElement) buttonElement.textContent = cardData.button;
            }
        });
    }

    updatePricingFeatures(card, features) {
        const featureList = card.querySelector('.pricing-features');
        if (featureList) {
            featureList.innerHTML = features.map(feature =>
                `<li><span class="pricing-check">✓</span> ${feature}</li>`
            ).join('');
        }
    }

    updateCTA() {
        this.updateText('.cta-title', 'cta.title');
        this.updateText('.cta-subtitle', 'cta.subtitle');
        this.updatePlaceholder('.cta-input', 'cta.placeholder');
        this.updateText('.cta-form .btn-accent', 'cta.button');
    }

    updateFooter() {
        this.updateText('.footer-brand p', 'footer.description');

        // Footer columns
        this.updateFooterColumns();

        // Copyright
        this.updateText('.footer-copyright', 'footer.copyright');
    }

    updateFooterColumns() {
        const columns = ['product', 'company', 'legal'];
        columns.forEach((column, index) => {
            const columnElement = document.querySelectorAll('.footer-column')[index];
            if (columnElement) {
                const titleElement = columnElement.querySelector('h4');
                const links = this.t(`footer.columns.${column}.links`);

                if (titleElement) titleElement.textContent = this.t(`footer.columns.${column}.title`);

                const listElement = columnElement.querySelector('ul');
                if (listElement) {
                    listElement.innerHTML = links.map(link =>
                        `<li><a href="#${link.toLowerCase()}">${link}</a></li>`
                    ).join('');
                }
            }
        });
    }

    updateModal() {
        this.updateText('.modal-title', 'modal.title');
        this.updateText('.modal-message', 'modal.message');
        this.updateModalDeliveryDate();
    }

    updateModalDeliveryDate() {
        const modalDate = document.querySelector('.modal-date');
        if (modalDate) {
            const label = this.t('modal.deliveryLabel');
            const date = this.t('modal.deliveryDate');
            modalDate.innerHTML = `${label}<strong>${date}</strong>`;
        }
    }

    updateText(selector, key) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = this.t(key);
        }
    }

    updatePlaceholder(selector, key) {
        const element = document.querySelector(selector);
        if (element) {
            element.placeholder = this.t(key);
        }
    }

    setupLanguageSelector() {
        // Create language selector if it doesn't exist
        if (!document.querySelector('.language-selector')) {
            const isMobile = window.innerWidth <= 768;
            const target = isMobile ?
                document.querySelector('.nav-container') :
                document.querySelector('.nav-links');

            if (target) {
                const selector = this.createLanguageSelector();
                target.appendChild(selector);
            }
        }

        // Update selector display immediately
        this.updateLanguageSelectorDisplay();

        // Also update all buttons immediately
        this.updateAllButtons();
    }

    createLanguageSelector() {
        const selector = document.createElement('div');
        selector.className = 'language-selector';
        selector.innerHTML = `
            <button class="language-btn">
                <span class="language-name"></span>
                <span class="language-arrow">▼</span>
            </button>
            <div class="language-dropdown">
                <button data-lang="en" class="language-option">
                    <span>EN</span>
                </button>
                <button data-lang="id" class="language-option">
                    <span>ID</span>
                </button>
                <button data-lang="ar" class="language-option">
                    <span>AR</span>
                </button>
            </div>
        `;

        // Add event listeners
        const btn = selector.querySelector('.language-btn');
        const dropdown = selector.querySelector('.language-dropdown');
        const options = selector.querySelectorAll('.language-option');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                const lang = option.getAttribute('data-lang');
                this.setLanguage(lang);
                dropdown.classList.remove('show');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });

        return selector;
    }

    updateLanguageSelectorDisplay() {
        const btn = document.querySelector('.language-btn');

        if (btn) {
            const nameElement = btn.querySelector('.language-name');
            if (nameElement) nameElement.textContent = this.getLanguageName(this.currentLang);
        }
    }

    updateAllButtons() {
        // Update all buttons that might have text content
        this.updateText('.btn-primary', 'navigation.writeResolution');
        this.updateText('.btn-secondary', 'hero.seeFeaturesBtn');
        this.updateText('.btn-accent', 'timeCapsule.form.submitBtn');
        this.updateText('.cta .btn-accent', 'cta.button');

        // Update buttons in feature cards
        document.querySelectorAll('.pricing-card .btn').forEach((btn, index) => {
            const cards = this.t('pricing.cards');
            if (cards[index] && cards[index].button) {
                btn.textContent = cards[index].button;
            }
        });

        // Update form buttons
        this.updateText('.capsule-form .btn-accent', 'timeCapsule.form.submitBtn');
    }

    getLanguageName(lang) {
        return this.t(`languages.${lang}.short`) || lang.toUpperCase();
    }

    setupRTL() {
        if (this.currentLang === 'ar') {
            document.body.setAttribute('dir', 'rtl');
            document.body.classList.add('rtl');
        } else {
            document.body.removeAttribute('dir');
            document.body.classList.remove('rtl');
        }
    }

    // Method to get current language
    getCurrentLanguage() {
        return this.currentLang;
    }

    // Method to get available languages
    getAvailableLanguages() {
        return [
            { code: 'en', name: 'EN' },
            { code: 'id', name: 'ID' },
            { code: 'ar', name: 'AR' }
        ];
    }

    // Method to handle language selector relocation on resize
    handleLanguageSelectorResize() {
        const selector = document.querySelector('.language-selector');
        if (!selector) return;

        const isMobile = window.innerWidth <= 768;
        const currentParent = selector.parentElement;
        const target = isMobile ?
            document.querySelector('.nav-container') :
            document.querySelector('.nav-links');

        // Only relocate if target is different from current parent
        if (target && target !== currentParent) {
            target.appendChild(selector);
        }
    }
}

// Initialize i18n when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();

    // Add resize listener for language selector repositioning
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            window.i18n.handleLanguageSelectorResize();
        }, 150); // Debounce resize events
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
}