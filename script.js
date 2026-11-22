/* ============================================
   AgriServe — Shared JavaScript
   ============================================ */

// ---- Dark Mode ----
const ThemeManager = {
  init() {
    const saved = localStorage.getItem('agri_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateIcon();
  },
  toggle() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('agri_theme', next);
    this.updateIcon();
  },
  updateIcon() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = isDark ? '☀️' : '🌙';
  }
};

// ---- Toast Notifications ----
const Toast = {
  show(message, type = 'success', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type !== 'success' ? type : ''}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.success}</span>
      <span>${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.35s ease forwards';
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }
};

// ---- Cart Manager ----
const Cart = {
  get() { return JSON.parse(localStorage.getItem('agri_cart') || '[]'); },
  save(items) { localStorage.setItem('agri_cart', JSON.stringify(items)); },
  add(item) {
    const cart = this.get();
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({ ...item, qty: 1, addedAt: Date.now() });
    }
    this.save(cart);
    this.updateBadge();
    Toast.show(`${item.name} added to cart!`);
  },
  remove(id) {
    const cart = this.get().filter(c => c.id !== id);
    this.save(cart);
    this.updateBadge();
  },
  clear() { this.save([]); this.updateBadge(); },
  count() { return this.get().reduce((s, c) => s + (c.qty || 1), 0); },
  updateBadge() {
    const badge = document.querySelector('.cart-badge .badge');
    if (badge) badge.textContent = this.count();
  }
};

// ---- Auth Manager ----
const Auth = {
  getUser() { return JSON.parse(localStorage.getItem('agri_user') || 'null'); },
  login(user) { localStorage.setItem('agri_user', JSON.stringify(user)); },
  logout() {
    localStorage.removeItem('agri_user');
    window.location.href = 'index.html';
  },
  isLoggedIn() { return !!this.getUser(); },
  require() {
    if (!this.isLoggedIn()) {
      Toast.show('Please login to continue', 'warning');
      setTimeout(() => window.location.href = 'index.html', 1500);
      return false;
    }
    return true;
  }
};

// ---- Land Data Manager ----
const LandDB = {
  getAll() { return JSON.parse(localStorage.getItem('agri_lands') || '[]'); },
  save(lands) { localStorage.setItem('agri_lands', JSON.stringify(lands)); },
  add(land) {
    const lands = this.getAll();
    land.id = 'land_' + Date.now();
    land.createdAt = new Date().toISOString();
    land.status = 'analyzing';
    lands.push(land);
    this.save(lands);
    // Simulate analysis after 2s
    setTimeout(() => {
      const all = this.getAll();
      const idx = all.findIndex(l => l.id === land.id);
      if (idx > -1) {
        all[idx].status = 'active';
        all[idx].analysis = LandAnalysis.analyze(land);
        this.save(all);
      }
    }, 2000);
    return land;
  },
  getById(id) { return this.getAll().find(l => l.id === id); },
  update(id, data) {
    const lands = this.getAll();
    const idx = lands.findIndex(l => l.id === id);
    if (idx > -1) { lands[idx] = { ...lands[idx], ...data }; this.save(lands); }
  }
};

// ---- Bookings Manager ----
const BookingDB = {
  getAll() { return JSON.parse(localStorage.getItem('agri_bookings') || '[]'); },
  add(booking) {
    const bookings = this.getAll();
    booking.id = 'book_' + Date.now();
    booking.createdAt = new Date().toISOString();
    booking.status = 'confirmed';
    bookings.push(booking);
    localStorage.setItem('agri_bookings', JSON.stringify(bookings));
    return booking;
  }
};

// ---- Land Analysis Engine ----
const LandAnalysis = {
  cropData: {
    clay: {
      crops: ['Rice', 'Wheat', 'Sugarcane', 'Cotton'],
      yieldMultiplier: 1.1,
      risk: 'Low'
    },
    loamy: {
      crops: ['Tomato', 'Maize', 'Soybean', 'Sunflower', 'Vegetables'],
      yieldMultiplier: 1.3,
      risk: 'Low'
    },
    sandy: {
      crops: ['Groundnut', 'Cassava', 'Sweet Potato', 'Watermelon'],
      yieldMultiplier: 0.85,
      risk: 'Medium'
    },
    silt: {
      crops: ['Wheat', 'Barley', 'Mustard', 'Lentils'],
      yieldMultiplier: 1.15,
      risk: 'Low'
    },
    black: {
      crops: ['Cotton', 'Soybean', 'Jowar', 'Sunflower'],
      yieldMultiplier: 1.2,
      risk: 'Low'
    },
    red: {
      crops: ['Groundnut', 'Pulses', 'Millets', 'Tobacco'],
      yieldMultiplier: 0.95,
      risk: 'Medium'
    }
  },

  marketPrices: {
    'Rice': { min: 18000, max: 22000, unit: '₹/ton' },
    'Wheat': { min: 20000, max: 25000, unit: '₹/ton' },
    'Sugarcane': { min: 2800, max: 3200, unit: '₹/ton' },
    'Cotton': { min: 55000, max: 70000, unit: '₹/ton' },
    'Tomato': { min: 12000, max: 25000, unit: '₹/ton' },
    'Maize': { min: 15000, max: 18000, unit: '₹/ton' },
    'Soybean': { min: 38000, max: 45000, unit: '₹/ton' },
    'Sunflower': { min: 42000, max: 50000, unit: '₹/ton' },
    'Vegetables': { min: 15000, max: 30000, unit: '₹/ton' },
    'Groundnut': { min: 50000, max: 60000, unit: '₹/ton' },
    'Cassava': { min: 8000, max: 12000, unit: '₹/ton' },
    'Sweet Potato': { min: 10000, max: 15000, unit: '₹/ton' },
    'Watermelon': { min: 8000, max: 12000, unit: '₹/ton' },
    'Barley': { min: 16000, max: 20000, unit: '₹/ton' },
    'Mustard': { min: 45000, max: 55000, unit: '₹/ton' },
    'Lentils': { min: 55000, max: 70000, unit: '₹/ton' },
    'Jowar': { min: 14000, max: 17000, unit: '₹/ton' },
    'Pulses': { min: 50000, max: 65000, unit: '₹/ton' },
    'Millets': { min: 18000, max: 22000, unit: '₹/ton' },
    'Tobacco': { min: 120000, max: 150000, unit: '₹/ton' },
  },

  analyze(land) {
    const soilInfo = this.cropData[land.soilType] || this.cropData['loamy'];
    const size = parseFloat(land.size) || 1;
    const crops = soilInfo.crops.slice(0, 4);

    const cropAnalysis = crops.map(crop => {
      const price = this.marketPrices[crop] || { min: 20000, max: 30000 };
      const baseYield = 3.5 * soilInfo.yieldMultiplier; // tons per acre
      const totalYield = (baseYield * size).toFixed(1);
      const avgPrice = (price.min + price.max) / 2;
      const revenue = Math.round(avgPrice * totalYield);
      const cost = Math.round(revenue * 0.38);
      const profit = revenue - cost;
      return {
        name: crop,
        yieldPerAcre: baseYield.toFixed(1),
        totalYield,
        revenue,
        cost,
        profit,
        roi: Math.round((profit / cost) * 100),
        season: this.getSeason(crop),
        duration: this.getDuration(crop),
        risk: soilInfo.risk,
        priceRange: `${price.unit} ${price.min.toLocaleString()}–${price.max.toLocaleString()}`,
        suitability: Math.round(70 + Math.random() * 28)
      };
    });

    return {
      crops: cropAnalysis,
      topCrop: cropAnalysis.reduce((a, b) => a.profit > b.profit ? a : b),
      riskLevel: soilInfo.risk,
      soilHealth: Math.round(65 + Math.random() * 30),
      waterRequirement: this.getWaterReq(land.soilType),
      recommendations: this.getRecommendations(land)
    };
  },

  getSeason(crop) {
    const seasons = {
      Rice: 'Kharif', Wheat: 'Rabi', Sugarcane: 'Year-round',
      Cotton: 'Kharif', Tomato: 'Rabi', Maize: 'Kharif',
      Soybean: 'Kharif', Sunflower: 'Rabi', Groundnut: 'Kharif',
      Vegetables: 'Year-round', default: 'Kharif'
    };
    return seasons[crop] || seasons.default;
  },

  getDuration(crop) {
    const durations = {
      Rice: '120–150 days', Wheat: '100–130 days', Sugarcane: '12–18 months',
      Cotton: '150–180 days', Tomato: '80–110 days', Maize: '85–110 days',
      Soybean: '90–120 days', Sunflower: '90–120 days', Groundnut: '90–130 days',
      Vegetables: '60–90 days', default: '90–120 days'
    };
    return durations[crop] || durations.default;
  },

  getWaterReq(soilType) {
    const req = { clay: 'Medium', loamy: 'Medium', sandy: 'High',
      silt: 'Medium-Low', black: 'Medium', red: 'High' };
    return req[soilType] || 'Medium';
  },

  getRecommendations(land) {
    return [
      `Apply organic compost 2 weeks before planting to improve ${land.soilType} soil structure.`,
      'Install drip irrigation to reduce water usage by up to 40%.',
      'Consider crop rotation every 2–3 seasons to maintain soil fertility.',
      'Test soil pH quarterly; target range 6.0–7.0 for optimal nutrient uptake.',
      'Use integrated pest management to reduce chemical input costs.'
    ];
  }
};

// ---- Climate Simulator ----
const Climate = {
  getData(location) {
    const base = {
      temp: Math.round(24 + Math.random() * 14),
      humidity: Math.round(55 + Math.random() * 35),
      rainfall: Math.round(20 + Math.random() * 80),
      windSpeed: Math.round(8 + Math.random() * 20),
      condition: ['Partly Cloudy', 'Sunny', 'Overcast', 'Light Rain'][Math.floor(Math.random() * 4)],
      forecast: []
    };
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const icons = ['☀️','⛅','🌧️','🌤️','☁️','🌦️','⛅'];
    base.forecast = days.map((day, i) => ({
      day,
      icon: icons[Math.floor(Math.random() * icons.length)],
      high: Math.round(base.temp + 2 - Math.random() * 6),
      low:  Math.round(base.temp - 5 - Math.random() * 4),
      rain: Math.round(Math.random() * 60)
    }));
    return base;
  }
};

// ---- Profit Calculator ----
const ProfitCalc = {
  calculate({ cropName, landSize, soilType }) {
    const data = LandAnalysis.marketPrices[cropName] || { min: 20000, max: 30000 };
    const soilMult = (LandAnalysis.cropData[soilType] || { yieldMultiplier: 1 }).yieldMultiplier;
    const yieldPerAcre = 3.5 * soilMult;
    const totalYield = yieldPerAcre * landSize;
    const avgPrice = (data.min + data.max) / 2;
    const revenue = Math.round(avgPrice * totalYield);
    const seedCost    = Math.round(landSize * 3500);
    const fertCost    = Math.round(landSize * 8000);
    const labourCost  = Math.round(landSize * 12000);
    const otherCost   = Math.round(landSize * 4000);
    const totalCost   = seedCost + fertCost + labourCost + otherCost;
    const netProfit   = revenue - totalCost;
    const roi         = Math.round((netProfit / totalCost) * 100);
    return { revenue, totalCost, netProfit, roi, totalYield: totalYield.toFixed(1),
      breakdown: { seedCost, fertCost, labourCost, otherCost } };
  }
};

// ---- Scroll Reveal ----
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

// ---- Page Loader ----
function initLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  setTimeout(() => loader.classList.add('hidden'), 1800);
}

// ---- Nav Active ----
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page);
  });
}

// ---- Format Currency ----
function fmtINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

// ---- Init shared ----
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Cart.updateBadge();
  initLoader();
  setActiveNav();
  initScrollReveal();

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', () => ThemeManager.toggle());

  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', () => {
    window.location.href = 'service.html';
  });

  // Seed demo user if not exists
  if (!Auth.getUser()) {
    Auth.login({ name: 'Arjun Menon', email: 'arjun@agriServe.in', phone: '+91 98765 43210', plan: 'Pro' });
  }

  // Seed demo land if none
  if (LandDB.getAll().length === 0) {
    const demoLand = {
      ownerName: 'Arjun Menon',
      location: 'Palakkad, Kerala',
      size: '4.5',
      soilType: 'loamy',
      irrigation: 'drip',
      notes: 'Well-maintained field with good water access.',
    };
    LandDB.add(demoLand);
    setTimeout(() => {
      const demoLand2 = {
        ownerName: 'Arjun Menon',
        location: 'Thrissur, Kerala',
        size: '2.8',
        soilType: 'clay',
        irrigation: 'flood',
        notes: 'Inherited farmland, transitioning to modern methods.',
      };
      LandDB.add(demoLand2);
    }, 500);
  }

  // Seed demo bookings if none
  if (BookingDB.getAll().length === 0) {
    BookingDB.add({ serviceName: 'Soil Testing', landId: 'demo', date: '2025-06-15', amount: 1500 });
    BookingDB.add({ serviceName: 'Crop Advisory', landId: 'demo', date: '2025-06-22', amount: 2500 });
  }
});