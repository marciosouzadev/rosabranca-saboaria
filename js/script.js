// Rosa Branca Saboaria — interações e carrinho de compras

(function () {
  'use strict';

  var WHATSAPP_NUMBER = '5547984124211';
  var CART_STORAGE_KEY = 'rbs-cart';

  document.addEventListener('DOMContentLoaded', function () {
    initYear();
    initMobileMenu();
    initProductCards();
    initCart();
  });

  // ---------- Rodapé ----------
  function initYear() {
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // ---------- Menu mobile ----------
  function initMobileMenu() {
    var header = document.querySelector('.site-header');
    var toggle = document.getElementById('menu-toggle');
    var nav = document.getElementById('main-nav');
    if (!toggle || !header || !nav) return;

    toggle.addEventListener('click', function () {
      var isOpen = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- Formatação ----------
  function formatBRL(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function parseBRL(str) {
    return parseFloat(str.replace(',', '.'));
  }

  // ---------- Cards de produto: seletor de tamanho + quantidade ----------
  function initProductCards() {
    var cards = document.querySelectorAll('.product-card');

    cards.forEach(function (card) {
      var sizeBtns = card.querySelectorAll('.size-btn');
      var priceValueEl = card.querySelector('.price-value');
      var qtyValueEl = card.querySelector('.qty-value');
      var qtyMinus = card.querySelector('.qty-minus');
      var qtyPlus = card.querySelector('.qty-plus');
      var addBtn = card.querySelector('.btn-add-cart');

      function getActiveSize() {
        var active = card.querySelector('.size-btn.is-active') || sizeBtns[0];
        return { label: active.dataset.size, price: parseFloat(active.dataset.price) };
      }

      function updatePriceDisplay() {
        var size = getActiveSize();
        if (priceValueEl) priceValueEl.textContent = formatBRL(size.price);
      }

      sizeBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          sizeBtns.forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
          updatePriceDisplay();
        });
      });

      if (qtyMinus && qtyPlus && qtyValueEl) {
        qtyMinus.addEventListener('click', function () {
          var val = parseInt(qtyValueEl.textContent, 10);
          if (val > 1) qtyValueEl.textContent = String(val - 1);
        });
        qtyPlus.addEventListener('click', function () {
          var val = parseInt(qtyValueEl.textContent, 10);
          if (val < 20) qtyValueEl.textContent = String(val + 1);
        });
      }

      if (addBtn) {
        addBtn.addEventListener('click', function () {
          var size = getActiveSize();
          var qty = qtyValueEl ? parseInt(qtyValueEl.textContent, 10) : 1;

          addToCart({
            id: card.dataset.productId,
            name: card.dataset.productName,
            img: card.dataset.productImg,
            size: size.label,
            price: size.price,
            qty: qty
          });

          // feedback visual
          addBtn.classList.add('is-added');
          var originalHTML = addBtn.innerHTML;
          addBtn.innerHTML = 'Adicionado ✓';
          setTimeout(function () {
            addBtn.innerHTML = originalHTML;
            addBtn.classList.remove('is-added');
          }, 1200);

          showToast(qty + 'x ' + card.dataset.productName + ' (' + size.label + ') adicionado ao carrinho');

          // reset quantidade
          if (qtyValueEl) qtyValueEl.textContent = '1';
        });
      }

      updatePriceDisplay();
    });
  }

  // ---------- Carrinho: estado ----------
  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) { /* localStorage indisponível */ }
  }

  var cart = loadCart();

  function addToCart(item) {
    var existing = cart.find(function (i) {
      return i.id === item.id && i.size === item.size;
    });
    if (existing) {
      existing.qty += item.qty;
    } else {
      cart.push(item);
    }
    saveCart(cart);
    renderCart();
    openCart();
  }

  function removeFromCart(id, size) {
    cart = cart.filter(function (i) { return !(i.id === id && i.size === size); });
    saveCart(cart);
    renderCart();
  }

  function updateCartItemQty(id, size, qty) {
    var item = cart.find(function (i) { return i.id === id && i.size === size; });
    if (!item) return;
    item.qty = qty;
    if (item.qty <= 0) {
      removeFromCart(id, size);
      return;
    }
    saveCart(cart);
    renderCart();
  }

  function cartTotal() {
    return cart.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
  }

  function cartCount() {
    return cart.reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  // ---------- Carrinho: UI ----------
  var els = {};

  function initCart() {
    els.overlay = document.getElementById('cart-overlay');
    els.drawer = document.getElementById('cart-drawer');
    els.toggle = document.getElementById('cart-toggle');
    els.close = document.getElementById('cart-close');
    els.continue = document.getElementById('cart-continue');
    els.items = document.getElementById('cart-items');
    els.total = document.getElementById('cart-total');
    els.count = document.getElementById('cart-count');
    els.checkout = document.getElementById('cart-checkout');
    els.openCartCta = document.getElementById('open-cart-cta');
    els.toast = document.getElementById('cart-toast');

    if (els.toggle) els.toggle.addEventListener('click', openCart);
    if (els.close) els.close.addEventListener('click', closeCart);
    if (els.overlay) els.overlay.addEventListener('click', closeCart);
    if (els.continue) els.continue.addEventListener('click', closeCart);

    if (els.openCartCta) {
      els.openCartCta.addEventListener('click', function () {
        if (cart.length > 0) {
          openCart();
        } else {
          var target = document.getElementById('sabonetes');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && els.drawer && els.drawer.classList.contains('is-open')) {
        closeCart();
      }
    });

    renderCart();
  }

  function openCart() {
    if (!els.drawer) return;
    els.overlay.hidden = false;
    els.overlay.getBoundingClientRect(); // força reflow antes da transição
    setTimeout(function () {
      els.overlay.classList.add('is-visible');
      els.drawer.classList.add('is-open');
    }, 10);
    els.drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    if (!els.drawer) return;
    els.overlay.classList.remove('is-visible');
    els.drawer.classList.remove('is-open');
    els.drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(function () {
      if (!els.drawer.classList.contains('is-open')) els.overlay.hidden = true;
    }, 300);
  }

  function renderCart() {
    if (!els.items) return;

    // badge
    var count = cartCount();
    if (els.count) {
      els.count.textContent = String(count);
      els.count.hidden = count === 0;
    }

    // lista
    if (cart.length === 0) {
      els.items.innerHTML =
        '<div class="cart-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' +
        '<p>Seu carrinho está vazio.<br>Escolha seus sabonetes favoritos!</p>' +
        '<a href="#sabonetes" class="btn btn-primary btn-sm" id="cart-empty-link">Ver sabonetes</a>' +
        '</div>';
      var emptyLink = document.getElementById('cart-empty-link');
      if (emptyLink) emptyLink.addEventListener('click', closeCart);
    } else {
      els.items.innerHTML = cart.map(cartItemTemplate).join('');

      els.items.querySelectorAll('.cart-item').forEach(function (row) {
        var id = row.dataset.id;
        var size = row.dataset.size;
        var minus = row.querySelector('.qty-minus');
        var plus = row.querySelector('.qty-plus');
        var qtyEl = row.querySelector('.qty-value');
        var removeBtn = row.querySelector('.cart-item-remove');

        minus.addEventListener('click', function () {
          var v = parseInt(qtyEl.textContent, 10) - 1;
          updateCartItemQty(id, size, v);
        });
        plus.addEventListener('click', function () {
          var v = parseInt(qtyEl.textContent, 10) + 1;
          updateCartItemQty(id, size, v);
        });
        removeBtn.addEventListener('click', function () {
          removeFromCart(id, size);
        });
      });
    }

    // total
    var total = cartTotal();
    if (els.total) els.total.textContent = formatBRL(total);

    // checkout link
    if (els.checkout) {
      els.checkout.href = buildWhatsAppCheckoutUrl();
    }
  }

  function cartItemTemplate(item) {
    var subtotal = item.price * item.qty;
    return (
      '<div class="cart-item" data-id="' + item.id + '" data-size="' + item.size + '">' +
      '<div class="cart-item-media"><img src="' + item.img + '" alt="' + item.name + '" loading="lazy"></div>' +
      '<div class="cart-item-info">' +
      '<p class="cart-item-name">' + item.name + '</p>' +
      '<p class="cart-item-size">' + item.size + ' — ' + formatBRL(item.price) + ' / un.</p>' +
      '<div class="cart-item-controls">' +
      '<div class="qty-stepper">' +
      '<button type="button" class="qty-btn qty-minus" aria-label="Diminuir quantidade">−</button>' +
      '<span class="qty-value">' + item.qty + '</span>' +
      '<button type="button" class="qty-btn qty-plus" aria-label="Aumentar quantidade">+</button>' +
      '</div>' +
      '<span class="cart-item-subtotal">' + formatBRL(subtotal) + '</span>' +
      '<button type="button" class="cart-item-remove" aria-label="Remover item">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>' +
      '</button>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function buildWhatsAppCheckoutUrl() {
    if (cart.length === 0) {
      return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(
        'Olá! Vim pelo site e gostaria de conhecer os sabonetes da Rosa Branca.'
      );
    }

    var lines = ['Olá! Gostaria de fazer o seguinte pedido:', ''];
    cart.forEach(function (item) {
      lines.push(
        item.qty + 'x ' + item.name + ' (' + item.size + ') — ' + formatBRL(item.price * item.qty)
      );
    });
    lines.push('');
    lines.push('Total: ' + formatBRL(cartTotal()));
    lines.push('');
    lines.push('Aguardo confirmação de disponibilidade, pagamento e entrega. Obrigado!');

    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  // ---------- Toast ----------
  var toastTimer = null;
  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      els.toast.classList.remove('is-visible');
    }, 2600);
  }
})();
