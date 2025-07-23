import Matter from "matter-js";
import { nanoid } from "nanoid";

// Constants
const FONTS = ["ibm-plex-sans-thai", "bai-jamjuree", "anuphan", "trirong"];
const FONT_WEIGHTS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];
const FONT_SIZES = [40, 48, 56, 64, 72, 80, 96];

// Matter

const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint } = Matter;

const backgroundColor = "#00000000";
const gravity = 1;
const mouseConstraintStiffness = 0.2;

const containerRef = document.getElementById("app")!;

const containerRect = containerRef.getBoundingClientRect();
const width = containerRect.width;
const height = containerRect.height;

const engine = Engine.create();
engine.gravity.y = gravity;

const render = Render.create({
  element: document.getElementById("canvas")!,
  engine,
  options: {
    width,
    height,
    background: backgroundColor,
    wireframes: true,
  },
});

const boundaryOptions = {
  isStatic: true,
  render: { fillStyle: "transparent" },
};
const floor = Bodies.rectangle(width / 2, height + 25, width, 50, boundaryOptions);
const leftWall = Bodies.rectangle(-25, height / 2, 50, height, boundaryOptions);
const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, boundaryOptions);
const ceiling = Bodies.rectangle(width / 2, -25, width, 50, boundaryOptions);

const wordSpans = document.querySelectorAll(".word");
const wordBodies = [...wordSpans].map((elem) => {
  const rect = elem.getBoundingClientRect();

  const x = rect.left - containerRect.left + rect.width / 2;
  const y = rect.top - containerRect.top + rect.height / 2;

  const body = Bodies.rectangle(x, y, rect.width, rect.height, {
    render: { fillStyle: "transparent" },
    restitution: 0.1,
    frictionAir: 0.04,
    friction: 0.4,
  });

  Matter.Body.setVelocity(body, {
    x: (Math.random() - 0.5) * 5,
    y: 0,
  });
  Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);
  return { elem, body };
});

wordBodies.forEach(({ elem, body }) => {
  (elem as HTMLElement).style.position = "absolute";
  (elem as HTMLElement).style.left = `${
    body.position.x - body.bounds.max.x + body.bounds.min.x / 2
  }px`;
  (elem as HTMLElement).style.top = `${
    body.position.y - body.bounds.max.y + body.bounds.min.y / 2
  }px`;
  (elem as HTMLElement).style.transform = "none";
});

const mouse = Mouse.create(containerRef);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: mouseConstraintStiffness,
    render: { visible: false },
  },
});
render.mouse = mouse;

World.add(engine.world, [
  floor,
  leftWall,
  rightWall,
  ceiling,
  mouseConstraint,
  ...wordBodies.map((wb) => wb.body),
]);

const runner = Runner.create();
Runner.run(runner, engine);
Render.run(render);

const updateLoop = () => {
  wordBodies.forEach(({ body, elem }) => {
    const { x, y } = body.position;
    (elem as HTMLElement).style.left = `${x}px`;
    (elem as HTMLElement).style.top = `${y}px`;
    (elem as HTMLElement).style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
  });
  Matter.Engine.update(engine);
  requestAnimationFrame(updateLoop);
};
updateLoop();

// Sockets
const socketUrl = import.meta.env.VITE_API_URL + "/ws";

const ws = new WebSocket(socketUrl);

ws.onopen = () => {
  console.log("Connected to server");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data) as {
    text: string;
    font: (typeof FONTS)[number];
    fontWeight: (typeof FONT_WEIGHTS)[number];
    fontSize: (typeof FONT_SIZES)[number];
  };

  const { text, font, fontWeight, fontSize } = data;

  // Create span
  const span = document.createElement("span");
  span.className = `word ${font}`;
  span.style.lineHeight = "0.5pt";
  span.textContent = text;
  span.style.fontWeight = fontWeight;
  span.style.fontSize = `${fontSize}px`;
  const id = nanoid();
  span.setAttribute("data-id", id);

  // Append to container
  const textContainer = document.getElementById("text-container")!;
  textContainer.appendChild(span);
  const containerRect = textContainer.getBoundingClientRect();

  // Create Matter body
  const rect = span.getBoundingClientRect();
  const center = containerRect.width / 2;
  const maxLeft = center - rect.width / 2;
  const maxRight = center + rect.width / 2;
  const x = Math.random() * (maxRight - maxLeft) + maxLeft;
  const y = rect.top - containerRect.top + rect.height / 2;

  const body = Bodies.rectangle(x, y, rect.width, rect.height, {
    render: { fillStyle: "transparent" },
    restitution: 0.8,
    frictionAir: 0.01,
    friction: 0.2,
  });

  Matter.Body.setVelocity(body, {
    x: (Math.random() - 0.5) * 5,
    y: 4,
  });
  Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

  // Position elem
  span.style.position = "absolute";
  span.style.left = `${body.position.x - body.bounds.max.x + body.bounds.min.x / 2}px`;
  span.style.top = `${body.position.y - body.bounds.max.y + body.bounds.min.y / 2}px`;
  span.style.transform = "none";

  // Add to world
  World.add(engine.world, [body]);
  wordBodies.push({ elem: span, body });

  if (wordBodies.length > 10) {
    const first = wordBodies.shift();
    if (first) {
      console.log(`Removing ${first.elem.textContent}`);

      first.body.collisionFilter = {
        category: 0x0003,
      };
      World.remove(engine.world, first.body);
      textContainer.removeChild(first.elem);
    }
  }
};

function submitWord(e: Event) {
  e.preventDefault();

  const form = e.target as HTMLFormElement;
  const input = form.querySelector("input") as HTMLInputElement;

  // Get the value from the input
  const word = input.value;

  // reset the form
  form.reset();

  // Send the word to the server
  ws.send(word);
}

// Bindings
document.getElementById("word-form")?.addEventListener("submit", submitWord);
