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

const comps = {};

function createCustomElement(compTxt) {
  const div = document.createElement("div");
  div.innerHTML = compTxt;
  const script = div.querySelector("script[name]");
  const compName = script.getAttribute("name");

  class newComp extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      if (this.hasAttribute("rendered")) return;
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = compTxt;
      const script = tempDiv.querySelector("script[name]");
      const newScript = document.createElement("script");
      newScript.type = "module";
      const uuid = crypto.randomUUID();
      this.uuid = uuid;
      newScript.innerHTML = `
            import { createComponent } from "${import.meta.url.replace(
              location.origin,
              ""
            )}";
            const {refs, elm, module, children, props} = createComponent("${uuid}");
            ${script.innerHTML} 
          `;
      tempDiv.appendChild(newScript);
      this.attachShadow({ mode: "open" }).appendChild(tempDiv);
      comps[uuid] = this;
      script.remove();
      this.setAttribute("rendered", "");
    }
  }
  customElements.define(compName, newComp);
}

async function preload() {
  const preloads = document.querySelectorAll(
    "[rel=preload][as=fetch][crossorigin]"
  );
  const preloadPromises = [];
  preloads.forEach((preload) => {
    const url = preload.getAttribute("href");
    preloadPromises.push(
      cacheFetch(url).then((html) => {
        const components = html.split("--- component boundary ---");
        components.forEach((component) => {
          createCustomElement(component);
        });
      })
    );
  });
  return await Promise.allSettled(preloadPromises);
}

export async function loaded() {
  await preload();
}

function getAllRefs(elm) {
  const refs = elm.shadowRoot.querySelectorAll("[ref]");
  const refsMapped = {};
  refs.forEach((ref) => {
    refsMapped[ref.getAttribute("ref")] = ref;
  });
  return refsMapped;
}

export function createComponent(id) {
  const elm = comps[id];
  delete comps[id];
  const module = elm.shadowRoot.querySelector("script");
  const propsLen = elm.attributes.length;
  const props = {};
  for (let i = 0; i < propsLen; i++) {
    const attr = elm.attributes[i];
    try {
      props[attr.name] = JSON.parse(attr.value);
    } catch {
      props[attr.name] = attr.value;
    }
  }

  const children = Array.from(elm.children);
  children.pop();
  return { refs: getAllRefs(elm), elm, module, children, props };
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
  getValue.bindToInput = (elmRef) => {
    bindTo("value", elmRef, getValue);
    elmRef.oninput = (e) => setValue(e.target.value);
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
