// src/App.jsx
import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";

const THEME = {
  dark: "#072a22",
  gold: "#caa33a",
};

// Safe localStorage parse
function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error("safeParse error for", key, err);
    return fallback;
  }
}

// ----------------- Global Styles (UPDATED) -----------------
function GlobalStyles() {
  const css = `
    :root{
      --brand-dark: ${THEME.dark};
      --brand-gold: ${THEME.gold};
      --muted: rgba(255,255,255,0.8);
      --card-bg: rgba(255,255,255,0.02);
      --page-max: 1200px;
      --page-pad: 24px;
    }
      nav a {
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  transition: 0.25s ease;
  font-weight: 500;
}
  .nav-btn-strong {
  background: var(--brand-gold) !important;
  color: #072a22 !important;
  border-color: var(--brand-gold) !important;
  font-weight: 600;
}

.nav-btn-strong:hover {
  background: #e6c55c !important;
}


nav a:hover {
  background: rgba(202,163,58,0.25);
  border-color: rgba(202,163,58,0.55);
  color: var(--brand-gold);
}
s

    /* Base */
    html, body, #root { height: 100%; margin: 0; background: var(--brand-dark); color: white; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }
    *, *::before, *::after { box-sizing: border-box; }

    /* Prevent horizontal overflow (prevents layout shift) */
    body { overflow-x: hidden; min-width: 320px; }

    /* Page container: consistent centering for header, content, footer */
    .page-container { max-width: var(--page-max); margin: 0 auto; padding: 0 var(--page-pad); }

    /* Product grid responsive and centered */
    .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; align-items: start; margin-left: auto; margin-right: auto; }

    /* Prevent flex children overflow issues */
    .page-container > * { min-width: 0; }

    /* Images / iframe safety */
    img, iframe { max-width: 100%; display: block; background: transparent; border: 0; }

    /* Remove unexpected shadows/filters that can create visual blocks */
    * { box-shadow: none !important; filter: none !important; }

    /* Help with GPU compositing artifacts — force layer flatten */
    *, *::before, *::after {
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      will-change: transform, opacity;
    }

    /* Scrollbar styling (cosmetic) */
    ::-webkit-scrollbar { width: 12px; }
    ::-webkit-scrollbar-track { background: var(--brand-dark); }
    ::-webkit-scrollbar-thumb { background: #183b33; border-radius: 10px; border: 3px solid var(--brand-dark); }
    * { scrollbar-width: thin; scrollbar-color: #183b33 var(--brand-dark); }

    /* Accessibility focus */
    button:focus, input:focus, textarea:focus, [tabindex]:focus { outline: 3px solid rgba(202,163,58,0.18); outline-offset: 2px; }

    /* Debug helpers (toggle manually by adding class debug-outline to body if needed) */
    .debug-outline * { outline: 1px dashed rgba(255,255,255,0.04); }
  `;
  return <style>{css}</style>;
}

// ----------------- Mock products -----------------
const PRODUCTS = [
  { id: "sid001", name: "Sidabukke Teh Premium - Classic", price: 150000, short: "Teh hitam premium dengan aroma khas Sidabukke.", desc: "Ditanam di ketinggian, diproses tradisional, menghasilkan rasa kaya dan aftertaste manis.", img: "/images/tehhitam.jpg", rating: 4.6 },
  { id: "sid002", name: "Sidabukke Teh Premium - Greentea", price: 165000, short: "teh hijau premium dengan aroma khas Sidabukke.", desc: "wangi, cocok untuk pagi hari. Dikemas rapi untuk hadiah.", img: "/images/tehhijau.jpg", rating: 4.8 },
  { id: "sid003", name: "Sidabukke Teh Organik - Oolong", price: 195000, short: "Varian organik, dipanen terbatas setiap musim.dengan aroma khas Sidabukke", desc: "Sertifikat organik, aroma floral, body yang seimbang.", img: "/images/tehoolong.jpg", rating: 4.9 },
];

const currency = (v) => "Rp " + v.toLocaleString("id-ID");

// ----------------- Star Rating -----------------
function StarRating({ value = 0, max = 5 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const stars = [];
  for (let i = 0; i < max; i++) {
    if (i < full) stars.push("full");
    else if (i === full && half) stars.push("half");
    else stars.push("empty");
  }
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }} aria-hidden>
      {stars.map((s, idx) => (
        <svg key={idx} width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: THEME.gold }}>
          <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848L19.335 24 12 19.897 4.665 24 6 15.596 0 9.748l8.332-1.73L12 .587z"
            fill={s === "full" ? THEME.gold : s === "half" ? THEME.gold : "none"}
            stroke={THEME.gold}
            strokeWidth="0.8"
          />
          {s === "half" && <path d="M12 .587v19.31L4.665 24 6 15.596 0 9.748l8.332-1.73L12 .587z" fill={THEME.gold} fillOpacity="0.2" />}
        </svg>
      ))}
    </div>
  );
}

// ----------------- Context / Provider -----------------
const AppContext = createContext();
function AppProvider({ children }) {
  const [user, setUser] = useState(() => safeParse("user", null));
  const [cart, setCart] = useState(() => safeParse("cart", []));
  const [orders, setOrders] = useState(() => safeParse("orders", []));

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("user", JSON.stringify(user));
    } catch (err) {
      console.error("Error saving user to localStorage:", err);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem("orders", JSON.stringify(orders));
    } catch (err) {
      console.error("Error saving orders to localStorage:", err);
    }
  }, [orders]);

  const addToCart = (product, qty = 1) => {
    setCart((c) => {
      const idx = c.findIndex((i) => i.id === product.id);
      if (idx >= 0) {
        const copy = [...c];
        copy[idx] = { ...copy[idx], qty: Math.max(1, copy[idx].qty + qty) };
        return copy;
      }
      return [...c, { ...product, qty }];
    });
  };

  const updateQty = (productId, qty) => {
    setCart((c) => c.map((i) => (i.id === productId ? { ...i, qty: Math.max(1, qty) } : i)));
  };

  const removeFromCart = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const clearCart = () => setCart([]);

  const placeOrder = (details) => {
    const order = {
      id: `ORD-${Date.now()}`,
      items: cart,
      total: cart.reduce((s, i) => s + i.price * i.qty, 0),
      details,
      status: "Diproses",
      createdAt: new Date().toISOString(),
    };
    setOrders((o) => [order, ...o]);
    clearCart();
    return order;
  };

  return (
    <AppContext.Provider value={{ user, setUser, cart, addToCart, updateQty, removeFromCart, orders, placeOrder }}>
      {children}
    </AppContext.Provider>
  );
}
function useApp() { return useContext(AppContext); }

// ----------------- Header (UPDATED) -----------------
function Header() {
  const { user, cart } = useApp();
  return (
    <header style={{ backgroundColor: "var(--brand-dark)", position: "sticky", top: 0, zIndex: 60 }}>
      <div className="page-container" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
        <Link to="/" aria-label="Beranda Sidabukke Teh" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", minWidth: 0 }}>
          <img src="public/images/logo.png" alt="Logo Sidabukke Teh" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--brand-gold)", fontFamily: "serif", fontSize: 20, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Sidabukke Teh</div>
            <div style={{ color: "#d9c98a", fontSize: 12 }}>Teh Premium — Ketulusan & Kualitas</div>
          </div>
        </Link>

        <nav aria-label="Main navigation" style={{ display: "flex", gap: 16, alignItems: "center", color: "rgba(255,255,255,0.9)", fontSize: 14, marginLeft: "auto", minWidth: 0 }}>
          <Link to="/products" style={{ whiteSpace: "nowrap" }}>Produk</Link>
          <Link to="/support" style={{ whiteSpace: "nowrap" }}>Support</Link>
          <Link to="/orders" style={{ whiteSpace: "nowrap" }}>Pesanan</Link>

          {user ? (
            <Link to="/account" style={{ padding: "6px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 6 }}>Halo, {user.name}</Link>
          ) : (
            <Link to="/login" className="nav-btn nav-btn-strong">Login</Link>

          )}

          <Link to="/cart" aria-label="Keranjang belanja" style={{ padding: "6px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 6, position: "relative" }}>
            Keranjang
            {cart.length > 0 && <span style={{ marginLeft: 8, backgroundColor: "var(--brand-gold)", color: "black", padding: "2px 6px", borderRadius: 12, fontSize: 12 }}>{cart.length}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}

// ----------------- Footer -----------------
function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--brand-dark)", color: "var(--muted)", marginTop: 40, padding: "28px 0" }}>
      <div className="page-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "var(--brand-gold)", fontWeight: 600 }}>Sidabukke Teh</div>
          <div style={{ fontSize: 13 }}>Filosofi: perhatian terhadap proses dan kualitas.</div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="#" aria-label="Instagram" style={{ color: "var(--brand-gold)", fontSize: 18 }}>IG</a>
          <a href="#" aria-label="Facebook" style={{ color: "var(--brand-gold)", fontSize: 18 }}>FB</a>
          <a href="#" aria-label="Twitter/X" style={{ color: "var(--brand-gold)", fontSize: 18 }}>X</a>
        </div>
      </div>
      <div className="page-container" style={{ marginTop: 12, fontSize: 13 }}>© {new Date().getFullYear()} Sidabukke Teh. All rights reserved.</div>
    </footer>
  );
}

// ----------------- Pages -----------------
function Home() {
  const navigate = useNavigate();
  const { addToCart } = useApp();
  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
        <div>
          <h1 style={{ color: "white", fontSize: 34, marginTop: 8 }}>Sidabukke Teh — Teh Premium</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", marginTop: 12 }}>Setiap cangkir adalah bukti filosofi kami: ketulusan, kehati-hatian, dan rasa yang mendalam.</p>
          <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
            <button onClick={() => navigate('/products')} style={{ padding: "10px 16px", background: "var(--brand-gold)", border: "none", borderRadius: 8 }}>Lihat Produk</button>
            <button onClick={() => addToCart(PRODUCTS[0], 1)} style={{ padding: "10px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "white", borderRadius: 8 }}>Tambah Cepat</button>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", height: 280 }}>
          <img src="public/images/logo.png" alt="Logo Sidabukke Teh" style={{ width: 220, height: 220, objectFit: "contain" }} />
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ color: "var(--brand-gold)", fontSize: 22 }}>Pilihan Populer</h2>
        <div className="product-grid" style={{ marginTop: 16 }}>
          {PRODUCTS.map((p) => (
            <div key={p.id} style={{ padding: 16, borderRadius: 12, background: "linear-gradient(180deg, rgba(202,163,58,0.04), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.06)" }}>
              <img src={p.img} alt={p.name} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }} />
              <div style={{ marginTop: 12 }}>
                <div style={{ color: "white", fontWeight: 600 }}>{p.name}</div>
                <div style={{ color: "rgba(255,255,255,0.8)", marginTop: 6 }}>{p.short}</div>
                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "white", fontWeight: 700 }}>{currency(p.price)}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link to={`/product/${p.id}`} style={{ padding: "6px 10px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "white" }}>Detail</Link>
                    <button onClick={() => addToCart(p, 1)} style={{ padding: "6px 10px", borderRadius: 8, background: "var(--brand-gold)", border: "none" }}>Beli</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Products() {
  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <h2 style={{ color: "var(--brand-gold)", fontSize: 22 }}>Semua Produk</h2>
      <div className="product-grid" style={{ marginTop: 16 }}>
        {PRODUCTS.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </main>
  );
}

function ProductCard({ product }) {
  const { addToCart } = useApp();
  return (
    <article style={{ padding: 16, borderRadius: 12, background: "linear-gradient(180deg, rgba(202,163,58,0.04), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.06)" }}>
      <img src={product.img} alt={product.name} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }} />
      <div style={{ marginTop: 12 }}>
        <div style={{ color: "white", fontWeight: 600 }}>{product.name}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
          <StarRating value={product.rating} />
          <div style={{ color: "rgba(255,255,255,0.8)" }}>{product.rating.toFixed(1)}</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.8)", marginTop: 8 }}>{product.short}</div>
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "white", fontWeight: 700 }}>{currency(product.price)}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to={`/product/${product.id}`} style={{ padding: "6px 10px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "white" }}>Detail</Link>
            <button onClick={() => addToCart(product, 1)} style={{ padding: "6px 10px", borderRadius: 8, background: "var(--brand-gold)", border: "none" }}>Beli</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductDetail() {
  const { id } = useParams();
  const product = PRODUCTS.find((p) => p.id === id);
  const { addToCart } = useApp();
  const [qty, setQty] = useState(1);
  if (!product) return <div style={{ padding: 48 }}>Produk tidak ditemukan.</div>;

  const inc = () => setQty((q) => q + 1);
  const dec = () => setQty((q) => Math.max(1, q - 1));

  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ padding: 20, borderRadius: 12, background: "linear-gradient(180deg, rgba(202,163,58,0.03), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.06)" }}>
          <img src={product.img} alt={product.img} style={{ width: "100%", height: 360, objectFit: "contain" }} />
        </div>

        <div>
          <h1 style={{ color: "white", fontSize: 22 }}>{product.name}</h1>
          <div style={{ color: "var(--brand-gold)", fontWeight: 700, marginTop: 8 }}>{currency(product.price)}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <StarRating value={product.rating} />
            <div style={{ color: "rgba(255,255,255,0.85)" }}>{product.rating.toFixed(1)}</div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.85)", marginTop: 12 }}>{product.desc}</p>

          <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}>
              <button onClick={dec} aria-label="Kurangi jumlah" style={{ padding: "10px 14px", background: "transparent", border: "none", color: "white" }}>-</button>
              <div style={{ padding: "8px 18px", color: "white" }}>{qty}</div>
              <button onClick={inc} aria-label="Tambah jumlah" style={{ padding: "10px 14px", background: "transparent", border: "none", color: "white" }}>+</button>
            </div>

            <button onClick={() => addToCart(product, qty)} style={{ padding: "10px 16px", background: "var(--brand-gold)", border: "none", borderRadius: 8 }}>Tambah ke Keranjang</button>

            <Link to="/checkout" style={{ padding: "10px 16px", background: "#ffffff", color: THEME.dark, borderRadius: 8 }}>Checkout</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Cart() {
  const { cart, removeFromCart, updateQty } = useApp();
  const navigate = useNavigate();
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <h2 style={{ color: "var(--brand-gold)" }}>Keranjang</h2>
      {cart.length === 0 ? (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 12, background: "linear-gradient(180deg, rgba(202,163,58,0.04), rgba(255,255,255,0.01))" }}>Keranjang kosong. <Link to="/products" style={{ color: "white" }}>Belanja sekarang</Link>.</div>
      ) : (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {cart.map((i) => (
            <div key={i.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, borderRadius: 12, background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(202,163,58,0.02))" }}>
              <img src={i.img} alt={i.name} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: "white", fontWeight: 600 }}>{i.name}</div>
                <div style={{ color: "rgba(255,255,255,0.8)", marginTop: 6 }}>{currency(i.price)}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => updateQty(i.id, i.qty - 1)} aria-label={`Kurangi ${i.name}`} style={{ padding: "8px 10px", borderRadius: 8 }}>-</button>
                <div style={{ color: "white", padding: "8px 12px" }}>{i.qty}</div>
                <button onClick={() => updateQty(i.id, i.qty + 1)} aria-label={`Tambah ${i.name}`} style={{ padding: "8px 10px", borderRadius: 8 }}>+</button>
              </div>

              <div style={{ textAlign: "right", color: "white" }}>
                <div style={{ fontWeight: 700 }}>{currency(i.price * i.qty)}</div>
                <button onClick={() => removeFromCart(i.id)} style={{ marginTop: 8, textDecoration: "underline", color: "rgba(255,255,255,0.8)" }}>Hapus</button>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 12, background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(202,163,58,0.02))" }}>
            <div style={{ color: "white", fontWeight: 700 }}>Total: {currency(total)}</div>
            <div>
              <button onClick={() => navigate('/checkout')} disabled={cart.length === 0} style={{ padding: "10px 14px", borderRadius: 8, background: "#ffffff", color: THEME.dark, border: "none" }}>Lanjut ke Checkout</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// === CHECKOUT DENGAN QRIS ===
function Checkout() {
  const { cart, placeOrder, user } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || "",
    address: "",
    phone: "",
  });

  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  // QRIS state
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' or 'qris'
  const [qrisDataUrl, setQrisDataUrl] = useState("");
  const [qrisId, setQrisId] = useState("");

  // Simple QR generator (SVG -> data URL) for demo purposes.
  const generateQris = (amount) => {
    const id = `QRIS-${Date.now()}`;
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'>
        <rect width='100%' height='100%' fill='white' rx='12'/>
        <g fill='#072a22' font-family='Arial, Helvetica, sans-serif'>
          <text x='50%' y='42%' dominant-baseline='middle' text-anchor='middle' font-size='18'>SCAN TO PAY</text>
          <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='14'>${id}</text>
          <text x='50%' y='74%' dominant-baseline='middle' text-anchor='middle' font-size='12'>Rp ${amount.toLocaleString("id-ID")}</text>
        </g>
      </svg>
    `;
    const data = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setQrisId(id);
    setQrisDataUrl(data);
    return { id, data };
  };

  // Auto-generate QR when user selects QRIS
  useEffect(() => {
    if (paymentMethod === "qris") {
      const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
      generateQris(total);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, cart]);

  const submit = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      window.alert("Keranjang kosong");
      return;
    }

    if (paymentMethod === "card") {
      // Demo: store last4 only
      const order = placeOrder({
        ...form,
        payment: { method: "card", card: { last4: card.number.slice(-4) } },
      });
      navigate(`/orders/${order.id}`);
      return;
    }

    // If QRIS form is submitted via other flow (we handle "Saya sudah membayar" separately)
    // but keep guard here
    if (paymentMethod === "qris") {
      const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const q = qrisId ? { id: qrisId, image: qrisDataUrl } : generateQris(total);
      const order = placeOrder({
        ...form,
        payment: { method: "qris", qris: { id: q.id, image: q.data || qrisDataUrl, amount: total } },
      });
      navigate(`/orders/${order.id}`);
      return;
    }
  };

  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <h2 style={{ color: "var(--brand-gold)" }}>Checkout</h2>

      <form onSubmit={submit} style={{ marginTop: 20, display: "grid", gap: 12 }}>
        <div>
          <label htmlFor="name" style={{ color: "rgba(255,255,255,0.85)" }}>Nama</label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            style={{ width: "100%", padding: 10, borderRadius: 8 }}
          />
        </div>

        <div>
          <label htmlFor="address" style={{ color: "rgba(255,255,255,0.85)" }}>Alamat</label>
          <textarea
            id="address"
            required
            value={form.address}
            onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
            style={{ width: "100%", padding: 10, borderRadius: 8 }}
          />
        </div>

        <div>
          <label htmlFor="phone" style={{ color: "rgba(255,255,255,0.85)" }}>No. Telepon</label>
          <input
            id="phone"
            required
            value={form.phone}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            style={{ width: "100%", padding: 10, borderRadius: 8 }}
          />
        </div>

        {/* Payment method selector */}
        <section style={{ marginTop: 8, padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ color: "var(--brand-gold)" }}>Metode Pembayaran</h3>

          <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
              />
              <span style={{ marginLeft: 6 }}>Kartu Debit / Kredit</span>
            </label>

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="radio"
                name="payment"
                value="qris"
                checked={paymentMethod === "qris"}
                onChange={() => setPaymentMethod("qris")}
              />
              <span style={{ marginLeft: 6 }}>QRIS</span>
            </label>
          </div>

          {/* Card inputs */}
          {paymentMethod === "card" && (
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label htmlFor="card-number" style={{ color: "rgba(255,255,255,0.85)" }}>Nomor Kartu</label>
                <input
                  id="card-number"
                  required
                  value={card.number}
                  onChange={(e) => setCard((s) => ({ ...s, number: e.target.value }))}
                  placeholder="1234 1234 1234 1234"
                  style={{ width: "100%", padding: 10, borderRadius: 8 }}
                />
              </div>

              <div>
                <label htmlFor="card-name" style={{ color: "rgba(255,255,255,0.85)" }}>Nama pada Kartu</label>
                <input
                  id="card-name"
                  required
                  value={card.name}
                  onChange={(e) => setCard((s) => ({ ...s, name: e.target.value }))}
                  placeholder="NAMA SESUAI KARTU"
                  style={{ width: "100%", padding: 10, borderRadius: 8 }}
                />
              </div>

              <div>
                <label htmlFor="card-expiry" style={{ color: "rgba(255,255,255,0.85)" }}>Expiry (MM/YY)</label>
                <input
                  id="card-expiry"
                  required
                  value={card.expiry}
                  onChange={(e) => setCard((s) => ({ ...s, expiry: e.target.value }))}
                  placeholder="MM/YY"
                  style={{ width: "100%", padding: 10, borderRadius: 8 }}
                />
              </div>

              <div>
                <label htmlFor="card-cvv" style={{ color: "rgba(255,255,255,0.85)" }}>CVV</label>
                <input
                  id="card-cvv"
                  required
                  value={card.cvv}
                  onChange={(e) => setCard((s) => ({ ...s, cvv: e.target.value }))}
                  placeholder="123"
                  style={{ width: "100%", padding: 10, borderRadius: 8 }}
                />
              </div>
            </div>
          )}

          {/* QRIS preview / action */}
          {paymentMethod === "qris" && (
            <div style={{ marginTop: 12 }}>
              <p style={{ color: "rgba(255,255,255,0.85)" }}>
                Scan QR berikut menggunakan aplikasi e-wallet atau mobile banking Anda.
              </p>

              <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
                {qrisDataUrl ? (
                  <img
                    src={qrisDataUrl}
                    alt={`QRIS ${qrisId}`}
                    style={{ width: 180, height: 180, background: "white", padding: 8, borderRadius: 8 }}
                  />
                ) : (
                  <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                    Mempersiapkan QR...
                  </div>
                )}

                <div>
                  <div style={{ color: "white", fontWeight: 700 }}>
                    Total: {currency(cart.reduce((s, i) => s + i.price * i.qty, 0))}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.8)", marginTop: 6 }}>
                    Setelah scan & bayar, klik "Saya sudah membayar" untuk menyelesaikan pesanan.
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (cart.length === 0) return window.alert("Keranjang kosong");
                        const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
                        const q = qrisId ? { id: qrisId, data: qrisDataUrl } : generateQris(total);
                        const order = placeOrder({
                          ...form,
                          payment: { method: "qris", qris: { id: q.id, image: q.data || qrisDataUrl, amount: total } },
                        });
                        navigate(`/orders/${order.id}`);
                      }}
                      style={{ padding: "10px 16px", borderRadius: 8, background: "var(--brand-gold)", border: "none" }}
                    >
                      Saya sudah membayar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Submit for card */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          {paymentMethod === "card" ? (
            <button type="submit" style={{ padding: "10px 16px", borderRadius: 8, background: "var(--brand-gold)", border: "none" }}>
              Konfirmasi Pesanan
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                window.alert('Silakan scan QRIS dan klik "Saya sudah membayar" setelah melakukan pembayaran.');
              }}
              style={{ padding: "10px 16px", borderRadius: 8, background: "var(--brand-gold)", border: "none" }}
            >
              Buat QRIS
            </button>
          )}
        </div>
      </form>
    </main>
  );
}


// ---------- (rest pages: Login, Register, Forgot, Account, Support, Orders, OrderDetail, Track) ----------
// For brevity these reuse the same patterns as above — include full implementations:

function Login() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = (e) => {
    e.preventDefault();
    setUser({ name: form.email.split("@")[0], email: form.email });
    navigate('/');
  };

  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <div style={{ padding: 18, borderRadius: 12, background: "linear-gradient(180deg, rgba(202,163,58,0.06), rgba(255,255,255,0.01))" }}>
        <h2 style={{ color: "var(--brand-gold)" }}>Login</h2>
        <form onSubmit={submit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <input required placeholder="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} style={{ padding: 10, borderRadius: 8 }} />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} style={{ padding: 10, borderRadius: 8 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button style={{ padding: "8px 12px", borderRadius: 8, background: "var(--brand-gold)", border: "none" }}>Masuk</button>
            <Link to="/forgot" style={{ color: "white" }}>Lupa password?</Link>
          </div>
        </form>
        <div style={{ marginTop: 12, color: "rgba(255,255,255,0.8)" }}>Belum punya akun? <Link to="/register" style={{ color: "var(--brand-gold)" }}>Daftar</Link></div>
      </div>
    </main>
  );
}

function Register() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = (e) => {
    e.preventDefault();
    setUser({ name: form.name, email: form.email });
    navigate('/');
  };

  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <h2 style={{ color: "white" }}>Register</h2>
      <form onSubmit={submit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <input required placeholder="Nama" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} style={{ padding: 10, borderRadius: 8 }} />
        <input required placeholder="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} style={{ padding: 10, borderRadius: 8 }} />
        <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} style={{ padding: 10, borderRadius: 8 }} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={{ padding: "8px 12px", borderRadius: 8, background: "var(--brand-gold)", border: "none" }}>Daftar</button>
        </div>
      </form>
    </main>
  );
}

function Forgot() {
  const [email, setEmail] = useState('');
  const submit = (e) => { e.preventDefault(); window.alert('Link reset password dikirim (demo)'); };
  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <h2 style={{ color: "white" }}>Lupa Password</h2>
      <form onSubmit={submit} style={{ marginTop: 12 }}>
        <input required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10, borderRadius: 8 }} />
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button style={{ padding: "8px 12px", borderRadius: 8, background: "var(--brand-gold)", border: "none" }}>Kirim Link</button>
        </div>
      </form>
    </main>
  );
}

function Account() {
  const { user, setUser, orders } = useApp();
  const navigate = useNavigate();
  if (!user) return <div style={{ padding: 40 }}>Silakan <Link to="/login">login</Link>.</div>;
  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <h2 style={{ color: "white" }}>Akun Saya</h2>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
          <h3>Profil</h3>
          <div style={{ marginTop: 8 }}>Nama: {user.name}</div>
          <div>Email: {user.email}</div>
        </div>

        <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
          <h3>Riwayat Pesanan</h3>
          <div style={{ marginTop: 8 }}>Anda memiliki {orders.length} pesanan.</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            {orders.slice(0,5).map((o) => (
              <div key={o.id} style={{ padding: 8, border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8 }}>
                <div style={{ fontWeight: 700 }}>{o.id}</div>
                <div style={{ fontSize: 13 }}>Total: {currency(o.total)}</div>
                <Link to={`/orders/${o.id}`} style={{ color: "var(--brand-gold)" }}>Lihat</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => { setUser(null); navigate('/'); }} style={{ padding: "8px 12px", borderRadius: 8, background: "var(--brand-gold)", border: "none" }}>Logout</button>
      </div>
    </main>
  );
}

function Support() {
  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <h2 style={{ color: "var(--brand-gold)" }}>Customer Support</h2>
      <p style={{ color: "rgba(255,255,255,0.8)" }}>Hubungi kami via email support@sidabukke.id atau gunakan form di bawah.</p>

      <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: "linear-gradient(180deg, rgba(202,163,58,0.08), rgba(255,255,255,0.02))", border: "1px solid rgba(202,163,58,0.22)" }}>
        <form onSubmit={(e) => { e.preventDefault(); window.alert('Pesan terkirim (demo)'); }} style={{ display: "grid", gap: 8 }}>
          <input placeholder="Nama" aria-label="Nama" style={{ padding: 10, borderRadius: 8 }} />
          <input placeholder="Email" aria-label="Email" style={{ padding: 10, borderRadius: 8 }} />
          <textarea placeholder="Pesan" aria-label="Pesan" style={{ padding: 10, borderRadius: 8 }} />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={{ padding: "8px 12px", borderRadius: 8, background: "var(--brand-gold)", border: "none" }}>Kirim</button>
          </div>
        </form>
      </div>
    </main>
  );
}

function OrdersList() {
  const { orders } = useApp();
  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <h2 style={{ color: "var(--brand-gold)" }}>Lihat Pesanan</h2>
      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {orders.length === 0 ? (
          <div style={{ padding: 12, borderRadius: 12, background: "linear-gradient(180deg, rgba(202,163,58,0.06), rgba(255,255,255,0.01))" }}>Belum ada pesanan.</div>
        ) : (
          orders.map((o) => (
            <div key={o.id} style={{ padding: 12, borderRadius: 12, background: "linear-gradient(180deg, rgba(202,163,58,0.06), rgba(255,255,255,0.01))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, color: "white" }}>{o.id}</div>
                <div style={{ color: "rgba(255,255,255,0.8)" }}>{o.status}</div>
              </div>
              <div style={{ marginTop: 8, color: "rgba(255,255,255,0.8)" }}>Total: {currency(o.total)}</div>
              <Link to={`/orders/${o.id}`} style={{ color: "var(--brand-gold)" }}>Detail</Link>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

function OrderDetail() {
  const { orders } = useApp();
  const { id } = useParams();
  const order = orders.find((o) => o.id === id);
  if (!order) return <div style={{ padding: 40 }}>Pesanan tidak ditemukan.</div>;

  const tracking = order.details?.tracking || {
    currentLocation: "Gudang Sidabukke, Kabupaten",
    eta: "2 hari",
    steps: [
      { key: "packing", label: "Pengemasan", done: true, time: order.createdAt },
      { key: "dispatch", label: "Dikirim dari Gudang", done: order.status !== "Diproses" },
      { key: "in_transit", label: "Dalam Pengantaran", done: order.status === "Dalam Pengantaran" || order.status === "Sampai" },
      { key: "delivered", label: "Sampai Tujuan", done: order.status === "Sampai" },
    ],
  };

  const lat = "-6.200000";
  const lng = "106.816666";

  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <div style={{ padding: 16, borderRadius: 12, background: "linear-gradient(180deg, rgba(202,163,58,0.06), rgba(255,255,255,0.01))" }}>
        <h2 style={{ color: "white" }}>Detail Pesanan {order.id}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.8)" }}>Status: <span style={{ color: "white", fontWeight: 700 }}>{order.status}</span></div>
            <div style={{ color: "rgba(255,255,255,0.8)", marginTop: 8 }}>Total: {currency(order.total)}</div>
            <div style={{ marginTop: 12 }}>Items:</div>
            <ul style={{ marginTop: 8, listStyle: "none", padding: 0 }}>
              {order.items.map((i) => (
                <li key={i.id} style={{ display: "flex", justifyContent: "space-between", color: "white", padding: "6px 0" }}>
                  <div>{i.name} x {i.qty}</div>
                  <div>{currency(i.price * i.qty)}</div>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, color: "white" }}>Alamat Pengiriman</div>
              <div style={{ color: "rgba(255,255,255,0.8)" }}>{order.details?.address || "Alamat tidak tersedia"}</div>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, color: "white" }}>Lacak Pesanan</div>
            <div style={{ color: "rgba(255,255,255,0.8)", marginTop: 6 }}>Lokasi terkini: {tracking.currentLocation} • ETA: {tracking.eta}</div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {tracking.steps.map((s) => (
                <div key={s.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 10, background: s.done ? "#34d399" : "rgba(255,255,255,0.2)" }} />
                  <div style={{ color: "rgba(255,255,255,0.9)" }}>{s.label} {s.time ? <span style={{ color: "rgba(255,255,255,0.7)", marginLeft: 8 }}>• {new Date(s.time).toLocaleString()}</span> : null}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, color: "white" }}>Map Lokasi (Preview)</div>
              <div style={{ marginTop: 8, overflow: "hidden", borderRadius: 8 }}>
                <iframe
                  title="map-tracking"
                  src={"https://www.google.com/maps?q=" + lat + "," + lng + "&z=14&output=embed"}
                  style={{ width: "100%", height: 220, border: 0 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, color: "white" }}>Catatan Pengiriman</div>
          <div style={{ color: "rgba(255,255,255,0.8)" }}>{order.details?.note || "Tidak ada catatan."}</div>
        </div>
      </div>
    </main>
  );
}

function Track() {
  const [orderId, setOrderId] = useState("");
  const { orders } = useApp();
  const found = orders.find((o) => o.id === orderId);
  return (
    <main className="page-container" style={{ padding: "40px 0" }}>
      <h2 style={{ color: "var(--brand-gold)" }}>Lacak Pesanan</h2>
      <form onSubmit={(e) => e.preventDefault()} style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Masukkan ID pesanan" style={{ flex: 1, padding: 10, borderRadius: 8 }} />
        <button style={{ padding: "8px 12px", borderRadius: 8, background: "var(--brand-gold)", border: "none" }}>Lacak</button>
      </form>

      <div style={{ marginTop: 12 }}>
        {orderId && (found ? (
          <div style={{ padding: 12, borderRadius: 8, background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(202,163,58,0.02))" }}>Ditemukan: {found.id} - Status: {found.status}</div>
        ) : (
          <div style={{ color: "rgba(255,255,255,0.8)" }}>Tidak ditemukan pesanan dengan ID tersebut (demo).</div>
        ))}
      </div>
    </main>
  );
}

// ----------------- App Router -----------------
export default function App() {
  return (
    <Router>
      <AppProvider>
        <div style={{ minHeight: "100vh", backgroundColor: THEME.dark }}>
          <GlobalStyles />
          <Header />

          {/* Each page renders its own .page-container; avoid wrapping Routes */}
          <div>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot" element={<Forgot />} />
              <Route path="/account" element={<Account />} />
              <Route path="/support" element={<Support />} />
              <Route path="/orders" element={<OrdersList />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/track" element={<Track />} />
              <Route path="*" element={<div style={{ padding: 40 }}>Halaman tidak ditemukan.</div>} />
            </Routes>

            <Footer />
          </div>
        </div>
      </AppProvider>
    </Router>
  );
}
