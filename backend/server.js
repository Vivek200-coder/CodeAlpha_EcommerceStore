const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ===== DATABASE (Memory mein) =====
let users = [];
let orders = [];

const products = [
  { id: 1, name: 'Wireless Earbuds Pro', category: 'Electronics', emoji: '🎧', price: 1499, originalPrice: 2499, rating: 4.8 },
  { id: 2, name: 'Smart Watch Series X', category: 'Electronics', emoji: '⌚', price: 3999, originalPrice: 5999, rating: 4.5 },
  { id: 3, name: 'Laptop Stand Bamboo', category: 'Home', emoji: '💻', price: 699, originalPrice: 999, rating: 4.2 },
  { id: 4, name: 'Graphic Tee Collection', category: 'Fashion', emoji: '👕', price: 499, originalPrice: 799, rating: 4.6 },
  { id: 5, name: 'Python Programming Book', category: 'Books', emoji: '📘', price: 399, originalPrice: 599, rating: 4.9 },
  { id: 6, name: 'Yoga Mat Premium', category: 'Sports', emoji: '🧘', price: 899, originalPrice: 1299, rating: 4.3 },
  { id: 7, name: 'Bluetooth Speaker', category: 'Electronics', emoji: '🔊', price: 1999, originalPrice: 2999, rating: 4.7 },
  { id: 8, name: 'Denim Jacket Classic', category: 'Fashion', emoji: '🧥', price: 1299, originalPrice: 1999, rating: 4.4 },
];

// ===== ROUTES =====

// Home route
app.get('/', (req, res) => {
  res.json({ message: '🛍️ ShopNow API is running!', status: 'success' });
});

// GET all products
app.get('/api/products', (req, res) => {
  const { category } = req.query;
  if (category && category !== 'All') {
    const filtered = products.filter(p => p.category === category);
    return res.json({ success: true, products: filtered });
  }
  res.json({ success: true, products });
});

// GET single product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// REGISTER user
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please fill all fields' });
  }

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const newUser = { id: users.length + 1, name, email, password };
  users.push(newUser);

  res.json({ success: true, message: 'Account created!', user: { id: newUser.id, name, email } });
});

// LOGIN user
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  res.json({ success: true, message: 'Login successful!', user: { id: user.id, name: user.name, email } });
});

// GET all users
app.get('/api/users', (req, res) => {
  const safeUsers = users.map(u => ({ id: u.id, name: u.name, email: u.email }));
  res.json({ success: true, users: safeUsers });
});

// PLACE order
app.post('/api/orders', (req, res) => {
  const { userId, userName, items, total } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  const order = {
    id: 'ORD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    userId,
    userName,
    items,
    total,
    status: 'Confirmed',
    date: new Date().toLocaleDateString('en-IN'),
  };

  orders.push(order);
  res.json({ success: true, message: 'Order placed!', order });
});

// GET all orders
app.get('/api/orders', (req, res) => {
  res.json({ success: true, orders });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server chal raha hai: http://localhost:${PORT}`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`👤 Users API:    http://localhost:${PORT}/api/users`);
  console.log(`🛒 Orders API:   http://localhost:${PORT}/api/orders`);
});