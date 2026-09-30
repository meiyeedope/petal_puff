import { useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  UserRound,
  Heart,
  Truck,
  Sparkles,
  HandHeart,
  Plus,
  Minus,
  X,
  Check,
  Search,
  RotateCw,
  BringToFront,
  SendToBack,
  Trash2,
  Copy,
  Move,
  Save,
  Flower2,
  Menu,
} from "lucide-react";
import Bouquet, { FlowerIcon } from "./Bouquet";
import {
  catalog,
  freshDesign,
  designPrice,
  cartPrice,
  money,
  readLocal,
  api,
  getLayerOrder,
  moveLayerOrder,
  toggleExtra,
  type Design,
  type CartItem,
} from "./model";
const steps = ["Size", "Flowers", "Wrapping", "Extras", "Review"];
const navs = [
  ["home", "Home"],
  ["builder", "Build a Bouquet"],
  ["shop", "Ready-Made"],
  ["about", "About Us"],
  ["faq", "FAQ"],
];
const initialPage = () => location.hash.slice(1) || "home";
export default function App() {
  const dialogRef = useRef<HTMLElement>(null);
  const [page, setPage] = useState(initialPage),
    [step, setStep] = useState(0),
    [design, setDesign] = useState<Design>(() =>
      readLocal("pp-draft", freshDesign()),
    ),
    [cart, setCart] = useState<CartItem[]>(() => readLocal("pp-cart", []));
  const [saved, setSaved] = useState<Design[]>(() => readLocal("pp-saved", [])),
    [drawer, setDrawer] = useState<"cart" | "saved" | null>(null),
    [toast, setToast] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All"),
    [sort, setSort] = useState("featured"),
    [selected, setSelected] = useState(""),
    [zoom, setZoom] = useState(1),
    [busy, setBusy] = useState(false),
    [online, setOnline] = useState(false),
    [mobileNav, setMobileNav] = useState(false),
    [orderId, setOrderId] = useState("");
  useEffect(() => {
    const f = () => {
      setPage(initialPage());
      setQuery("");
      setCategory("All");
    };
    window.addEventListener("hashchange", f);
    api("/health")
      .then(() => setOnline(true))
      .catch(() => {});
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("pp-draft", JSON.stringify(design));
      localStorage.setItem("pp-cart", JSON.stringify(cart));
      localStorage.setItem("pp-saved", JSON.stringify(saved));
    } catch {
      setToast(
        "Browser storage is full. Your changes will last for this session only.",
      );
    }
  }, [design, cart, saved]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer(null);
        setMobileNav(false);
      }
    };
    document.addEventListener("keydown", f);
    return () => document.removeEventListener("keydown", f);
  }, []);
  useEffect(() => {
    if (!drawer) return;
    const previous = document.activeElement as HTMLElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]',
      );
      if (!els?.length) return;
      const first = els[0],
        last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [drawer]);
  function go(p: string) {
    location.hash = p;
    setPage(p);
    setCategory("All");
    setQuery("");
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function update(p: Partial<Design>) {
    setDesign((d) => ({ ...d, ...p }));
  }
  const capacity =
    catalog.sizes.find((s) => s.id === design.size)?.capacity || 6;
  const layerOrder = getLayerOrder(
    design.flowers,
    design.extras,
    design.layer_order,
  );
  const selectedLayerIndex = layerOrder.indexOf(selected);
  const selectedFlowerIndex = design.flowers.findIndex(
    (flower) => flower.uid === selected,
  );
  const selectedPlushie = design.extras.find(
    (id) => id === "bear" || id === "bunny",
  );
  function addFlower(id: string) {
    if (design.flowers.length >= capacity) {
      setToast(
        `Your ${design.size} bouquet holds ${capacity} flowers. Remove a flower or choose a larger size.`,
      );
      return;
    }
    const f = catalog.flowers.find((f) => f.id === id)!;
    const i = design.flowers.length;
    const uid = crypto.randomUUID();
    update({
      layer_order: [...layerOrder, uid],
      flowers: [
        ...design.flowers,
        {
          uid,
          id,
          color: f.color,
          x: 155 + (i % 3) * 90,
          y: 160 + Math.floor(i / 3) * 65,
          rotation: ((i % 3) - 1) * 15,
        },
      ],
    });
    setSelected(uid);
  }
  function removeFlower(uid: string) {
    update({
      flowers: design.flowers.filter((f) => f.uid !== uid),
      layer_order: layerOrder.filter((id) => id !== uid),
    });
    if (uid === selected) setSelected("");
  }
  async function save() {
    setSaved((s) => [structuredClone(design), ...s].slice(0, 20));
    if (!online) {
      setToast("Design saved on this device. Find it under My designs.");
      return;
    }
    try {
      await api("/designs", { design });
      setToast("Design saved to your database and this device.");
    } catch {
      setToast("Saved on this device. The database could not be reached.");
    }
  }
  function next() {
    if (step >= 1 && !design.flowers.length) {
      setToast("Add at least one flower to your bouquet.");
      return;
    }
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    if (!design.flowers.length) return;
    setCart((c) => [
      ...c,
      {
        uid: crypto.randomUUID(),
        design: structuredClone(design),
        quantity: 1,
      },
    ]);
    setDrawer("cart");
    setToast("Your bouquet is in the bag!");
  }
  function addProduct(id: string) {
    setCart((c) => {
      const found = c.find((i) => i.product_id === id);
      if (found && found.quantity >= 20) {
        setToast("You can add up to 20 of each bouquet.");
        return c;
      }
      return found
        ? c.map((i) => (i === found ? { ...i, quantity: i.quantity + 1 } : i))
        : [...c, { uid: crypto.randomUUID(), product_id: id, quantity: 1 }];
    });
    setToast("Added to your bag, with love.");
  }
  async function saveOrder() {
    setBusy(true);
    try {
      const signature = JSON.stringify(cart);
      const previous = readLocal<{ key: string; signature: string } | null>(
        "pp-order-request",
        null,
      );
      const key =
        previous?.signature === signature ? previous.key : crypto.randomUUID();
      localStorage.setItem(
        "pp-order-request",
        JSON.stringify({ key, signature }),
      );
      const result = await api("/orders", { request_id: key, items: cart });
      setOrderId(result.id);
      localStorage.removeItem("pp-order-request");
      setCart([]);
      setToast("Your order draft has been saved. No payment has been taken.");
    } catch (e) {
      setToast(
        e instanceof Error
          ? e.message
          : "Could not save the order. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const flowers = catalog.flowers.filter(
    (f) =>
      (category === "All" || category === f.category) &&
      f.name.toLowerCase().includes(query.toLowerCase()),
  );
  const products = catalog.products
    .filter(
      (p) =>
        (category === "All" || category === p.category) &&
        p.name.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : 0,
    );
  const search = (
    <label className="search">
      <Search size={15} />
      <input
        aria-label="Search flowers or bouquets"
        placeholder="What are you looking for?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && (
        <button aria-label="Clear search" onClick={() => setQuery("")}>
          <X size={13} />
        </button>
      )}
    </label>
  );
  function photo(image: string, alt: string, hero = false) {
    return (
      <div className={hero ? "hero-photo" : "product-photo"}>
        <img
          src={image}
          alt={alt}
        />
      </div>
    );
  }
  function productCard(p: (typeof catalog.products)[number]) {
    return (
      <article className="product-card" key={p.id}>
        <button
          className="product-image"
          onClick={() => addProduct(p.id)}
          aria-label={`Add ${p.name} to bag`}
        >
          {photo(p.image, p.name)}
          <span className="image-add">
            <Plus size={18} />
          </span>
        </button>
        <div className="product-info">
          <span className="product-tag">{p.tag}</span>
          <h3>{p.name}</h3>
          <div>
            <span>{money(p.price)}</span>
            <button
              aria-label={`Add ${p.name}`}
              onClick={() => addProduct(p.id)}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </article>
    );
  }
  function options(
    items: { id: string; name: string; price?: number }[],
    value: string,
    onChange: (id: string) => void,
    type: string,
  ) {
    return (
      <div className={"option-grid " + type}>
        {items.map((o, i) => (
          <button
            key={o.id}
            className={"option " + (value === o.id ? "active" : "")}
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
          >
            {value === o.id && (
              <span className="option-check">
                <Check size={11} />
              </span>
            )}
            {type === "sizes" ? (
              <span
                className="size-illustration"
                style={{ fontSize: 28 + i * 6 }}
              >
                ✿
              </span>
            ) : type === "wraps" ? (
              <span
                className={"paper-sample paper-" + i}
                style={{ background: design.color }}
              />
            ) : type === "ribbons" ? (
              <span
                className="ribbon-sample"
                style={{ color: catalog.ribbons[i].color }}
              >
                ୨୧
              </span>
            ) : (
              <span className="extra-icon">{["🧸", "🐰", "♡"][i]}</span>
            )}
            <strong>{o.name}</strong>
            <small>
              {type === "sizes"
                ? `${catalog.sizes[i].capacity} flowers`
                : money(o.price || 0)}
            </small>
          </button>
        ))}
      </div>
    );
  }
  function summary(review = false) {
    return (
      <section className="panel summary">
        <div className="summary-title">
          <span className="eyebrow">MADE BY YOU</span>
          <h3>
            Your bouquet <Flower2 size={17} />
          </h3>
          <span>
            {catalog.sizes.find((s) => s.id === design.size)?.name} ·{" "}
            {design.flowers.length}/{capacity} flowers
          </span>
        </div>
        <div className="summary-items">
          {!design.flowers.length && (
            <p className="empty-hint">
              A little blank canvas.
              <br />
              Let’s fill it with your favourites.
            </p>
          )}
          {design.flowers.map((f) => (
            <div className="summary-row" key={f.uid}>
              <div className="mini-flower">
                <FlowerIcon id={f.id} color={f.color} />
              </div>
              <div>
                <strong>
                  {catalog.flowers.find((x) => x.id === f.id)?.name}
                </strong>
                <small>Handmade bloom</small>
              </div>
              <span>
                {money(catalog.flowers.find((x) => x.id === f.id)!.price)}
              </span>
              <button
                onClick={() => removeFlower(f.uid)}
                aria-label={`Remove ${f.id}`}
              >
                <X size={13} />
              </button>
            </div>
          ))}
          <div className="summary-line">
            <span>
              {catalog.wrappings.find((w) => w.id === design.wrapping)?.name}{" "}
              wrapping
            </span>
            <span>
              {money(
                catalog.wrappings.find((w) => w.id === design.wrapping)!.price,
              )}
            </span>
          </div>
          <div className="summary-line">
            <span>
              {catalog.ribbons.find((r) => r.id === design.ribbon)?.name}
            </span>
            <span>
              {money(
                catalog.ribbons.find((r) => r.id === design.ribbon)!.price,
              )}
            </span>
          </div>
          {design.extras.map((id) => (
            <div className="summary-line" key={id}>
              <span>{catalog.extras.find((x) => x.id === id)?.name}</span>
              <span>
                {money(catalog.extras.find((x) => x.id === id)!.price)}
              </span>
            </div>
          ))}
        </div>
        <div className="summary-bottom">
          <div className="total">
            <span>Subtotal</span>
            <strong>{money(designPrice(design))}</strong>
          </div>
          {review && (
            <div className="summary-line">
              <span>
                {design.delivery_method === "collection"
                  ? "Collection"
                  : "Delivery"}
              </span>
              <span>
                {money(
                  design.delivery_method === "collection"
                    ? 0
                    : catalog.delivery,
                )}
              </span>
            </div>
          )}
          <p className="fine">
            {review
              ? "Delivery is charged once per order."
              : "Delivery calculated at review. Prices in SGD."}
          </p>
          <button className="primary full" onClick={next}>
            {review ? "Add to bag" : `Next: ${steps[step + 1]}`}
            <ArrowRight size={16} />
          </button>
          <button className="outline full" onClick={save}>
            <Save size={14} />
            Save my design
          </button>
          <p className="summary-foot">
            <Heart size={12} /> Handcrafted just for you
          </p>
        </div>
      </section>
    );
  }
  return (
    <>
      <header>
        <button
          className="brand"
          onClick={() => go("home")}
          aria-label="Petal Puff home"
        >
          <span className="brand-flower">
            ✿<i>│</i>
          </span>
          petal puff
        </button>
        <nav className={mobileNav ? "open" : ""}>
          {navs.map(([id, label]) => (
            <a
              key={id}
              href={"#" + id}
              className={page === id ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                go(id);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            title="My saved designs"
            aria-label="My saved designs"
            onClick={() => setDrawer("saved")}
          >
            <UserRound size={23} />
          </button>
          <button
            aria-label={`Shopping bag, ${cart.reduce((s, i) => s + i.quantity, 0)} items`}
            onClick={() => {
              setOrderId("");
              setDrawer("cart");
            }}
            className="bag-button"
          >
            <ShoppingBag size={23} />
            {cart.length > 0 && (
              <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
            )}
          </button>
          <button
            className="mobile-menu"
            aria-label="Toggle menu"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu />
          </button>
        </div>
      </header>
      <main>
        {page === "home" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">
                  LITTLE BLOOMS. LASTING FEELINGS.
                </span>
                <h1>
                  Flowers made by you,
                  <br />
                  <em>crafted by us.</em>
                </h1>
                <p>
                  Design your own everlasting
                  <br />
                  pipe-cleaner bouquet,
                  <br />
                  one bloom at a time.
                </p>
                <div className="hero-actions">
                  <button className="primary" onClick={() => go("builder")}>
                    Create Your Bouquet
                    <ArrowRight size={17} />
                  </button>
                  <button className="outline" onClick={() => go("shop")}>
                    Shop Ready-Made
                  </button>
                </div>
                <span className="hero-note">
                  <span>✧</span> A little love, made to last.
                </span>
              </div>
              <div className="hero-art">
                <div className="hero-halo" />
                photo(image: string, alt: string, hero = false)
                <span className="handwritten hero-sticker">
                  made with love ♡
                </span>
              </div>
            </section>
            <section className="benefits">
              {[
                [HandHeart, "Handmade with love", "in Singapore"],
                [Sparkles, "Custom made", "just for you"],
                [Flower2, "Everlasting", "and meaningful"],
                [Truck, "Safe delivery", "to your doorstep"],
              ].map(([Icon, a, b], i) => {
                const I = Icon as typeof Heart;
                return (
                  <div key={i}>
                    <I strokeWidth={1.25} size={30} />
                    <p>
                      {a as string}
                      <br />
                      <span>{b as string}</span>
                    </p>
                  </div>
                );
              })}
            </section>
            <section className="how section">
              <span className="eyebrow">YOUR IMAGINATION, OUR HANDS</span>
              <h2 className="handwritten">How it works</h2>
              <div className="how-grid">
                {[
                  "Choose your bouquet size",
                  "Pick your favourite flowers",
                  "Wrap it your way",
                  "We craft it with love",
                ].map((label, i) => (
                  <div className="how-step" key={label}>
                    <span className="step-number">0{i + 1}</span>
                    <div className="how-art">
                      {i === 0 ? (
                        <span className="flower-cluster">
                          ✿<span>✿</span>✿
                        </span>
                      ) : i === 1 ? (
                        <FlowerIcon id="tulip" />
                      ) : i === 2 ? (
                        <span className="how-bow">୨୧</span>
                      ) : (
                        <HandHeart size={60} strokeWidth={1} />
                      )}
                    </div>
                    <p>{label}</p>
                    {i < 3 && <ArrowRight className="how-arrow" size={20} />}
                  </div>
                ))}
              </div>
            </section>
            <section className="section featured">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    ALREADY ARRANGED, ALWAYS SPECIAL
                  </span>
                  <h2 className="handwritten">Ready-made</h2>
                </div>
                <button className="outline" onClick={() => go("shop")}>
                  View all <ArrowRight size={15} />
                </button>
              </div>
              <div className="product-grid">
                {catalog.products.map(productCard)}
              </div>
            </section>
          </>
        )}
        {page === "shop" && (
          <section className="section shop">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  A LITTLE SOMETHING FOR SOMEONE SPECIAL
                </span>
                <h1 className="handwritten">Ready-Made Bouquets</h1>
                <p>Thoughtfully arranged. Lovingly handmade. Forever yours.</p>
              </div>
              {search}
            </div>
            <div className="shop-controls">
              <div className="chips">
                {["All", "Best Sellers", "Birthday", "Anniversary"].map((c) => (
                  <button
                    className={category === c ? "active" : ""}
                    onClick={() => setCategory(c)}
                    key={c}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <select
                aria-label="Sort bouquets"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </div>
            <div className="product-grid">{products.map(productCard)}</div>
            {!products.length && (
              <p className="empty-state">
                No bouquets found. Try another search or category.
              </p>
            )}
            <p className="shop-note">
              Every petal is made by hand, so every bouquet is a little one of a
              kind. ♡
            </p>
          </section>
        )}
        {page === "builder" && (
          <section className="builder builder-studio">
            <div className="builder-top builder-studio-head">
              <div>
                <span className="eyebrow">PETAL PUFF BOUQUET STUDIO</span>
                <h1>Build it bloom by bloom.</h1>
                <p>Choose each detail while your bouquet updates live.</p>
              </div>
              <div className="builder-head-actions">
                <span className="studio-status">
                  {design.flowers.length}/{capacity} blooms selected
                </span>
                <button className="outline studio-save" onClick={save}>
                  <Save size={14} />
                  Save design
                </button>
              </div>
            </div>
            <div className="stepper studio-tabs" aria-label="Bouquet customization sections">
              {steps.map((s, i) => (
                <button
                  key={s}
                  className={step === i ? "active" : step > i ? "complete" : ""}
                  onClick={() => setStep(i)}
                  aria-current={step === i ? "step" : undefined}
                >
                  <span>{step > i ? <Check size={12} /> : i + 1}</span>
                  {s}
                </button>
              ))}
            </div>
            <div
              className={"builder-grid " + (step === 4 ? "review-grid" : "")}
            >
              {step < 4 && (
                <aside className="controls">
                  {step === 0 && (
                    <section className="panel">
                      <span className="eyebrow">
                        01 / THE START OF SOMETHING
                      </span>
                      <h3>Choose your size</h3>
                      <p className="muted">
                        A tiny gesture or a grand surprise?
                      </p>
                      {options(
                        catalog.sizes,
                        design.size,
                        (id) => {
                          const max = catalog.sizes.find(
                            (x) => x.id === id,
                          )!.capacity;
                          if (design.flowers.length > max) {
                            setToast(
                              `Remove ${design.flowers.length - max} flowers before choosing this size.`,
                            );
                            return;
                          }
                          update({ size: id });
                        },
                        "sizes",
                      )}
                      <p className="fine">
                        Choose up to the listed number of stems. Each bloom is
                        priced individually.
                      </p>
                    </section>
                  )}
                  {step === 1 && (
                    <>
                      <section className="panel flower-picker">
                        <span className="eyebrow">
                          02 / PICK YOUR PERSONALITY
                        </span>
                        <h3>Choose your flowers</h3>
                        <p className="muted">
                          Click a bloom to add it. Mix, match, repeat.
                        </p>
                        {search}
                        <label className="category-label">
                          Flower type
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                          >
                            <option>All</option>
                            {catalog.flowers.map((f) => (
                              <option key={f.id}>{f.category}</option>
                            ))}
                          </select>
                        </label>
                        <div className="flower-grid">
                          {flowers.map((f) => (
                            <button
                              className="flower-option"
                              key={f.id}
                              onClick={() => addFlower(f.id)}
                              aria-label={`Add ${f.name}`}
                            >
                              <FlowerIcon id={f.id} />
                              <strong>{f.name}</strong>
                              <span>
                                {money(f.price)} <Plus size={12} />
                              </span>
                            </button>
                          ))}
                        </div>
                        {!flowers.length && (
                          <p className="fine">No flowers match your search.</p>
                        )}
                      </section>
                      <section className="panel editor-help">
                        <Move size={20} />
                        <div>
                          <strong>A little creative freedom</strong>
                          <p>
                            Drag flowers to arrange. Select one to change its
                            colour or rotate it. Arrow keys move a focused
                            flower.
                          </p>
                        </div>
                      </section>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <section className="panel">
                        <span className="eyebrow">03 / ALL WRAPPED UP</span>
                        <h3>Choose your wrapping</h3>
                        {options(
                          catalog.wrappings,
                          design.wrapping,
                          (id) => update({ wrapping: id }),
                          "wraps",
                        )}
                      </section>
                      <section className="panel">
                        <h3>Paper colour</h3>
                        <div className="swatches">
                          {catalog.colors.map((c, i) => (
                            <button
                              key={c}
                              style={{ background: c }}
                              className={c === design.color ? "selected" : ""}
                              onClick={() => update({ color: c })}
                              aria-label={`Paper colour ${i + 1}`}
                              aria-pressed={c === design.color}
                            >
                              {c === design.color && <Check size={16} />}
                            </button>
                          ))}
                        </div>
                      </section>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <section className="panel">
                        <span className="eyebrow">
                          04 / THE FINISHING TOUCHES
                        </span>
                        <h3>Tie it with a ribbon</h3>
                        {options(
                          catalog.ribbons,
                          design.ribbon,
                          (id) => update({ ribbon: id }),
                          "ribbons",
                        )}
                      </section>
                      <section className="panel">
                        <h3>A little extra love</h3>
                        <div className="extras-grid">
                          {catalog.extras.map((e, i) => {
                            const isPlushie =
                              e.id === "bear" || e.id === "bunny";
                            const active = isPlushie
                              ? selectedPlushie === e.id
                              : design.extras.includes(e.id);
                            return (
                              <button
                                className={"option " + (active ? "active" : "")}
                                key={e.id}
                                onClick={() => {
                                  const extras = toggleExtra(design.extras, e.id);
                                  update({
                                    extras,
                                    layer_order: getLayerOrder(
                                      design.flowers,
                                      extras,
                                      design.layer_order,
                                    ),
                                  });
                                  if (isPlushie)
                                    setSelected(
                                      extras.some(
                                        (id) => id === "bear" || id === "bunny",
                                      )
                                        ? "plushie"
                                        : "",
                                    );
                                }}
                                aria-pressed={active}
                              >
                                <span className="extra-icon">
                                  {["🧸", "🐰", "♡"][i]}
                                </span>
                                <strong>{e.name}</strong>
                                <small>{money(e.price)}</small>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                      <section className="panel">
                        <label htmlFor="message">
                          <h3>A note from the heart</h3>
                        </label>
                        <textarea
                          id="message"
                          maxLength={300}
                          placeholder="Some words to make their day…"
                          value={design.message}
                          onChange={(e) => update({ message: e.target.value })}
                        />
                        <span className="fine">
                          Complimentary message card · {design.message.length}
                          /300
                        </span>
                      </section>
                    </>
                  )}
                </aside>
              )}
              <section className="panel preview-panel studio-canvas">
                <div className="preview-heading">
                  <div>
                    <span className="eyebrow">
                      {step === 4 ? "FINAL PREVIEW" : "LIVE BOUQUET PREVIEW"}
                    </span>
                    <span className="canvas-helper">
                      {step === 1
                        ? "Select a flower, then drag it to arrange"
                        : "Your changes appear here instantly"}
                    </span>
                  </div>
                  <span className="preview-badge">
                    {design.flowers.length
                      ? `${design.flowers.length} / ${capacity} blooms`
                      : "Sample arrangement"}
                  </span>
                </div>
                <Bouquet
                  design={design}
                  editable={step === 1}
                  plushieEditable={step === 1 || step === 3}
                  selected={selected}
                  onSelect={setSelected}
                  zoom={zoom}
                  onMovePlushie={(x, y) => update({ plushie: { x, y } })}
                  onMove={(id, x, y) =>
                    setDesign((d) => ({
                      ...d,
                      flowers: d.flowers.map((f) =>
                        f.uid === id ? { ...f, x, y } : f,
                      ),
                    }))
                  }
                />
                <div className="preview-bottom">
                  <span className="handwritten">
                    Made by hand. Kept by heart.
                  </span>
                  <p>
                    Illustrated preview · your handmade bouquet will be unique
                  </p>
                </div>
                {(step === 1 || (step === 3 && selected === "plushie")) && (
                  <div className="edit-toolbar">
                    <button
                      aria-label="Bring selected item to front"
                      disabled={
                        selectedLayerIndex < 0 ||
                        selectedLayerIndex === layerOrder.length - 1
                      }
                      onClick={() =>
                        update({
                          layer_order: moveLayerOrder(
                            layerOrder,
                            selected,
                            "front",
                          ),
                        })
                      }
                    >
                      <BringToFront size={17} />
                      <small>Front</small>
                    </button>
                    <button
                      aria-label="Send selected item to back"
                      disabled={selectedLayerIndex <= 0}
                      onClick={() =>
                        update({
                          layer_order: moveLayerOrder(
                            layerOrder,
                            selected,
                            "back",
                          ),
                        })
                      }
                    >
                      <SendToBack size={17} />
                      <small>Back</small>
                    </button>
                    {selectedFlowerIndex >= 0 && (
                      <>
                    <button
                      aria-label="Rotate selected flower"
                      disabled={selectedFlowerIndex < 0}
                      onClick={() =>
                        update({
                          flowers: design.flowers.map((f) =>
                            f.uid === selected
                              ? { ...f, rotation: (f.rotation + 15) % 360 }
                              : f,
                          ),
                        })
                      }
                    >
                      <RotateCw size={17} />
                      <small>Rotate</small>
                    </button>
                    <button
                      aria-label="Duplicate selected flower"
                      disabled={!selected}
                      onClick={() => {
                        const f = design.flowers.find(
                          (f) => f.uid === selected,
                        );
                        if (!f) return;
                        if (design.flowers.length >= capacity) {
                          setToast(
                            "Your bouquet is full. Choose a larger size to add more flowers.",
                          );
                          return;
                        }
                        const uid = crypto.randomUUID();
                        update({
                          flowers: [
                            ...design.flowers,
                            {
                              ...f,
                              uid,
                              x: Math.min(425, f.x + 20),
                              y: Math.min(310, f.y + 15),
                            },
                          ],
                          layer_order: [...layerOrder, uid],
                        });
                        setSelected(uid);
                      }}
                    >
                      <Copy size={17} />
                      <small>Duplicate</small>
                    </button>
                    <button
                      aria-label="Delete selected flower"
                      disabled={selectedFlowerIndex < 0}
                      onClick={() => removeFlower(selected)}
                    >
                      <Trash2 size={17} />
                      <small>Remove</small>
                    </button>
                    <label className="flower-color">
                      Colour
                      <input
                        type="color"
                        aria-label="Selected flower colour"
                        disabled={selectedFlowerIndex < 0}
                        value={
                          design.flowers.find((f) => f.uid === selected)
                            ?.color || "#f08ba8"
                        }
                        onChange={(e) =>
                          update({
                            flowers: design.flowers.map((f) =>
                              f.uid === selected
                                ? { ...f, color: e.target.value }
                                : f,
                            ),
                          })
                        }
                      />
                    </label>
                      </>
                    )}
                    <button
                      aria-label="Zoom out"
                      onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
                    >
                      <Minus size={15} />
                    </button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button
                      aria-label="Zoom in"
                      onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                )}
              </section>
              {summary(step === 4)}
              {step === 4 && (
                <section className="panel delivery">
                  <span className="eyebrow">05 / READY TO MAKE THEIR DAY</span>
                  <h3>The little details</h3>
                  <label>
                    Preferred delivery date
                    <input
                      type="date"
                      value={design.delivery_date}
                      min={new Date(
                        Date.now() + 3 * 86400000,
                      ).toLocaleDateString("en-CA")}
                      onChange={(e) =>
                        update({ delivery_date: e.target.value })
                      }
                    />
                  </label>
                  <p className="fine">
                    Please allow at least 3 days for handcrafting. Dates are
                    requests until confirmed.
                  </p>
                  <label>
                    Delivery method
                    <select
                      value={design.delivery_method}
                      onChange={(e) =>
                        update({
                          delivery_method: e.target
                            .value as Design["delivery_method"],
                        })
                      }
                    >
                      <option value="delivery">
                        Standard delivery · {money(catalog.delivery)}
                      </option>
                      <option value="collection">Self-collection · Free</option>
                    </select>
                  </label>
                  {design.message && (
                    <blockquote>
                      “{design.message}”<small>Your message card</small>
                    </blockquote>
                  )}
                  <div className="prelaunch">
                    <Heart size={18} />
                    <p>
                      We’re getting ready to bloom.
                      <br />
                      You can save an order draft; checkout opens at launch.
                    </p>
                  </div>
                </section>
              )}
            </div>
            <button
              className="back-link"
              onClick={() => (step ? setStep(step - 1) : go("home"))}
            >
              <ArrowLeft size={14} />
              {step ? "Back to " + steps[step - 1] : "Back to home"}
            </button>
          </section>
        )}
        {page === "about" && (
          <section className="story section">
            <span className="eyebrow">HELLO, WE’RE PETAL PUFF</span>
            <h1 className="handwritten">
              Little blooms.
              <br />
              Lasting feelings.
            </h1>
            <Flower2 size={56} strokeWidth={1} />
            <p>
              Petal Puff is a pre-launch bouquet studio creating handcrafted
              pipe-cleaner flowers in Singapore. We believe the most meaningful
              gifts have a little bit of you in them.
            </p>
            <p>
              Pick your flowers, choose your colours, and add your own finishing
              touches. We turn your ideas into a bouquet made to be treasured.
            </p>
            <button className="primary" onClick={() => go("builder")}>
              Make something personal
              <ArrowRight size={16} />
            </button>
          </section>
        )}
        {page === "faq" && (
          <section className="section faq">
            <span className="eyebrow">A FEW THINGS YOU MIGHT WONDER</span>
            <h1 className="handwritten">Good to know</h1>
            {[
              [
                "What are the flowers made from?",
                "Our flowers are handcrafted using pipe cleaners. They don’t need watering and are designed to be kept.",
              ],
              [
                "Can I customise my bouquet?",
                "Yes! Choose a size, add your favourite flowers, then personalise the wrapping, ribbon, extras, and message card.",
              ],
              [
                "Can I place an order now?",
                "Petal Puff is pre-launch. You can build a bouquet, save your design, and create an order draft when the backend is connected. Payments and confirmed orders are not available yet.",
              ],
              [
                "Will my bouquet look exactly like the preview?",
                "The builder shows a 2D illustration to help you arrange colours and flowers. Each finished bouquet is handmade, so its shape and details will vary.",
              ],
              [
                "How should I care for my flowers?",
                "Keep them dry, gently dust them with a soft brush, and avoid prolonged direct sunlight.",
              ],
              [
                "How much is delivery?",
                "The current sample delivery fee is S$10 per order. Delivery areas, timing, and collection details will be confirmed before launch.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={16} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        )}
      </main>
      <footer>
        <button className="brand" onClick={() => go("home")}>
          ✿ petal puff
        </button>
        <p>A little love, made to last.</p>
        <span>Handmade in Singapore · Pre-launch</span>
        <span className="connection">
          {online
            ? "Database connected"
            : "Local preview · saved on this device"}
        </span>
      </footer>
      {drawer && (
        <div className="modal-backdrop" onClick={() => setDrawer(null)}>
          <section
            ref={dialogRef}
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={drawer === "cart" ? "Your bag" : "Your saved designs"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">LITTLE THINGS, LOTS OF LOVE</span>
                <h2>{drawer === "cart" ? "Your bag" : "Your saved designs"}</h2>
              </div>
              <button
                autoFocus
                aria-label="Close panel"
                onClick={() => setDrawer(null)}
              >
                <X />
              </button>
            </div>
            {drawer === "saved" ? (
              <>
                {!saved.length ? (
                  <p className="empty-state">
                    Your favourites will bloom here.
                    <br />
                    Save a design in the bouquet builder.
                  </p>
                ) : (
                  saved.map((d, i) => (
                    <div className="saved-item" key={i}>
                      <div>
                        <Bouquet design={d} />
                      </div>
                      <section>
                        <h3>
                          {catalog.sizes.find((s) => s.id === d.size)?.name}{" "}
                          bouquet
                        </h3>
                        <p>
                          {d.flowers.length} blooms · {money(designPrice(d))}
                        </p>
                        <button
                          className="outline"
                          onClick={() => {
                            setDesign(structuredClone(d));
                            setDrawer(null);
                            setStep(1);
                            go("builder");
                          }}
                        >
                          Continue designing
                        </button>
                        <button
                          className="back-link"
                          onClick={() =>
                            setSaved((s) => s.filter((_, j) => j !== i))
                          }
                        >
                          Delete
                        </button>
                      </section>
                    </div>
                  ))
                )}
              </>
            ) : (
              <>
                {orderId && (
                  <div className="order-success">
                    <Check />
                    <h3>Your draft is saved!</h3>
                    <p>Reference: {orderId}</p>
                    <p>
                      No payment has been taken. This is not a confirmed order.
                    </p>
                  </div>
                )}
                {!cart.length && !orderId && (
                  <div className="empty-state">
                    <ShoppingBag size={40} />
                    <h3>Your bag is waiting to bloom.</h3>
                    <button
                      className="primary"
                      onClick={() => {
                        setDrawer(null);
                        go("shop");
                      }}
                    >
                      Explore bouquets
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                {cart.map((item) => {
                  const p = catalog.products.find(
                    (p) => p.id === item.product_id,
                  );
                  return (
                     <div className="cart-item" key={item.uid}>
                      <div className="cart-thumb">
                        {item.design ? (
                          <Bouquet design={item.design} />
                        ) : p ? (
                          photo(p.image, p.name)
                        ) : null}
                      </div>
                      <div className="cart-details">
                        <h3>{item.design ? "Your custom bouquet" : p?.name}</h3>
                        <p>
                          {money(
                            item.design
                              ? designPrice(item.design)
                              : p?.price || 0,
                          )}
                        </p>
                        <div className="quantity">
                          <button
                            aria-label="Decrease quantity"
                            onClick={() =>
                              setCart((c) =>
                                c.flatMap((i) =>
                                  i.uid === item.uid
                                    ? i.quantity > 1
                                      ? [{ ...i, quantity: i.quantity - 1 }]
                                      : []
                                    : [i],
                                ),
                              )
                            }
                          >
                            <Minus size={13} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            aria-label="Increase quantity"
                            disabled={item.quantity >= 20}
                            onClick={() =>
                              setCart((c) =>
                                c.map((i) =>
                                  i.uid === item.uid
                                    ? { ...i, quantity: i.quantity + 1 }
                                    : i,
                                ),
                              )
                            }
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <button
                        aria-label="Remove bouquet from bag"
                        onClick={() =>
                          setCart((c) => c.filter((i) => i.uid !== item.uid))
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
                {!!cart.length && (
                  <div className="cart-bottom">
                    <div className="total">
                      <span>Subtotal</span>
                      <strong>{money(cartPrice(cart))}</strong>
                    </div>
                    <div className="summary-line">
                      <span>Delivery</span>
                      <span>
                        {money(
                          cart.some(
                            (i) =>
                              !i.design ||
                              i.design.delivery_method === "delivery",
                          )
                            ? catalog.delivery
                            : 0,
                        )}
                      </span>
                    </div>
                    <div className="total">
                      <span>Total</span>
                      <strong>
                        {money(
                          cartPrice(cart) +
                            (cart.some(
                              (i) =>
                                !i.design ||
                                i.design.delivery_method === "delivery",
                            )
                              ? catalog.delivery
                              : 0),
                        )}
                      </strong>
                    </div>
                    <p className="fine">
                      Pre-launch: save a draft only. No payment or confirmed
                      order.{" "}
                      {online
                        ? ""
                        : "Connect the backend to save an order draft."}
                    </p>
                    <button
                      className="primary full"
                      disabled={busy || !online}
                      onClick={saveOrder}
                    >
                      {busy ? "Saving…" : "Save order draft"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
