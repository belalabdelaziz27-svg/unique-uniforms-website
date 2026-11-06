(function () {
  'use strict';

  /* Mobile menu */
  var menuBtn = document.querySelector('[data-menu-btn]');
  var menu = document.querySelector('[data-menu]');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.documentElement.classList.toggle('menu-open', open);
    menuBtn.querySelector('.menu-btn__label').textContent = open ? 'Close' : 'Menu';
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
    });
    menu.addEventListener('click', function (ev) { if (ev.target.closest('a')) setMenu(false); });
    window.matchMedia('(min-width: 1120px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* Hero: chalk measurements appear one by one when the drawing comes on screen.
     They are visible by default, so nothing is lost if this never runs. */
  var drawing = document.querySelector('.hero__svg');
  if (drawing && drawing.animate && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var seen = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      seen.disconnect();
      var running = [];
      drawing.querySelectorAll('.chalk').forEach(function (line, i) {
        running.push(line.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 450, delay: 150 + i * 300, easing: 'ease-out', fill: 'backwards'
        }));
      });
      /* Safety net: if the browser pauses animation clocks, still show the marks. */
      setTimeout(function () { running.forEach(function (a) { a.cancel(); }); }, 1800);
    }, { threshold: 0.35 });
    seen.observe(drawing);
  }

  /* Price list: search and category filter. Everything is visible without JavaScript. */
  var priceBox = document.querySelector('[data-prices]');
  if (priceBox) {
    var priceInput = priceBox.querySelector('[data-price-search]');
    var priceChips = priceBox.querySelectorAll('[data-price-cat]');
    var priceGroups = priceBox.querySelectorAll('[data-price-group]');
    var priceStatus = priceBox.querySelector('[data-price-status]');
    var priceEmpty = priceBox.querySelector('[data-price-empty]');
    var priceCat = 'all';
    var applyPrices = function () {
      var q = priceInput.value.trim().toLowerCase();
      var words = q ? q.split(/\s+/).map(function (w) {
        return w.length > 4 ? w.replace(/(es|s)$/, '') : w; /* dresses, zippers, trousers */
      }) : [];
      var total = 0;
      priceGroups.forEach(function (g) {
        var n = 0;
        var inCat = priceCat === 'all' || g.getAttribute('data-price-group') === priceCat;
        g.querySelectorAll('[data-search]').forEach(function (r) {
          var hay = r.getAttribute('data-search');
          var show = inCat && words.every(function (w) { return hay.indexOf(w) > -1; });
          r.hidden = !show; if (show) n++;
        });
        g.querySelectorAll('[data-price-sub]').forEach(function (s) {
          s.hidden = !s.querySelector('[data-search]:not([hidden])');
        });
        g.hidden = n === 0;
        if (n && (q || priceCat !== 'all')) g.open = true;
        total += n;
      });
      priceEmpty.hidden = total > 0;
      priceStatus.textContent = (q || priceCat !== 'all') ? total + (total === 1 ? ' price shown' : ' prices shown') : '';
    };
    priceInput.addEventListener('input', applyPrices);
    priceChips.forEach(function (b) {
      b.addEventListener('click', function () {
        priceCat = b.getAttribute('data-price-cat');
        priceChips.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        applyPrices();
      });
    });
    /* On phones, start with one open group so the list isn't a long scroll. */
    if (window.matchMedia('(max-width: 719px)').matches) {
      priceGroups.forEach(function (g, i) { g.open = i === 0; });
    }
  }

  /* Quote form: preselect the industry when arriving from the uniform catalogue. */
  var wanted = new URLSearchParams(location.search).get('industry');
  var industry = document.getElementById('quote-industry');
  if (wanted && industry && [].some.call(industry.options, function (o) { return o.value === wanted; })) {
    industry.value = wanted;
  }

  /* Portfolio filter */
  var filters = document.querySelectorAll('[data-filter]');
  var status = document.querySelector('[data-filter-status]');
  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      var cat = b.getAttribute('data-filter'), n = 0;
      filters.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      document.querySelectorAll('.work-item').forEach(function (it) {
        var show = cat === 'all' || it.getAttribute('data-category') === cat;
        it.hidden = !show; if (show) n++;
      });
      if (status) status.textContent = n + (n === 1 ? ' item shown' : ' items shown');
    });
  });

  /* Contact page form switch */
  var tabs = document.querySelectorAll('[data-form-tab]');
  function showTab(id) {
    tabs.forEach(function (t) { t.setAttribute('aria-pressed', String(t.getAttribute('data-form-tab') === id)); });
    document.querySelectorAll('[data-form-panel]').forEach(function (p) { p.hidden = p.id !== id; });
  }
  if (tabs.length) {
    tabs.forEach(function (t) { t.addEventListener('click', function () { showTab(t.getAttribute('data-form-tab')); }); });
    showTab(location.hash === '#tailoring' ? 'tab-personal' : 'tab-business');
  }

  /* Forms: no backend is connected, so nothing is ever reported as "sent". */
  var MESSAGES = {
    required: function (l) { return 'Please enter ' + l + '.'; },
    choose: function (l) { return 'Please choose ' + l + '.'; },
    email: 'Please enter a valid email address, like name@company.com.',
    contact: 'Please enter a phone number or an email address.'
  };
  var NAMES = {
    company: 'your company name', contact: 'your name', email: 'your work email', industry: 'your industry',
    category: 'a garment type', quantity: 'an estimated quantity', name: 'your name',
    contactinfo: 'a phone number or email', service: 'the service you need',
    description: 'a short description of what you need'
  };
  function validate(c) {
    var v = c.value.trim();
    if (c.required && !v) return (c.tagName === 'SELECT' ? MESSAGES.choose : MESSAGES.required)(NAMES[c.name] || 'this field');
    if (c.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return MESSAGES.email;
    if (c.name === 'contactinfo' && v) {
      var digits = v.replace(/\D/g, '');
      if (v.indexOf('@') > -1 ? !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) : digits.length < 7) return MESSAGES.contact;
    }
    return '';
  }
  function show(c, msg) {
    var err = document.getElementById(c.id + '-error');
    var hint = document.getElementById(c.id + '-hint');
    err.textContent = msg; err.hidden = !msg;
    if (msg) {
      c.setAttribute('aria-invalid', 'true');
      c.setAttribute('aria-describedby', (hint ? hint.id + ' ' : '') + err.id);
    } else {
      c.removeAttribute('aria-invalid');
      if (hint) c.setAttribute('aria-describedby', hint.id); else c.removeAttribute('aria-describedby');
    }
  }
  function compose(form) {
    var lines = [], kind = form.getAttribute('data-demo-form');
    lines.push(kind === 'quote' ? 'Corporate uniform quote request' : 'Tailoring enquiry', '');
    form.querySelectorAll('.field').forEach(function (f) {
      var c = f.querySelector('input,select,textarea');
      var v = c.value.trim();
      // data-msg gives the shop a plain label ("Name") instead of the customer-facing one ("Your name")
      if (v) lines.push((f.getAttribute('data-msg') || f.querySelector('label').firstChild.textContent.trim()) + ': ' + v);
    });
    return lines.join('\n');
  }
  document.querySelectorAll('[data-demo-form]').forEach(function (form) {
    var controls = form.querySelectorAll('.field input,.field select,.field textarea');
    var summary = form.querySelector('[data-summary]');
    var result = form.querySelector('[data-result]');
    controls.forEach(function (c) {
      c.addEventListener('blur', function () { if (c.value.trim() || c.hasAttribute('aria-invalid')) show(c, validate(c)); });
      c.addEventListener('input', function () {
        if (c.hasAttribute('aria-invalid')) show(c, validate(c));
        result.hidden = true;
      });
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (form.elements.website && form.elements.website.value) return; /* honeypot */
      var bad = [];
      controls.forEach(function (c) { var m = validate(c); show(c, m); if (m) bad.push({ c: c, m: m }); });
      if (bad.length) {
        result.hidden = true;
        summary.innerHTML = '';
        var h = document.createElement('p');
        h.textContent = bad.length === 1 ? 'Please fix 1 thing before continuing:' : 'Please fix ' + bad.length + ' things before continuing:';
        var ul = document.createElement('ul');
        bad.forEach(function (b) {
          var a = document.createElement('a'); a.href = '#' + b.c.id; a.textContent = b.m;
          a.addEventListener('click', function (e2) { e2.preventDefault(); b.c.focus(); });
          var li = document.createElement('li'); li.appendChild(a); ul.appendChild(li);
        });
        summary.appendChild(h); summary.appendChild(ul);
        summary.hidden = false; summary.focus();
        return;
      }
      summary.hidden = true;
      var text = compose(form);
      var subject = form.getAttribute('data-demo-form') === 'quote' ? 'Uniform quote request' : 'Tailoring enquiry';
      form.querySelector('[data-send="whatsapp"]').href = 'https://wa.me/' + form.getAttribute('data-whatsapp') + '?text=' + encodeURIComponent(text);
      form.querySelector('[data-send="email"]').href = 'mailto:' + form.getAttribute('data-email') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
      result.hidden = false; result.focus();
    });
  });

  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
