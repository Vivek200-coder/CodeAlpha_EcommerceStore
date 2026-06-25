const API = 'http://localhost:3000/api';

let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let allProducts = [];
let currentFilter = 'All';
let detailQty = 1;

// ===== INIT =====
async function init() {
  await loadProducts();
  updateCartCount();
  updateUserStatus();
}

// ===== PRODUCTS FROM BACKEND =====
async function loadProducts() {
  try {
    const res = await fetch(`${API}/products`);
    const data = await res.json();
    allProducts = data.products;
    renderProducts(allProducts);
  } catch (err) {
    showToast('❌ Server se connect nahi ho paya!');
  }
}

function renderProducts(prods) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = prods.map(p => `
    <div class="product-card" onclick="showDetail(${p.id})">
      <div class="product-img">${p.emoji}</div>
      <div class="product-info">
        <div class="product-cat">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div>
          <span class="product-price">₹${p.price.toLocaleString()}</span>
          <span class="product-orig">₹${p.originalPrice.toLocaleString()}</span>
        </div>
        <button class="add-btn" onclick="event.stopPropagation(); addToCart(${p.id})">Add to Cart</button>
      </div>
    </div>
  `).join('');
}

async function filterProducts(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  try {
    const res = await fetch(`${API}/products?category=${cat}`);
    const data = await res.json();
    renderProducts(data.products);
  } catch (err) {
    showToast('❌ Filter kaam nahi kar raha!');
  }
}

async function showDetail(id) {
  try {
    const res = await fetch(`${API}/products/${id}`);
    const data = await res.json();
    const p = data.product;
    detailQty = 1;
    document.getElementById('detail-content').innerHTML = `
      <div class="detail-img">${p.emoji}</div>
      <div class="detail-info">
        <div class="detail-cat">${p.category}</div>
        <h1 class="detail-name">${p.name}</h1>
        <div class="detail-rating">⭐ ${p.rating} / 5</div>
        <div class="detail-price-row">
          <span class="detail-price">₹${p.price.toLocaleString()}</span>
          <span class="detail-orig">₹${p.originalPrice.toLocaleString()}</span>
          <span style="background:#e8f5e9;color:#388e3c;font-size:0.8rem;padding:3px 10px;border-radius:12px;font-weight:700;">
            ${Math.round((p.originalPrice - p.price) / p.originalPrice * 100)}% OFF
          </span>
        </div>
        <div class="qty-row">
          <span style="font-size:0.85rem;color:#888;">Quantity:</span>
          <button class="qty-btn" onclick="changeQty(-1)">−</button>
          <span class="qty-val" id="qty-display">1</span>
          <button class="qty-btn" onclick="changeQty(1)">+</button>
        </div>
        <div style="margin-top:1.5rem;">
          <button class="buy-btn" onclick="addToCart(${p.id}, true)">🛒 Add to Cart</button>
          <button class="wishlist-btn">♡ Wishlist</button>
        </div>
      </div>
    `;
    showPage('detail');
  } catch (err) {
    showToast('❌ Product load nahi hua!');
  }
}

function changeQty(delta) {
  detailQty = Math.max(1, detailQty + delta);
  document.getElementById('qty-display').textContent = detailQty;
}

// ===== CART =====
function addToCart(id, fromDetail = false) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  const qty = fromDetail ? detailQty : 1;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ ...p, qty });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showToast(`✅ ${p.name} cart mein add ho gaya!`);
}

function updateCartCount() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

function renderCart() {
  const el = document.getElementById('cart-content');
  if (!cart.length) {
    el.innerHTML = `<div class="empty-cart"><div class="icon">🛒</div><p>Cart khali hai!</p>
      <button class="hero-btn" style="margin-top:1rem;" onclick="showPage('home')">Shopping karo</button></div>`;
    return;
  }
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal > 2000 ? 0 : 99;
  const discount = Math.round(subtotal * 0.05);
  const total = subtotal + shipping - discount;

  el.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price.toLocaleString()} each</div>
      </div>
      <div class="cart-qty">
        <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">−</button>
        <span style="font-weight:700;">${item.qty}</span>
        <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
      </div>
      <div style="font-weight:700;color:#e94560;min-width:80px;text-align:right;">
        ₹${(item.price * item.qty).toLocaleString()}
      </div>
      <button class="remove-btn" onclick="removeFromCart(${item.id})">✕</button>
    </div>
  `).join('') + `
    <div class="cart-summary">
      <div class="summary-row"><span>Subtotal</span><span>₹${subtotal.toLocaleString()}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:#388e3c;">FREE</span>' : '₹99'}</span></div>
      <div class="summary-row"><span>Discount (5%)</span><span style="color:#388e3c;">−₹${discount.toLocaleString()}</span></div>
      <div class="summary-total"><span>Total</span><span style="color:#e94560;">₹${total.toLocaleString()}</span></div>
      <button class="checkout-btn" onclick="placeOrder()">Order Place Karo →</button>
    </div>
  `;
}

function updateCartQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (item) item.qty = Math.max(1, item.qty + delta);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

// ===== ORDER (BACKEND SE) =====
async function placeOrder() {
  if (!user) { showToast('⚠️ Pehle login karo!'); showPage('auth'); return; }
  try {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        userName: user.name,
        items: cart,
        total: subtotal
      })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('order-id').textContent = data.order.id;
      cart = [];
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      showPage('success');
    }
  } catch (err) {
    showToast('❌ Order place nahi hua!');
  }
}

function continueShopping() { showPage('home'); }

// ===== AUTH (BACKEND SE) =====
async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;
  if (!email || !pass) { showToast('⚠️ Sab fields bharo!'); return; }
  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (data.success) {
      user = data.user;
      localStorage.setItem('user', JSON.stringify(user));
      updateUserStatus();
      showPage('home');
      showToast(`👋 Welcome back, ${user.name}!`);
    } else {
      showToast('❌ ' + data.message);
    }
  } catch (err) {
    showToast('❌ Server se connect nahi ho paya!');
  }
}

async function handleRegister() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const pass = document.getElementById('reg-pass').value;
  if (!name || !email || !pass) { showToast('⚠️ Sab fields bharo!'); return; }
  try {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass })
    });
    const data = await res.json();
    if (data.success) {
      user = data.user;
      localStorage.setItem('user', JSON.stringify(user));
      updateUserStatus();
      showPage('home');
      showToast(`🎉 Welcome, ${user.name}! Account ban gaya!`);
    } else {
      showToast('❌ ' + data.message);
    }
  } catch (err) {
    showToast('❌ Server se connect nahi ho paya!');
  }
}

function updateUserStatus() {
  const nav = document.getElementById('auth-nav');
  const status = document.getElementById('user-status');
  if (user) {
    nav.textContent = 'Logout';
    nav.onclick = logout;
    status.textContent = `👤 ${user.name}`;
  } else {
    nav.textContent = 'Login';
    nav.onclick = () => showPage('auth');
    status.textContent = '';
  }
}

function logout() {
  user = null;
  localStorage.removeItem('user');
  updateUserStatus();
  showToast('👋 Logout ho gaye!');
}

function toggleAuth() {
  const lf = document.getElementById('login-form');
  const rf = document.getElementById('register-form');
  lf.style.display = lf.style.display === 'none' ? 'block' : 'none';
  rf.style.display = rf.style.display === 'none' ? 'block' : 'none';
}

// ===== PAGES =====
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (name === 'cart') renderCart();
  window.scrollTo(0, 0);
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

init();