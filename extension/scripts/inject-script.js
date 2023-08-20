// ======================================================
// Flatted library code to stringify circular JSON objects (ref: https://github.com/WebReflection/flatted/blob/main/cjs/index.js)
// ======================================================
const {parse: $parse, stringify: $stringify} = JSON;
const {keys} = Object;

const Primitive = String;   // it could be Number
const primitive = 'string'; // it could be 'number'

const ignore = {};
const object = 'object';

const noop = (_, value) => value;

const primitives = value => (
    value instanceof Primitive ? Primitive(value) : value
  );
  
const Primitives = (_, value) => (
    typeof value === primitive ? new Primitive(value) : value
);

const set = (known, input, value) => {
    const index = Primitive(input.push(value) - 1);
    known.set(value, index);
    return index;
};
  
const revive = (input, parsed, output, $) => {
    const lazy = [];
    for (let ke = keys(output), {length} = ke, y = 0; y < length; y++) {
        const k = ke[y];
        const value = output[k];
        if (value instanceof Primitive) {
        const tmp = input[value];
        if (typeof tmp === object && !parsed.has(tmp)) {
            parsed.add(tmp);
            output[k] = ignore;
            lazy.push({k, a: [input, parsed, tmp, $]});
        }
        else
            output[k] = $.call(output, k, tmp);
        }
        else if (output[k] !== ignore)
        output[k] = $.call(output, k, value);
    }
    for (let {length} = lazy, i = 0; i < length; i++) {
        const {k, a} = lazy[i];
        output[k] = $.call(output, k, revive.apply(null, a));
    }
    return output;
};  
  
const parse = (text, reviver) => {
    const input = $parse(text, Primitives).map(primitives);
    const value = input[0];
    const $ = reviver || noop;
    const tmp = typeof value === object && value ?
                revive(input, new Set, value, $) :
                value;
    return $.call({'': tmp}, '', tmp);
  };

const stringify = (value, replacer, space) => {
    const $ = replacer && typeof replacer === object ?
              (k, v) => (k === '' || -1 < replacer.indexOf(k) ? v : void 0) :
              (replacer || noop);
    const known = new Map;
    const input = [];
    const output = [];
    let i = +set(known, input, $.call({'': value}, '', value));
    let firstRun = !i;
    while (i < input.length) {
      firstRun = true;
      output[i] = $stringify(input[i++], replace, space);
    }
    return '[' + output.join(',') + ']';
    function replace(key, value) {
      if (firstRun) {
        firstRun = !firstRun;
        return value;
      }
      const after = $.call(this, key, value);
      switch (typeof after) {
        case object:
          if (after === null) return after;
        case primitive:
          return known.get(after) || set(known, input, after);
      }
      return after;
    }
}; 


// ======================================================
// Script to attach event listener to store changes
// ======================================================

function parseStore (store) {
    return store && stringify(store);
}

function getMobxStoreData () {
    const storeData = {};
    storeData.mobxVisualizer = parseStore(window.__MOBX_VISUALIZER__) || null;

    return storeData;
}

function attachStateChangeEventListener () {
    const currentStoreState = parseStore(window.__MOBX_VISUALIZER__) || {},
        prevStoreState = parseStore(window.__MOBX_VISUALIZER_PREV__) || {};

    for(const storeKey in currentStoreState) {
        const currentState = currentStoreState[storeKey];
        if(stringify(currentState) !== stringify(prevStoreState[storeKey])) {
          // Stores parsed information
          if(!window.__MOBX_VISUALIZER_PREV__) {
            window.__MOBX_VISUALIZER_PREV__ = {}
          }
          window.__MOBX_VISUALIZER_PREV__[storeKey] = currentStoreState[storeKey];

        }
    }
    // Send info to client
    window.postMessage({type: "FROM_PAGE", mobxVisualizerData: getMobxStoreData()});
}


setInterval(() => {
    attachStateChangeEventListener();
}, 1000);