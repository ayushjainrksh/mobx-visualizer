function parseStore (store) {
    return store && JSON.parse(JSON.stringify(store));
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
        if(JSON.stringify(currentState) !== JSON.stringify(prevStoreState[storeKey])) {
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
}, 500);