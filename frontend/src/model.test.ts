import { describe, it, expect } from "vitest";
import {
  freshDesign,
  designPrice,
  cartPrice,
  getLayerOrder,
  moveLayerOrder,
  toggleExtra,
  type Stem,
} from "./model";
describe("bouquet pricing in integer SGD cents", () => {
  it("totals selected stems, wrapping, ribbon and extras", () => {
    const d = freshDesign();
    d.flowers = [
      { uid: "1", id: "tulip", color: "#f08ba8", x: 100, y: 150, rotation: 0 },
    ];
    d.extras = ["bunny"];
    expect(designPrice(d)).toBe(2450);
  });
  it("multiplies quantities for both ready-made and custom bouquets", () => {
    const d = freshDesign();
    d.flowers = [
      { uid: "1", id: "tulip", color: "#f08ba8", x: 100, y: 150, rotation: 0 },
    ];
    expect(
      cartPrice([
        { uid: "a", product_id: "strawberry-milk", quantity: 2 },
        { uid: "b", design: d, quantity: 1 },
      ]),
    ).toBe(4450);
  });
});
describe("bouquet layer ordering", () => {
  const flowers: Stem[] = [
    { uid: "back", id: "tulip", color: "pink", x: 0, y: 0, rotation: 0 },
    { uid: "middle", id: "rose", color: "red", x: 0, y: 0, rotation: 0 },
    { uid: "front", id: "lily", color: "white", x: 0, y: 0, rotation: 0 },
  ];

  it("keeps flowers in front by default and lets the plushie join their stack", () => {
    const order = getLayerOrder(flowers, ["bunny"]);
    expect(order).toEqual(["plushie", "back", "middle", "front"]);
    expect(
      getLayerOrder(flowers, ["bunny"], ["back", "middle", "front"]),
    ).toEqual(["plushie", "back", "middle", "front"]);
    expect(moveLayerOrder(order, "plushie", "front")).toEqual([
      "back",
      "middle",
      "front",
      "plushie",
    ]);
    expect(moveLayerOrder(order, "middle", "back")).toEqual([
      "middle",
      "plushie",
      "back",
      "front",
    ]);
    expect(flowers.map((f) => f.uid)).toEqual(["back", "middle", "front"]);
  });
});
describe("plushie extras", () => {
  it("allows only one plushie while preserving other extras", () => {
    expect(toggleExtra(["bear", "charm"], "bunny")).toEqual([
      "charm",
      "bunny",
    ]);
    expect(toggleExtra(["bunny", "charm"], "bunny")).toEqual(["charm"]);
    expect(toggleExtra(["bear", "bunny", "charm"], "bunny")).toEqual([
      "charm",
      "bunny",
    ]);
  });
});
