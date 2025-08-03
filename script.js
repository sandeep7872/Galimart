let currentPage = 1;
let isLoading = false;
let allLoaded = false;
let currentCategory = "all";
let currentSearch = "";
let products = [];
let cart = [];
let tempQty = {};

const productsContainer = document.getElementById('products-container');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalAmount = document.getElementById('cart-total-amount');
const cartOverlay = document.getElementById('cart-overlay');
const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categoryBtns = document.querySelectorAll('.category-btn');
const checkoutBtn = document.getElementById('checkout-btn');
const loadingSpinner = document.getElementById("loading-spinner");

const backendURL = "https://gmbackend-r0ot.onrender.com/api/products";

// ──────── 📦 PRODUCT FETCH ──────── //
async function fetchProducts(page = 1) {
  isLoading = true;
  loadingSpinner.style.display = "flex";
  let url = `${backendURL}?page=${page}`;
  if (currentCategory !== "all") url += `&category=${currentCategory}`;
  if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;

  try {
    const res = await fetch(url);
    const newProducts = await res.json();

    newProducts.forEach(p => {
      p.id = parseInt(p.id);
      p.price = parseFloat(p.price);
      p.bulkPrice = parseFloat(p.bulkPrice);
      p.bulkQty = parseInt(p.bulkQty);
      p.inStock = p.inStock === true || p.inStock === "TRUE" || p.inStock === "true";
    });

    if (newProducts.length < 250) allLoaded = true;

    products = [...products, ...newProducts];
    renderProducts(newProducts);
    updateCart();
  } catch (err) {
    console.error("Error fetching products:", err);
    productsContainer.innerHTML = '<p style="color:red;">Failed to load products.</p>';
  } finally {
    loadingSpinner.style.display = "none";
    isLoading = false;
  }
}

// ──────── 🧼 RESET ──────── //
function resetAndLoad() {
  currentPage = 1;
  products = [];
  allLoaded = false;
  productsContainer.innerHTML = "";
  fetchProducts(currentPage);
}

function resetCategoryButtons() {
  categoryBtns.forEach(b => b.classList.remove("active"));
  const allBtn = document.querySelector('[data-category="all"]');
  if (allBtn) allBtn.classList.add("active");
}

// ──────── 🖼️ RENDER PRODUCTS ──────── //
function renderProducts(productsToRender) {
  productsContainer.innerHTML = '';
  productsToRender.forEach(product => {
    const isDisabled = !product.inStock;
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.dataset.category = product.category;

    productCard.innerHTML = `
      <div class="product-image" style="position: relative;">
        <img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async" style="width: 150px; height:150px; object-fit: cover; cursor: pointer;" class="enlarge-image" data-src="${product.image}" />
        ${isDisabled ? `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(198,187,187,0.83);display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:20px;border-radius:300px;transform:rotate(-45deg);z-index:2;">OUT OF STOCK</div>` : ''}
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">₹${product.price} <small>(Single)</small></p>
        <p class="product-price">₹${product.bulkPrice} <small>(Bulk: ${product.bulkQty} pcs)</small></p>
        <select class="price-type" data-id="${product.id}" ${isDisabled ? 'disabled' : ''}>
          <option value="single">Single</option>
          <option value="bulk">Bulk</option>
        </select>
        ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
        <div class="quantity-buttons" data-id="${product.id}">
          <button class="qty-minus" data-id="${product.id}" ${isDisabled ? 'disabled' : ''}>-</button>
          <span class="qty-display" id="qty-${product.id}">0</span>
          <button class="qty-plus" data-id="${product.id}" ${isDisabled ? 'disabled' : ''}>+</button>
          <button class="add-to-cart" data-id="${product.id}" ${isDisabled ? 'disabled' : ''}>Add</button>
        </div>
      </div>
    `;
    productsContainer.appendChild(productCard);
  });
}

// Modal open on image click
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('enlarge-image')) {
    const src = e.target.getAttribute('data-src');
    document.getElementById('modalImage').src = src;
    document.getElementById('imageModal').style.display = 'flex';
  }
});

// Close modal when clicking the background
document.getElementById('imageModal').addEventListener('click', function (e) {
  if (e.target.id === 'imageModal') {
    document.getElementById('imageModal').style.display = 'none';
  }
});

// Close modal when clicking the X button
document.getElementById('closeModal').addEventListener('click', function () {
  document.getElementById('imageModal').style.display = 'none';
});



// ──────── 🛒 CART LOGIC ──────── //
function updateQtyDisplay(id) {
  document.getElementById(`qty-${id}`).textContent = tempQty[id] || 0;
}

function getPriceType(productId) {
  const selector = document.querySelector(`.price-type[data-id="${productId}"]`);
  return selector?.value || 'single';
}

function updateCart() {
  cartItemsContainer.innerHTML = '';
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
  } else {
    cart.forEach(item => {
      const totalPieces = item.quantity * (item.bulkQty || 1);
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="cart-item-info">
          <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px;" />
          <div>
            <h4>${item.name} (${item.type}${item.type === 'bulk' ? `: ${item.bulkQty} pcs` : ''})</h4>
            <p>₹${item.price} each</p>
            <p>Subtotal: ₹${item.price * item.quantity}</p>
            <p>Total Pieces: ${totalPieces}</p>
          </div>
        </div>
        <div class="cart-item-actions">
          <input type="number" class="cart-qty-input" data-id="${item.id}" value="${item.quantity}" min="1" style ="width: 60px;
          padding: 4px;text-align: center;">
          <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      cartItemsContainer.appendChild(div);
    });

    document.querySelectorAll('.cart-qty-input').forEach(input => {
      input.addEventListener('change', e => {
        const id = parseInt(e.target.dataset.id);
        const item = cart.find(i => i.id === id);
        const newQty = parseInt(e.target.value);
        if (item && newQty >= 1) item.quantity = newQty;
        else if (item && newQty <= 0) cart = cart.filter(i => i.id !== id);
        updateCart();
      });
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = parseInt(btn.dataset.id);
        cart = cart.filter(i => i.id !== id);
        updateCart();
      });
    });
  }

  cartCount.textContent = cart.length;
  cartTotalAmount.textContent = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  saveCartToStorage();
}

function handleProductAction(e) {
  const target = e.target;
  const productId = parseInt(target.dataset.id);
  const product = products.find(p => p.id === productId);

  if (!product) return;

  if (target.classList.contains('qty-plus')) {
    tempQty[productId] = (tempQty[productId] || 0) + 1;
    updateQtyDisplay(productId);
  } else if (target.classList.contains('qty-minus')) {
    tempQty[productId] = Math.max((tempQty[productId] || 0) - 1, 0);
    updateQtyDisplay(productId);
  } else if (target.classList.contains('add-to-cart')) {
    const qty = tempQty[productId] || 0;
    if (qty <= 0) return alert("Enter quantity greater than 0");

    const type = getPriceType(productId);
    const price = type === 'bulk' ? product.bulkPrice : product.price;
    const bulkQty = type === 'bulk' ? product.bulkQty : 1;

    const existingItem = cart.find(item => item.id === productId && item.type === type);
    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cart.push({ ...product, type, price, bulkQty, quantity: qty });
    }

    tempQty[productId] = 0;
    updateQtyDisplay(productId);
    updateCart();
  }
}

// ──────── 📦 CHECKOUT ──────── //
checkoutBtn.addEventListener("click", async () => {
  const name = document.getElementById("user-name").value.trim();
  const phone = document.getElementById("user-phone").value.trim();
  const address = document.getElementById("user-address").value.trim();
  const area = document.getElementById("user-area").value.trim();

  if (!name || !phone || !address || !area) {
    return alert("Please fill all customer details.");
  }

  if (cart.length === 0) {
    return alert("Your cart is empty!");
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // const orderData = { name, phone, address: `${area}, ${address}`, items: cart, total };

        const simplifiedItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        type: item.type,
      }));
      
      const orderData = {
        name,
        phone,
        address: `${area}, ${address}`,
        items: simplifiedItems,
        total,
      };

  try {
    const res = await fetch("https://gmbackend-r0ot.onrender.com/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error("Failed to save order");
  } catch (err) {
    console.error("Order Save Error:", err);
    return alert("Failed to save order. Try again.");
  }

  localStorage.setItem("user-name", name);
  localStorage.setItem("user-phone", phone);
  localStorage.setItem("user-address", address);
  localStorage.setItem("user-area", area);

  let message = `*Order Summary:*\n`;
  cart.forEach((item, i) => {
    const pieces = item.type === "bulk" ? item.bulkQty * item.quantity : item.quantity;
    message += `${i + 1}. ${item.name} (${item.type})\nQty: ${item.quantity}${item.type === 'bulk' ? ` (1 bulk = ${item.bulkQty})` : ''}\nSubtotal: ₹${item.price * item.quantity}\n\n`;
  });
  message += `*Total: ₹${total}*\n\n*Customer:*\nName: ${name}\nPhone: ${phone}\nArea: ${area}\nAddress: ${address}\n\nTime: ${new Date().toLocaleString()}`;

  window.open(`https://wa.me/916371149008?text=${encodeURIComponent(message)}`, "_blank");

  cart = [];
  saveCartToStorage();
  updateCart();
});

// ──────── 🧠 STORAGE ──────── //
function saveCartToStorage() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCartFromStorage() {
  const stored = localStorage.getItem("cart");
  if (stored) cart = JSON.parse(stored);
}

function autofillUserData() {
  ["name", "phone", "address", "area"].forEach(field => {
    const val = localStorage.getItem(`user-${field}`);
    if (val) document.getElementById(`user-${field}`).value = val;
  });
}

// ──────── 🎯 INIT ──────── //
function setupEventListeners() {
  cartBtn.addEventListener("click", () => (cartOverlay.style.display = "flex"));
  closeCartBtn.addEventListener("click", () => (cartOverlay.style.display = "none"));
  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keypress", e => e.key === "Enter" && handleSearch());

  categoryBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      categoryBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      currentSearch = "";
      resetAndLoad();
    });
  });

  productsContainer.addEventListener("click", handleProductAction);

  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !isLoading && !allLoaded) {
      currentPage++;
      fetchProducts(currentPage);
    }
  });
}
function handleSearch() {
  currentSearch = searchInput.value.trim();
  currentCategory = "all";
  resetCategoryButtons();
  resetAndLoad();
}
async function init() {
  autofillUserData();
  loadCartFromStorage();
  await fetchProducts();
  setupEventListeners();
}
init();
