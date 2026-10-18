import {
  Component,
  Suspense,
  lazy,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import type { Mode } from "../components/Lab";
const topics = [
  {
    title: "Electrical current",
    short: "Electrical current",
    icon: "↝",
    description:
      "Look inside a conductor. See how microscopic motion becomes measurable electric current.",
    component: lazy(() => import("../simulations/Current")),
  },
  {
    title: "Ohm’s Law and resistivity",
    short: "Ohm’s Law & resistivity",
    icon: "Ω",
    description:
      "Build a V–I investigation, verify Ohm’s Law and explore what gives a wire its resistance.",
    component: lazy(() => import("../simulations/Ohm")),
  },
  {
    title: "Variation of resistance with temperature",
    short: "Resistance & temperature",
    icon: "♨",
    description:
      "Heat a metal, observe its lattice and measure how temperature changes resistance.",
    component: lazy(() => import("../simulations/Temperature")),
  },
  {
    title:
      "Electromotive force (emf), internal resistance and potential difference",
    short: "emf & internal resistance",
    icon: "▥",
    description:
      "Investigate a real-cell model and discover why terminal voltage falls under load.",
    component: lazy(() => import("../simulations/Battery")),
  },
  {
    title: "Resistors in series and parallel",
    short: "Series & parallel",
    icon: "⑂",
    description:
      "Change the arrangement. Inspect each resistor and compare how voltage and current are shared.",
    component: lazy(() => import("../simulations/Resistors")),
  },
  {
    title: "Kirchhoff’s Rules",
    short: "Kirchhoff’s Rules",
    icon: "⇄",
    description:
      "Follow charge and energy around a circuit. Solve two loops with a shared resistor.",
    component: lazy(() => import("../simulations/Kirchhoff")),
  },
  {
    title: "Electrical energy and power",
    short: "Energy & power",
    icon: "ϟ",
    description:
      "Power a resistive lamp, watch the energy counter and investigate the cost of changing voltage.",
    component: lazy(() => import("../simulations/Energy")),
  },
  {
    title: "Potential divider",
    short: "Potential divider",
    icon: "⎇",
    description:
      "Move the output probe and discover how a series circuit divides its supply voltage.",
    component: lazy(() => import("../simulations/Divider")),
  },
  {
    title: "Potentiometer",
    short: "Potentiometer",
    icon: "⌁",
    description:
      "Slide the jockey to null. Compare cell emfs and measure a dry cell’s internal resistance.",
    component: lazy(() => import("../simulations/Potentiometer")),
  },
];
class Boundary extends Component<
  { children: ReactNode; key: string },
  { error: string | null }
> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }
  render() {
    return this.state.error ? (
      <div className="status-warning" role="alert">
        The circuit could not be evaluated: {this.state.error}. Reset the
        experiment or choose a valid configuration.
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const [active, setActive] = useState(0),
    [modes, setModes] = useState<Mode[]>(Array(9).fill("Explore")),
    [resets, setResets] = useState<number[]>(Array(9).fill(0));
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("dc-theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const topic = topics[active],
    Simulation = topic.component;
  function activate(j: number) {
    setActive(j);
    requestAnimationFrame(() =>
      tabs.current[j]?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "instant",
      }),
    );
  }
  function changeTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("dc-theme", next);
    } catch {
      /* Preferences are optional. */
    }
  }
  return (
    <div className="app" data-theme={theme}>
      <a className="skip" href="#experiment">
        Skip to experiment
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            activate(0);
          }}
        >
          <span className="brand-icon">ϟ</span>
          <span>
            DC Circuit <b>Lab</b>
            <small>THE INTERACTIVE PHYSICS LABORATORY</small>
          </span>
        </a>
        <div className="header-right">
          <span className="semester">
            Physics 2 <i /> Semester 2
          </span>
          <button
            className="theme-button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={changeTheme}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </header>
      <div className="page-shell">
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span>SP025</span> CHAPTER 03 <i /> VIRTUAL LABORATORY
            </div>
            <h1>
              Electric Current <span>and DC Circuits</span>
            </h1>
            <p className="chapter-subtitle">
              Physics 2 · Semester 2 · Chapter 3
            </p>
            <p>
              A hands-on way to understand the invisible. Adjust, measure,
              discover.
            </p>
          </div>
          <div className="curriculum-badge">
            <span className="badge-icon">◎</span>
            <div>
              Built for exploration
              <small>9 experiments · One connected chapter</small>
            </div>
          </div>
        </section>
        <nav className="topic-nav" aria-label="Chapter 3 subtopics">
          <div className="topic-tabs" role="tablist" aria-label="Subtopics">
            {topics.map((t, j) => (
              <button
                key={t.title}
                ref={(el) => {
                  tabs.current[j] = el;
                }}
                id={`tab-${j}`}
                role="tab"
                aria-selected={j === active}
                aria-controls="experiment"
                tabIndex={j === active ? 0 : -1}
                title={`3.${j + 1} ${t.title}`}
                aria-label={`3.${j + 1} ${t.title}`}
                onClick={() => activate(j)}
                onKeyDown={(e) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const n =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? 8
                          : (active + (e.key === "ArrowRight" ? 1 : 8)) % 9;
                    activate(n);
                    tabs.current[n]?.focus();
                  }
                }}
              >
                <span className="tab-number">3.{j + 1}</span>
                <span>{t.short}</span>
              </button>
            ))}
          </div>
          <div className="nav-hint">Swipe to explore all 9 subtopics →</div>
        </nav>
        <main>
          <section
            id="experiment"
            role="tabpanel"
            aria-labelledby={`tab-${active}`}
            tabIndex={-1}
          >
            <div className="experiment-heading">
              <div className="experiment-title">
                <span className="topic-icon">{topic.icon}</span>
                <div>
                  <span className="eyebrow">EXPERIMENT 3.{active + 1}</span>
                  <h2>
                    3.{active + 1} {topic.title}
                  </h2>
                </div>
              </div>
              <button
                className="reset"
                onClick={() =>
                  setResets((r) => r.map((v, j) => (j === active ? v + 1 : v)))
                }
              >
                ↻ <span>Reset experiment</span>
              </button>
            </div>
            <p className="experiment-description">{topic.description}</p>
            <div className="mode-bar">
              <div
                className="mode-tabs"
                role="group"
                aria-label="Learning mode"
              >
                {(["Explore", "Experiment", "Challenge"] as Mode[]).map(
                  (m, j) => (
                    <button
                      key={m}
                      aria-pressed={modes[active] === m}
                      aria-label={m}
                      onClick={() =>
                        setModes((s) => s.map((v, i) => (i === active ? m : v)))
                      }
                    >
                      <span>{["◉", "⚗", "◇"][j]}</span>
                      {m}
                    </button>
                  ),
                )}
              </div>
              <span className="mode-caption">
                {modes[active] === "Explore"
                  ? "Your curiosity is the starting point."
                  : modes[active] === "Experiment"
                    ? "Follow the procedure. Collect your evidence."
                    : "Predict first. Then check your reasoning."}
              </span>
            </div>
            <Boundary key={String(active)}>
              <Suspense
                fallback={
                  <div className="loading">Preparing the experiment…</div>
                }
              >
                <Simulation mode={modes[active]} resetKey={resets[active]} />
              </Suspense>
            </Boundary>
          </section>
        </main>
        <footer>
          <span>
            <b>DC Circuit Lab</b> · Physics 2 · Semester 2
          </span>
          <span>
            SP025 curriculum · Chapter 3 <span className="footer-dot">●</span>{" "}
            All calculations run on your device
          </span>
        </footer>
      </div>
    </div>
  );
}
