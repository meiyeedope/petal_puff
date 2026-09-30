import { useRef, useId } from "react";
import { catalog, getLayerOrder, type Design, type Stem } from "./model";
export function Flower({ id, color }: { id: string; color: string }) {
  if (id === "tulip")
    return (
      <g>
        <path
          d="M-24-18Q-34 25 0 30Q34 25 24-18L11-7 0-25-11-7Z"
          fill={color}
          stroke="#ac547333"
          strokeWidth="2"
        />
        <path
          d="M-11-7Q-13 23 0 30Q13 23 11-7M0-25V26"
          fill="none"
          stroke="#ffffff66"
          strokeWidth="3"
        />
      </g>
    );
  if (id === "lavender" || id === "gypsophila")
    return (
      <g>
        {Array.from({ length: 9 }, (_, i) => (
          <g
            key={i}
            transform={`translate(${Math.sin(i * 2) * 17},${-30 + i * 7})`}
          >
            <circle r={id === "lavender" ? 7 : 5} fill={color} />
            <circle cx="3" cy="-2" r="2" fill="#ffffff88" />
          </g>
        ))}
      </g>
    );
  return (
    <g>
      {Array.from({ length: id === "lily" ? 6 : 10 }, (_, i) => (
        <ellipse
          key={i}
          cy="-17"
          rx={id === "rose" ? 13 : id === "lily" ? 10 : 8}
          ry={id === "rose" ? 17 : 23}
          transform={`rotate(${i * (id === "lily" ? 60 : 36)})`}
          fill={color}
          stroke="#87526020"
          strokeWidth="1.5"
        />
      ))}
      {id === "rose" || id === "carnation" ? (
        <>
          <circle r="19" fill={color} stroke="#ffffff60" strokeWidth="2" />
          <path
            d="M-11 3C-19-14 16-21 14-2S-10 16-8 0 8-7 6 3"
            fill="none"
            stroke="#a3386855"
            strokeWidth="4"
          />
        </>
      ) : (
        <circle r="10" fill={id === "sunflower" ? "#785533" : "#e8bc57"} />
      )}
    </g>
  );
}
export function FlowerIcon({ id, color }: { id: string; color?: string }) {
  return (
    <svg viewBox="-45 -48 90 115" aria-hidden="true">
      <path
        d="M0 18V65M0 53Q-30 28-22 50Q-8 64 0 56M0 40Q27 15 23 39Q12 51 0 48"
        fill="#91a578"
        stroke="#859866"
        strokeWidth="3"
      />
      <Flower
        id={id}
        color={
          color || catalog.flowers.find((f) => f.id === id)?.color || "#eaa0b7"
        }
      />
    </svg>
  );
}
function Plushie({
  id,
  position,
  selected,
  editable,
  onSelect,
  onMove,
  onDragStart,
}: {
  id: string;
  position: { x: number; y: number };
  selected: boolean;
  editable: boolean;
  onSelect?: (id: string) => void;
  onMove: (x: number, y: number) => void;
  onDragStart: () => void;
}) {
  return (
    <g
      key="plushie"
      transform={`translate(${position.x - 250} ${position.y - 240})`}
      style={{ cursor: editable ? "grab" : "default" }}
      tabIndex={editable ? 0 : undefined}
      role={editable ? "button" : undefined}
      aria-label={`${id} plushie, drag to arrange`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.("plushie");
        }
        if (e.key.startsWith("Arrow")) {
          e.preventDefault();
          onSelect?.("plushie");
          onMove(
            position.x +
              (e.key === "ArrowLeft"
                ? -5
                : e.key === "ArrowRight"
                  ? 5
                  : 0),
            position.y +
              (e.key === "ArrowUp" ? -5 : e.key === "ArrowDown" ? 5 : 0),
          );
        }
      }}
      onPointerDown={(e) => {
        if (!editable) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        onDragStart();
        onSelect?.("plushie");
      }}
    >
      {selected && (
        <ellipse
          cx="250"
          cy="235"
          rx="72"
          ry="116"
          fill="none"
          stroke="#ef568d"
          strokeDasharray="5 4"
        />
      )}
      {id === "bunny" ? (
        <g fill="#eee6da" stroke="#ccbda9" strokeWidth="2">
          <ellipse cx="233" cy="182" rx="16" ry="52" />
          <ellipse cx="270" cy="182" rx="16" ry="52" />
          <ellipse cx="250" cy="273" rx="53" ry="65" />
          <circle cx="250" cy="223" r="44" />
          <g fill="#574a44" stroke="none">
            <circle cx="233" cy="222" r="3" />
            <circle cx="267" cy="222" r="3" />
          </g>
          <path d="M246 235l8 7m0-7-8 7" />
        </g>
      ) : (
        <g fill="#c7a17a" stroke="#aa805d">
          <circle cx="219" cy="197" r="18" />
          <circle cx="279" cy="197" r="18" />
          <ellipse cx="250" cy="276" rx="48" ry="60" />
          <circle cx="250" cy="227" r="42" />
          <ellipse cx="250" cy="239" rx="18" ry="12" fill="#e8ceb0" />
          <circle cx="235" cy="220" r="3" fill="#564135" />
          <circle cx="265" cy="220" r="3" fill="#564135" />
          <circle cx="250" cy="233" r="4" fill="#564135" />
        </g>
      )}
    </g>
  );
}
export default function Bouquet({
  design,
  selected,
  onSelect,
  onMove,
  onMovePlushie,
  editable = false,
  plushieEditable = false,
  zoom = 1,
}: {
  design: Design;
  selected?: string;
  onSelect?: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onMovePlushie?: (x: number, y: number) => void;
  editable?: boolean;
  plushieEditable?: boolean;
  zoom?: number;
}) {
  const unique = useId().replace(/:/g, "");
  const paperId = "paper" + unique;
  const shadowId = "shadow" + unique;
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef<string | null>(null);
  const ribbon =
    catalog.ribbons.find((x) => x.id === design.ribbon)?.color || "#eaa0b7";
  const plushieId = design.extras.find(
    (id) => id === "bear" || id === "bunny",
  );
  const plushiePosition = design.plushie ?? { x: 250, y: 240 };
  function movePlushie(x: number, y: number) {
    onMovePlushie?.(
      Math.max(100, Math.min(400, x)),
      Math.max(170, Math.min(320, y)),
    );
  }
  const placeholder: Stem[] = Array.from({ length: 6 }, (_, i) => ({
    uid: "sample" + i,
    id: ["tulip", "rose", "daisy", "lily", "lavender", "tulip"][i],
    color: ["#eda3ba", "#d9779a", "#fff9ec", "#e5b3c9", "#b6a5cf", "#f0bac8"][
      i
    ],
    x: 160 + (i % 3) * 85,
    y: 165 + Math.floor(i / 3) * 90,
    rotation: ((i % 3) - 1) * 18,
  }));
  const stems = design.flowers.length ? design.flowers : placeholder;
  const layerItems = getLayerOrder(stems, design.extras, design.layer_order);
  return (
    <svg
      ref={svg}
      className={"bouquet-svg " + (editable ? "editable" : "")}
      viewBox="0 0 500 600"
      role="img"
      aria-label="Your illustrated bouquet preview"
      onPointerMove={(e) => {
        if (!dragging.current || !svg.current) return;
        const p = svg.current.createSVGPoint();
        p.x = e.clientX;
        p.y = e.clientY;
        const m = svg.current.getScreenCTM();
        if (!m) return;
        const q = p.matrixTransform(m.inverse());
        const x = (q.x - 250) / zoom + 250;
        const y = (q.y - 285) / zoom + 285;
        if (dragging.current === "plushie") movePlushie(x, y);
        else
          onMove?.(
            dragging.current,
            Math.max(75, Math.min(425, x)),
            Math.max(80, Math.min(310, y)),
          );
      }}
      onPointerUp={() => (dragging.current = null)}
      onPointerCancel={() => (dragging.current = null)}
    >
      <defs>
        <linearGradient id={paperId} x1="0" x2="1" y2="1">
          <stop stopColor={design.color} />
          <stop offset=".5" stopColor="#fff9f0" />
          <stop offset="1" stopColor={design.color} />
        </linearGradient>
        <filter id={shadowId}>
          <feDropShadow
            dx="0"
            dy="7"
            stdDeviation="7"
            floodColor="#755447"
            floodOpacity=".12"
          />
        </filter>
      </defs>
      <g
        transform={`translate(250 285) scale(${zoom}) translate(-250 -285)`}
        filter={`url(#${shadowId})`}
      >
        <g fill={`url(#${paperId})`} stroke="#bba69b55">
          <path
            d={
              design.wrapping === "classic"
                ? "M95 160L250 450 405 160 350 350 150 350Z"
                : "M64 228L130 122 233 209 311 112 427 210 350 368 250 457 142 358Z"
            }
          />
          {(design.wrapping === "layered" || design.wrapping === "grand") && (
            <>
              <path d="M106 152L157 108 231 361 206 402Z" />
              <path d="M365 112L405 166 291 414 265 365Z" />
            </>
          )}
          {design.wrapping === "grand" && (
            <>
              <path d="M60 200L91 143 198 394 160 378Z" />
              <path d="M440 200L410 143 302 394 340 378Z" />
            </>
          )}
        </g>
        {stems.map((f) => (
          <g key={f.uid}>
            <path
              d={`M${f.x} ${f.y}Q${f.x} 340 250 430`}
              fill="none"
              stroke="#85966a"
              strokeWidth="5"
            />
            <path
              d={`M${f.x} ${f.y + 55}q-44-29-30 3q17 14 30 2`}
              fill="#9bac83"
            />
          </g>
        ))}
        {layerItems.map((id) => {
          if (id === "plushie" && plushieId)
            return (
              <Plushie
                key="plushie"
                id={plushieId}
                position={plushiePosition}
                selected={selected === "plushie"}
                editable={plushieEditable}
                onSelect={onSelect}
                onMove={movePlushie}
                onDragStart={() => {
                  dragging.current = "plushie";
                }}
              />
            );
          const flower = stems.find((item) => item.uid === id);
          if (!flower) return null;
          return (
            <g
              key={flower.uid}
              transform={`translate(${flower.x} ${flower.y}) rotate(${flower.rotation})`}
              style={{ cursor: editable ? "grab" : "default" }}
              tabIndex={editable && design.flowers.length ? 0 : undefined}
              role={editable ? "button" : undefined}
              aria-label={`${flower.id} flower, select to arrange`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(flower.uid);
                }
                if (e.key.startsWith("Arrow")) {
                  e.preventDefault();
                  onSelect?.(flower.uid);
                  onMove?.(
                    flower.uid,
                    flower.x +
                      (e.key === "ArrowLeft"
                        ? -5
                        : e.key === "ArrowRight"
                          ? 5
                          : 0),
                    flower.y +
                      (e.key === "ArrowUp" ? -5 : e.key === "ArrowDown" ? 5 : 0),
                  );
                }
              }}
              onPointerDown={(e) => {
                if (!editable || !design.flowers.length) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                dragging.current = flower.uid;
                onSelect?.(flower.uid);
              }}
            >
              {selected === flower.uid && (
                <circle
                  r="46"
                  fill="none"
                  stroke="#ef568d"
                  strokeDasharray="5 4"
                />
              )}
              <Flower id={flower.id} color={flower.color} />
            </g>
          );
        })}
        <path
          d="M113 297Q169 322 252 405Q319 328 395 291L312 449 278 476 303 557Q256 576 202 554L224 472 184 431Z"
          fill={`url(#${paperId})`}
          stroke="#c6b4a666"
        />
        <path
          d="M116 298Q204 336 252 410M395 292Q307 337 252 410L224 552M251 446L282 556"
          fill="none"
          stroke="#ffffff88"
          strokeWidth="3"
        />
        <g fill={ribbon} stroke="#ae758b55" strokeWidth="1.5">
          <path d="M250 433C151 373 163 466 246 447C184 488 179 506 207 521L251 448C291 506 304 519 320 498L260 446C347 459 339 378 250 433Z" />
          <ellipse cx="253" cy="440" rx="12" ry="10" />
        </g>
        {design.extras.includes("charm") && (
          <path
            d="M266 466C249 445 237 473 266 491C295 473 283 445 266 466"
            fill="#e2ba6e"
          />
        )}
      </g>
    </svg>
  );
}
