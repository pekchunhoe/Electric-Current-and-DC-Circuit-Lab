import { useEffect, useRef, useState } from "react";
const cache = new Map<string, unknown>();
export function useLab<T extends object>(key: string, defaults: T) {
  const [state, setState] = useState<T>(
    () => (cache.get(key) as T) ?? structuredClone(defaults),
  );
  function update<K extends keyof T>(k: K, v: T[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }
  useEffect(() => {
    cache.set(key, state);
  }, [key, state]);
  function reset() {
    setState(structuredClone(defaults));
  }
  return { s: state, set: update, setState, reset };
}
export function useClock(running: boolean, tick: (dt: number) => void) {
  const ref = useRef(tick);
  const flush = useRef<() => void>(() => {});
  ref.current = tick;
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    // Monotonic elapsed time, independent of animation frames; exclude time in hidden tabs.
    const advance = () => {
      const now = performance.now(),
        dt = (now - last) / 1000;
      last = now;
      if (!document.hidden) ref.current(dt);
    };
    flush.current = advance;
    const id = window.setInterval(advance, 100);
    const visible = () => {
      last = performance.now();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(id);
      flush.current = () => {};
      document.removeEventListener("visibilitychange", visible);
    };
  }, [running]);
  return () => flush.current();
}
