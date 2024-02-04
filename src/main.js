document.addEventListener("DOMContentLoaded", loaded);

const cache = {};
export async function cacheFetch(url) {
  cache[url] =
    cache[url] ||
    fetch(url)
      .then((res) => res.text())
      .then((html) => {
        cache[url] = html;
        return html;
      });
  return cache[url];
}

async function hxLoad() {
  const hxLoads = document.querySelectorAll("[hx-load]");
  const hxLoadPromises = [];
  hxLoads.forEach((hxLoad) => {
    const url = hxLoad.getAttribute("hx-load");
    hxLoadPromises.push(
      cacheFetch(url).then((html) => {
        hxLoad.innerHTML = html;
        const script = hxLoad.querySelectorAll("script");
        script.forEach((script) => {
          const newScript = document.createElement("script");
          newScript.type = "module";
          newScript.id = crypto.randomUUID();
          newScript.innerText = `
            import { createComponent } from "/main.js";
            const {refs, elm, module} = await createComponent("${newScript.id}");
            ${script.innerText}
            module.remove();
            const childLen = elm.children.length;
            for (let i = childLen - 1; i >= 0; i--) {
              const child = elm.children[i];
              elm.after(child);
            }
            elm.remove();
          `;
          hxLoad.appendChild(newScript);
          script.remove();
        });
      })
    );
  });
  return await Promise.allSettled(hxLoadPromises);
}

export async function loaded() {
  await hxLoad();
}

function getAllRefs(elm) {
  const refs = elm.querySelectorAll("[ref]");
  const refsMapped = {};
  refs.forEach((ref) => {
    refsMapped[ref.getAttribute("ref")] = ref;
  });
  return refsMapped;
}

export async function createComponent(id) {
  const module = document.getElementById(id);
  module.setAttribute("already-loaded", "");
  const elm = module.parentElement;
  return { refs: getAllRefs(elm), elm, module };
}

export function createSignal(initialValue, deps = []) {
  const isFunc = typeof initialValue === "function";
  const getInternalValue = () => (isFunc ? initialValue(deps) : initialValue);
  let value = getInternalValue();

  let subscribers = [];
  const subscribe = (fn) => {
    subscribers.push(fn);
    return value;
  };
  const updateSubscribers = () => {
    subscribers.forEach((fn) => fn(value));
  };
  const setValue = (newValue) => {
    value = newValue;
    updateSubscribers();
  };
  const getValue = () => value;
  getValue.subscribe = subscribe;
  getValue.bindToText = (elmRef) => {
    bindTo("textContent", elmRef, getValue);
  };
  getValue.bindToHTML = (elmRef) => {
    bindTo("innerHTML", elmRef, getValue);
  };
  deps.forEach((dep) => {
    dep.subscribe((v) => {
      value = getInternalValue();
      updateSubscribers();
    });
  });

  return [getValue, setValue];
}

export function bindTo(prop, elmRef, signal) {
  const curVal = signal.subscribe((value) => {
    elmRef[prop] = value;
  });
  elmRef[prop] = curVal;
}
