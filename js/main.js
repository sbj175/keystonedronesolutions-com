/* ============================================
   Keystone Drone Solutions — Main JS
   Handles: nav, animations, canvas backgrounds
   ============================================ */

(function() {
    'use strict';

    // --- Navigation ---
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    // Scroll-aware nav
    let lastScroll = 0;
    function handleNavScroll() {
        const scrollY = window.scrollY;
        nav.classList.toggle('nav--scrolled', scrollY > 60);
        lastScroll = scrollY;
    }
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();

    // Mobile toggle
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('open');
            document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
        });
        // Close on link click
        navLinks.querySelectorAll('.nav__link').forEach(function(link) {
            link.addEventListener('click', function() {
                navToggle.classList.remove('active');
                navLinks.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Scroll Animations ---
    function initAnimations() {
        var elements = document.querySelectorAll('[data-animate]');
        if (!elements.length) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var delay = parseInt(entry.target.getAttribute('data-delay') || '0', 10);
                    setTimeout(function() {
                        entry.target.classList.add('animated');
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        elements.forEach(function(el) {
            observer.observe(el);
        });
    }
    initAnimations();

    // --- Topographic Canvas Background ---
    function initTopoCanvas(canvasId) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) return;

        var ctx = canvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);

        function resize() {
            var rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        resize();

        // Simple 2D noise for topographic lines
        function noise(x, y) {
            var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            return n - Math.floor(n);
        }

        function smoothNoise(x, y) {
            var ix = Math.floor(x);
            var iy = Math.floor(y);
            var fx = x - ix;
            var fy = y - iy;
            fx = fx * fx * (3 - 2 * fx);
            fy = fy * fy * (3 - 2 * fy);

            var a = noise(ix, iy);
            var b = noise(ix + 1, iy);
            var c = noise(ix, iy + 1);
            var d = noise(ix + 1, iy + 1);

            return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
        }

        function fbm(x, y) {
            var val = 0;
            var amp = 0.5;
            var freq = 1;
            for (var i = 0; i < 4; i++) {
                val += amp * smoothNoise(x * freq, y * freq);
                amp *= 0.5;
                freq *= 2;
            }
            return val;
        }

        function draw() {
            var w = canvas.width / dpr;
            var h = canvas.height / dpr;
            ctx.clearRect(0, 0, w, h);

            var scale = 0.006;
            var levels = 14;
            var step = 8;

            // Draw contour-like lines by scanning
            ctx.lineWidth = 0.6;

            for (var level = 0; level < levels; level++) {
                var threshold = level / levels;
                var alpha = 0.06 + (level % 3 === 0 ? 0.08 : 0);
                ctx.strokeStyle = 'rgba(45, 125, 210, ' + alpha + ')';
                ctx.beginPath();

                for (var y = 0; y < h; y += step) {
                    var started = false;
                    for (var x = 0; x < w; x += 3) {
                        var val = fbm(x * scale + 1.5, y * scale + 0.8);
                        var diff = Math.abs(val - threshold);
                        if (diff < 0.015) {
                            if (!started) {
                                ctx.moveTo(x, y);
                                started = true;
                            } else {
                                ctx.lineTo(x, y);
                            }
                        } else {
                            started = false;
                        }
                    }
                }
                ctx.stroke();
            }

            // Add some subtle coordinate grid dots
            ctx.fillStyle = 'rgba(45, 125, 210, 0.08)';
            for (var gx = 0; gx < w; gx += 60) {
                for (var gy = 0; gy < h; gy += 60) {
                    ctx.beginPath();
                    ctx.arc(gx, gy, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        draw();

        var resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                resize();
                draw();
            }, 200);
        });
    }

    initTopoCanvas('topoCanvas');
    initTopoCanvas('ctaCanvas');

    // --- Form submission success detection ---
    var params = new URLSearchParams(window.location.search);
    if (params.get('submitted') === 'true') {
        var form = document.getElementById('contactForm');
        var success = document.getElementById('formSuccess');
        if (form && success) {
            form.style.display = 'none';
            success.style.display = 'block';
        }
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

})();
