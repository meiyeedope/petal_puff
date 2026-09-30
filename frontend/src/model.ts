import catalog from "./catalog.json";
export { catalog };
export type Stem = {
  uid: string;
  id: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
};
export type PlushiePosition = { x: number; y: number };
export function getLayerOrder(
  flowers: Stem[],
  extras: string[],
  savedOrder: string[] = [],
) {
  const items = [
    ...(extras.some((id) => id === "bear" || id === "bunny")
      ? ["plushie"]
      : []),
    ...flowers.map((flower) => flower.uid),
  ];
  const available = new Set(items);
  const order = [...new Set(savedOrder)].filter((id) => available.has(id));
  const missing = items.filter((id) => !order.includes(id));
  return [
    ...missing.filter((id) => id === "plushie"),
    ...order,
    ...missing.filter((id) => id !== "plushie"),
  ];
}
export function moveLayerOrder(
  order: string[],
  id: string,
  layer: "front" | "back",
) {
  if (!order.includes(id)) return order;
  const remaining = order.filter((item) => item !== id);
  return layer === "front" ? [...remaining, id] : [id, ...remaining];
}
export function toggleExtra(extras: string[], id: string) {
  if (id === "bear" || id === "bunny") {
    const selectedPlushie = extras.find(
      (extra) => extra === "bear" || extra === "bunny",
    );
    const otherExtras = extras.filter(
      (extra) => extra !== "bear" && extra !== "bunny",
    );
    return selectedPlushie === id
      ? otherExtras
      : [...otherExtras, id];
  }
  return extras.includes(id)
    ? extras.filter((extra) => extra !== id)
    : [...extras, id];
}
export type Design = {
  size: string;
  flowers: Stem[];
  wrapping: string;
  color: string;
  ribbon: string;
  plushie?: PlushiePosition;
  layer_order?: string[];
  extras: string[];
  message: string;
  delivery_date: string;
  delivery_method: "delivery" | "collection";
};
export type CartItem = {
  uid: string;
  product_id?: string;
  design?: Design;
  quantity: number;
};
export const freshDesign = (): Design => ({
  size: "standard",
  flowers: [],
  wrapping: "layered",
  color: catalog.colors[0],
  ribbon: "pink",
  plushie: { x: 250, y: 240 },
  extras: [],
  message: "",
  delivery_date: "",
  delivery_method: "delivery",
});
export const money = (cents: number) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(
    cents / 100,
  );
export function designPrice(d: Design) {
  return (
    d.flowers.reduce(
      (s, f) => s + (catalog.flowers.find((x) => x.id === f.id)?.price || 0),
      0,
    ) +
    (catalog.wrappings.find((x) => x.id === d.wrapping)?.price || 0) +
    (catalog.ribbons.find((x) => x.id === d.ribbon)?.price || 0) +
    d.extras.reduce(
      (s, id) => s + (catalog.extras.find((x) => x.id === id)?.price || 0),
      0,
    )
  );
}
export function cartPrice(items: CartItem[]) {
  return items.reduce(
    (s, i) =>
      s +
      i.quantity *
        (i.design
          ? designPrice(i.design)
          : catalog.products.find((p) => p.id === i.product_id)?.price || 0),
    0,
  );
}
export function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export async function api(path: string, body?: unknown) {
  const response = await fetch("/api" + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : "The server could not process this request.",
    );
  }
  return response.json();
}
