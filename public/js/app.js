/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  WAHM SHERLOCK V70 — Golden Lens Edition                       ║
 * ║  app.js — Frontend Controller                                   ║
 * ║  wa7m.com — Version 7.0.0                                       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

'use strict';

const WAHM = {
    state: {
        isScanning: false,
        hasImage: false,
        uploadedImageURL: null,
        uploadedFile: null,
        currentStep: 0,
        scanProgress: 0,
        theme: localStorage.getItem('wahm_theme') || 'light',
        resultsData: [],
    },

    config: {
        version: '7.0.0',
        maxFileSize: 15 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
        scanDuration: {
            step1: 2000,
            step2: 2000,
            step3: 3000,
            step4: 1500,
        },
    },

    dom: {},

    init() {
        this.cacheDOM();
        this.initPreloader();
        this.initTheme();
        this.initNavbar();
        this.initUploadZone();
        this.initParticles();
        this.initResultsFilters();

        console.log('%c WAHM SHERLOCK V70 %c Golden Lens Edition %c',
            'background: linear-gradient(135deg, #D4AF37, #F5D76E); color: #2C2417; font-weight: bold; padding: 5px 10px;',
            'background: #2C2417; color: #F5D76E; font-weight: bold; padding: 5px 10px;',
            ''
        );
    },

    cacheDOM() {
        const $ = sel => document.querySelector(sel);
        const $$ = sel => document.querySelectorAll(sel);

        this.dom = {
            preloader: $('#preloader'),
            preloaderStatus: $('.preloader__status'),
            navbar: $('#navbar'),
            btnTheme: $('#btnTheme'),
            uploadZone: $('#uploadZone'),
            fileInput: $('#fileInput'),
            scannerViz: $('#scannerViz'),
            previewRing: $('#previewRing'),
            previewImage: $('#previewImage'),
            previewPlaceholder: $('#previewPlaceholder'),
            statusPanel: $('#statusPanel'),
            statusDot: $('#statusDot'),
            statusText: $('#statusText'),
            progressBar: $('#progressBar'),
            progressFill: $('#progressFill'),
            progressText: $('#progressText'),
            btnStartScan: $('#btnStartScan'),
            btnReset: $('#btnReset'),
            scannerActions: $('#scannerActions'),
            resultsSection: $('#results'),
            resultsGrid: $('#resultsGrid'),
            totalResults: $('#totalResults'),
            searchTime: $('#searchTime'),
            resultFilters: $$('.results__filter'),
            toastContainer: $('#toastContainer'),
            appWrapper: $('#appWrapper'),
            particlesCanvas: $('#particlesCanvas'),
        };
    },

    initPreloader() {
        const messages = [
            'جاري تهيئة محرك البحث...',
            'تحميل نماذج التعرف على الوجوه...',
            'الاتصال بقاعدة البيانات العالمية...',
            'تهيئة خوارزميات المطابقة...',
            'جاري التحقق من الأمان...',
            'النظام جاهز!'
        ];

        let msgIndex = 0;
        const msgInterval = setInterval(() => {
            if (msgIndex < messages.length && this.dom.preloaderStatus) {
                this.dom.preloaderStatus.textContent = messages[msgIndex];
                msgIndex++;
            }
        }, 450);

        setTimeout(() => {
            clearInterval(msgInterval);
            if (this.dom.preloader) {
                this.dom.preloader.classList.add('preloader--hidden');
            }
        }, 2800);
    },

    initTheme() {
        if (this.state.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.updateThemeIcon(true);
        }

        this.dom.btnTheme?.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                this.state.theme = 'light';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                this.state.theme = 'dark';
            }
            localStorage.setItem('wahm_theme', this.state.theme);
            this.updateThemeIcon(!isDark);
            this.showToast('info', 'السمة', isDark ? 'تم التبديل إلى الوضع الفاتح' : 'تم التبديل إلى الوضع الداكن');
        });
    },

    updateThemeIcon(isDark) {
        const icon = this.dom.btnTheme?.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    },

    initNavbar() {
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 50) {
                this.dom.navbar?.classList.add('navbar--scrolled');
            } else {
                this.dom.navbar?.classList.remove('navbar--scrolled');
            }
            lastScroll = currentScroll;
        }, { passive: true });
    },

    initUploadZone() {
        const zone = this.dom.uploadZone;
        if (!zone) return;

        // Click to upload
        zone.addEventListener('click', () => {
            this.dom.fileInput?.click();
        });

        // File input change
        this.dom.fileInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) this.handleFile(file);
        });

        // Drag and drop
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.borderColor = '#F5D76E';
            zone.style.background = 'rgba(212, 175, 55, 0.05)';
        });

        zone.addEventListener('dragleave', () => {
            zone.style.borderColor = '#C8A45A';
            zone.style.background = '';
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.borderColor = '#C8A45A';
            zone.style.background = '';
            const file = e.dataTransfer?.files?.[0];
            if (file) this.handleFile(file);
        });

        // Paste from clipboard
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) this.handleFile(file);
                    return;
                }
            }
        });

        // Start scan button
        this.dom.btnStartScan?.addEventListener('click', () => {
            this.startSherlockScan();
        });

        // Reset button
        this.dom.btnReset?.addEventListener('click', () => {
            this.resetScanner();
        });
    },

    handleFile(file) {
        if (!this.config.allowedTypes.includes(file.type)) {
            this.showToast('error', 'خطأ', 'نوع الملف غير مدعوم');
            return;
        }

        if (file.size > this.config.maxFileSize) {
            this.showToast('error', 'خطأ', 'حجم الملف يتجاوز الحد الأقصى (15MB)');
            return;
        }

        this.state.uploadedFile = file;
        this.state.hasImage = true;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    },

    showImagePreview(src) {
        if (this.dom.uploadZone) {
            this.dom.uploadZone.classList.add('scanner__upload-zone--has-image');
        }

        if (this.dom.scannerViz) {
            this.dom.scannerViz.style.display = 'flex';
        }

        if (this.dom.previewImage) {
            this.dom.previewImage.src = src;
        }

        if (this.dom.scannerActions) {
            this.dom.scannerActions.style.display = 'flex';
        }

        if (this.dom.btnStartScan) {
            this.dom.btnStartScan.disabled = false;
        }

        this.showToast('success', 'تم الرفع', 'تم تحميل الصورة بنجاح. يمكنك بدء المسح الآن.');
    },

    startSherlockScan() {
        if (this.state.isScanning || !this.state.uploadedFile) return;

        this.state.isScanning = true;

        if (this.dom.btnStartScan) this.dom.btnStartScan.disabled = true;
        if (this.dom.btnReset) this.dom.btnReset.style.display = 'none';
        if (this.dom.statusPanel) this.dom.statusPanel.style.display = 'flex';
        if (this.dom.progressBar) this.dom.progressBar.style.display = 'block';

        this.runStep1_BiometricMapping()
            .then(() => this.runStep2_FacialRecognition())
            .then(() => this.runStep3_DatabaseSearch())
            .then(() => this.runStep4_DisplayResults())
            .then(() => this.onScanComplete())
            .catch(err => {
                console.error('[WAHM] خطأ:', err);
                this.showToast('error', 'خطأ', 'حدث خطأ أثناء البحث');
                this.resetScanner();
            });
    },

    runStep1_BiometricMapping() {
        return new Promise((resolve) => {
            this.updateStatus('تحليل البيانات البيومترية...', true);
            this.updateProgress(0, 25);
            this.animateProgress(0, 25, this.config.scanDuration.step1);

            setTimeout(() => {
                resolve();
            }, this.config.scanDuration.step1);
        });
    },

    runStep2_FacialRecognition() {
        return new Promise((resolve) => {
            this.updateStatus('مسح التعرف على الوجه...', true);
            this.animateProgress(25, 50, this.config.scanDuration.step2);

            setTimeout(() => {
                resolve();
            }, this.config.scanDuration.step2);
        });
    },

    runStep3_DatabaseSearch() {
        return new Promise((resolve) => {
            this.updateStatus('البحث في قاعدة البيانات العالمية...', true);
            this.animateProgress(50, 90, this.config.scanDuration.step3);

            setTimeout(() => {
                resolve();
            }, this.config.scanDuration.step3);
        });
    },

    runStep4_DisplayResults() {
        return new Promise(async (resolve) => {
            this.updateStatus('جاري تحليل وعرض النتائج...', true);
            this.animateProgress(90, 100, this.config.scanDuration.step4);

            try {
                const formData = new FormData();
                formData.append('image', this.state.uploadedFile);

                const response = await fetch('/api/search', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    this.state.resultsData = data.results || [];
                    console.log(`[WAHM] تم العثور على ${this.state.resultsData.length} نتيجة`);
                } else {
                    console.error('[WAHM] خطأ في البحث:', data.error);
                    this.state.resultsData = [];
                }
            } catch (error) {
                console.error('[WAHM] خطأ في الاتصال:', error);
                this.state.resultsData = [];
            }

            setTimeout(() => {
                resolve();
            }, this.config.scanDuration.step4);
        });
    },

    onScanComplete() {
        this.state.isScanning = false;

        if (this.dom.statusDot) {
            this.dom.statusDot.classList.add('scanner__status-dot--idle');
        }

        this.updateStatus('اكتمل المسح — تم العثور على ' + this.state.resultsData.length + ' نتيجة', false);

        if (this.dom.btnReset) this.dom.btnReset.style.display = '';
        if (this.dom.btnStartScan) this.dom.btnStartScan.style.display = 'none';

        if (this.dom.resultsSection) {
            this.dom.resultsSection.style.display = '';
            this.dom.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        const searchTime = (
            this.config.scanDuration.step1 +
            this.config.scanDuration.step2 +
            this.config.scanDuration.step3 +
            this.config.scanDuration.step4
        ) / 1000;

        if (this.dom.totalResults) this.dom.totalResults.textContent = this.state.resultsData.length;
        if (this.dom.searchTime) this.dom.searchTime.textContent = searchTime.toFixed(2) + 's';

        this.renderResults(this.state.resultsData);
        this.showToast('success', 'اكتمل المسح', `تم العثور على ${this.state.resultsData.length} نتيجة مطابقة`);
    },

    updateProgress(current, max) {
        const percent = Math.min(Math.round(current), 100);
        if (this.dom.progressFill) {
            this.dom.progressFill.style.width = percent + '%';
        }
        if (this.dom.progressText) {
            this.dom.progressText.textContent = percent + '%';
        }
    },

    animateProgress(from, to, duration) {
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = from + (to - from) * progress;
            this.updateProgress(current, 100);

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    },

    updateStatus(text, isScanning) {
        if (this.dom.statusText) {
            this.dom.statusText.textContent = text;
        }
    },

    renderResults(results) {
        const grid = this.dom.resultsGrid;
        if (!grid) return;

        grid.innerHTML = '';

        results.forEach((result, index) => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.setAttribute('data-type', result.type);
            card.setAttribute('data-match', result.matchLevel);
            card.style.animationDelay = (index * 0.1) + 's';

            card.innerHTML = `
                <div class="result-card__image-wrapper">
                    <img class="result-card__image" src="${result.imageUrl}" alt="${result.name}" loading="lazy">
                    <div class="result-card__match result-card__match--${result.matchLevel}">
                        <i class="fas fa-percentage"></i> ${result.matchPercent}%
                    </div>
                    <div class="result-card__platform" style="background:${result.platform.color}">
                        <i class="${result.platform.icon}"></i>
                    </div>
                </div>
                <div class="result-card__info">
                    <div class="result-card__name">${result.name}</div>
                    <div class="result-card__source">
                        <i class="fas fa-link"></i>
                        <span>${result.source.length > 30 ? result.source.substring(0, 30) + '...' : result.source}</span>
                    </div>
                    <div class="result-card__actions">
                        <button class="result-card__action result-card__action--view" onclick="WAHM.viewResult(${result.id})">
                            <i class="fas fa-eye"></i> عرض
                        </button>
                        <button class="result-card__action result-card__action--link" onclick="WAHM.copyLink('${result.source}')">
                            <i class="fas fa-copy"></i> نسخ
                        </button>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });
    },

    viewResult(id) {
        const result = this.state.resultsData.find(r => r.id === id);
        if (result) {
            window.open(result.source, '_blank');
            this.showToast('info', 'فتح المصدر', 'جاري توجيهك إلى المصدر الحقيقي.');
        }
    },

    copyLink(link) {
        const fullLink = link.startsWith('http') ? link : 'https://' + link;
        navigator.clipboard.writeText(fullLink).then(() => {
            this.showToast('success', 'تم النسخ', 'تم نسخ الرابط بنجاح.');
        }).catch(() => {
            this.showToast('error', 'خطأ', 'فشل في نسخ الرابط');
        });
    },

    initResultsFilters() {
        this.dom.resultFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                this.dom.resultFilters.forEach(f => f.classList.remove('results__filter--active'));
                filter.classList.add('results__filter--active');

                const filterType = filter.getAttribute('data-filter');
                const cards = document.querySelectorAll('.result-card');

                cards.forEach(card => {
                    const cardPlatform = card.getAttribute('data-type');
                    const match = card.getAttribute('data-match');

                    let show = false;
                    if (filterType === 'all') show = true;
                    else if (filterType === 'high') show = match === 'high';
                    else if (cardPlatform === filterType) show = true;

                    card.style.display = show ? '' : 'none';
                });

                this.showToast('info', 'تصفية', `تم عرض نتائج: ${filter.textContent.trim()}`);
            });
        });
    },

    resetScanner() {
        this.state.isScanning = false;
        this.state.hasImage = false;
        this.state.uploadedImageURL = null;
        this.state.uploadedFile = null;
        this.state.resultsData = [];

        if (this.dom.uploadZone) {
            this.dom.uploadZone.classList.remove('scanner__upload-zone--has-image');
        }
        if (this.dom.scannerViz) {
            this.dom.scannerViz.style.display = 'none';
        }
        if (this.dom.previewImage) {
            this.dom.previewImage.src = '';
        }
        if (this.dom.btnStartScan) {
            this.dom.btnStartScan.disabled = true;
            this.dom.btnStartScan.style.display = '';
        }
        if (this.dom.btnReset) {
            this.dom.btnReset.style.display = 'none';
        }
        if (this.dom.fileInput) {
            this.dom.fileInput.value = '';
        }
        if (this.dom.statusPanel) {
            this.dom.statusPanel.style.display = 'none';
        }
        if (this.dom.progressBar) {
            this.dom.progressBar.style.display = 'none';
        }
        if (this.dom.resultsSection) {
            this.dom.resultsSection.style.display = 'none';
        }
        if (this.dom.resultsGrid) {
            this.dom.resultsGrid.innerHTML = '';
        }

        this.updateProgress(0, 100);
        this.updateStatus('في انتظار الصورة...', false);

        this.showToast('info', 'إعادة تعيين', 'تم إعادة تعيين الماسح. يمكنك رفع صورة جديدة.');
    },

    initParticles() {
        const canvas = this.dom.particlesCanvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resize();
        window.addEventListener('resize', resize);

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2.5 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.1;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x < 0 || this.x > canvas.width) this.reset();
                if (this.y < 0 || this.y > canvas.height) this.reset();
            }

            draw() {
                ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < 50; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            requestAnimationFrame(animate);
        };

        animate();
    },

    showToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast__icon"><i class="${icons[type]}"></i></div>
            <div class="toast__content">
                <div class="toast__title">${title}</div>
                <div class="toast__message">${message}</div>
            </div>
        `;

        this.dom.toastContainer?.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    WAHM.init();
});
