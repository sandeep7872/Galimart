
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
async function fetchProductsFromSheet(page = 1) {
  isLoading = true;
  loadingSpinner.style.display = "flex";
  let url = `${backendURL}?page=${page}`;
  if (currentCategory && currentCategory !== "all") url += `&category=${currentCategory}`;
  if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
  try {
    const res = await fetch(url);
    const newProducts = await res.json();
    newProducts.forEach(p => {
      p.id = parseInt(p.id);
      p.price = parseFloat(p.price);
      p.bulkPrice = parseFloat(p.bulkPrice);
      p.bulkQty = parseInt(p.bulkQty);
      p.inStock = p.inStock === true || p.inStock === "TRUE"  || p.inStock === "true";
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

function resetAndLoad() {
  currentPage = 1;
  products = [];
  allLoaded = false;
  productsContainer.innerHTML = "";
  fetchProductsFromSheet(currentPage);
}
function setupEventListeners() {
  cartBtn.addEventListener("click", () => (cartOverlay.style.display = "flex"));
  closeCartBtn.addEventListener("click", () => (cartOverlay.style.display = "none"));

  searchBtn.addEventListener("click", () => {
    currentSearch = searchInput.value.trim();
    currentCategory = "all"; 
    resetCategoryButtons();  
    resetAndLoad();
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      currentSearch = searchInput.value.trim();
      currentCategory = "all"; 
      resetCategoryButtons();   
      resetAndLoad();
    }
  });
}
function resetCategoryButtons() {
  categoryButtons.forEach((b) => b.classList.remove("active"));
  const allBtn = document.querySelector('[data-category="all"]');
  if (allBtn) allBtn.classList.add("active");
}



  
  categoryBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      resetAndLoad();
    });
  });
  window.addEventListener("scroll", () => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
      !isLoading &&
      !allLoaded
    ) {
      currentPage++;
      fetchProductsFromSheet(currentPage);
    }
  });
}

function renderProducts(productsToRender) {
    productsContainer.innerHTML = '';
    productsToRender.forEach(product => {
    const isDisabled = product.inStock === false;
    const disabledAttr = isDisabled ? 'disabled' : '';
    const stockText = isDisabled ? '<p style="color:red;">Out of Stock</p>' : '';



    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.dataset.category = product.category;

    productCard.innerHTML = `

<div class="product-image" style="position: relative;">
  <img src="${product.image}" alt="${product.name}" loading="lazy" style="width: 150px; height:150px; object-fit: cover;" />
  ${!product.inStock ? `
    <div style="
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(198, 187, 187, 0.83);
      color:black;
      display: flex;
      align-items: center;
      justify-content:center ;
      font-weight: bold;
      font-size: 20px;
      text-align: center;
      z-index: 2;
      border-radius: 300px;
      transform: rotate(-45deg)
    ">OUT OF STOCK</div>` : ''}
     </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">₹${product.price} <small>(Single)</small></p>
        <p class="product-price">₹${product.bulkPrice} <small>(Bulk: ${product.bulkQty} pcs)</small></p>
        <select class="price-type" data-id="${product.id}"${disabledAttr}>
          <option value="single">Single</option>
          <option value="bulk">Bulk</option>
        </select>
        ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
        <div class="quantity-buttons" data-id="${product.id}">
          <button class="qty-minus" data-id="${product.id}"${disabledAttr}>-</button>
          <span class="qty-display" id="qty-${product.id}">0</span>
          <button class="qty-plus" data-id="${product.id}"${disabledAttr}>+</button>
          <button class="add-to-cart" data-id="${product.id}"${disabledAttr}>Add</button>
        </div>
      </div>
    `;

    productsContainer.appendChild(productCard);
  });
}

function setupEventListeners() {
  cartBtn.addEventListener('click', () => cartOverlay.style.display = 'flex');
  closeCartBtn.addEventListener('click', () => cartOverlay.style.display = 'none');
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      resetAndLoad();
    });
  });

  checkoutBtn.addEventListener('click', sendWhatsAppOrder);
  productsContainer.addEventListener('click', handleProductAction);

  window.addEventListener("scroll", () => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
      !isLoading &&
      !allLoaded
    ) {
      currentPage++;
      fetchProductsFromSheet(currentPage);
    }
  });
}


function updateQtyDisplay(id) {
  document.getElementById(`qty-${id}`).textContent = tempQty[id] || 0;
}
function handleProductAction(e) {
  const target = e.target;
  const productId = parseInt(target.dataset.id);

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
    const product = products.find(p => p.id === productId);
    const price = type === 'bulk' ? product.bulkPrice : product.price;
    const bulkQty = type === 'bulk' ? product.bulkQty : 1;

    const existingItem = cart.find(item => item.id === productId && item.type === type);
    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price,
        type,
        bulkQty,
        image: product.image,
        quantity: qty
      });
    }

    tempQty[productId] = 0;
    updateQtyDisplay(productId);
    updateCart();
  }
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
      const div = document.createElement('div');
      div.className = 'cart-item';
      const totalPieces = item.quantity * (item.bulkQty || 1);
      div.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px;" />
          </div>
          <div class="cart-item-details">
            <h4>${item.name} (${item.type}${item.type === 'bulk' ? `: ${item.bulkQty} pcs` : ''})</h4>
            <p>₹${item.price} each</p>
            <p>Subtotal: ₹${item.price * item.quantity}</p>
            <p>Total Pieces: ${totalPieces}</p>
          </div>
        </div>
        <div class="cart-item-actions">
          <input type="number" class="cart-qty-input" data-id="${item.id}" value="${item.quantity}" min="1" style="width: 60px; padding: 4px; text-align: center;" />
          <button class="remove-item" data-id="${item.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      cartItemsContainer.appendChild(div);
    });

    document.querySelectorAll('.cart-qty-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = parseInt(e.target.dataset.id);
        const item = cart.find(i => i.id === id);
        const newQty = parseInt(e.target.value);
        if (item && newQty >= 1) {
          item.quantity = newQty;
        } else if (item && newQty <= 0) {
          cart = cart.filter(i => i.id !== id);
        }
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

function handleSearch() {
  const term = searchInput.value.toLowerCase().trim();
  if (!term) {
    renderProducts(products);
  } else {
    renderProducts(products.filter(p => p.name.toLowerCase().includes(term)));
  }
}

function filterProductsByCategory(category) {
  if (category === 'all') return renderProducts(products);
  renderProducts(products.filter(p => p.category === category));
}

function sendWhatsAppOrder() {
  if (cart.length === 0) return alert('Your cart is empty!');

  const name = document.getElementById("user-name").value;
  const phone = document.getElementById("user-phone").value;
  const address = document.getElementById("user-address").value;
  const area = document.getElementById("user-area").value;

  if (!name || !phone || !address || !area) {
    alert("Please fill all details");
    return;
  }

  localStorage.setItem("user-name", name);
  localStorage.setItem("user-phone", phone);
  localStorage.setItem("user-address", address);
  localStorage.setItem("user-area", area);

  let message = `*Order Details:*
`;
  cart.forEach((item, index) => {
    const totalPieces = item.quantity * (item.bulkQty || 1);
    message += `${index + 1}. ${item.name} (${item.type})
Qty: ${item.quantity}${item.type === 'bulk' ? ` (1 Bulk = ${item.bulkQty} pcs)` : ''}
S.total: ₹${item.quantity * item.price}
`;
  });

  message += `
*Total Amount: ₹${cart.reduce((total, item) => total + item.price * item.quantity, 0)}*

`;
  message += `*Customer Details:*
Name: ${name}
Phone: ${phone}
Area: ${area}
Delivery Address: ${address}
`;

  const whatsappNumber = "916371149008"; // Replace with your number
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');

  cart = [];
  saveCartToStorage();
  updateCart();

   

}

function saveCartToStorage() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCartFromStorage() {
  const stored = localStorage.getItem("cart");
  if (stored) cart = JSON.parse(stored);
}

function autofillUserData() {
  const name = localStorage.getItem("user-name");
  const phone = localStorage.getItem("user-phone");
  const address = localStorage.getItem("user-address");
  const area = localStorage.getItem("user-area");
  if (name) document.getElementById("user-name").value = name;
  if (phone) document.getElementById("user-phone").value = phone;
  if (address) document.getElementById("user-address").value = address;
  if (area) document.getElementById("user-area").value = area;
}

async function init() {
  autofillUserData();
  loadCartFromStorage();
  await fetchProductsFromSheet();
  setupEventListeners();
}

init();
