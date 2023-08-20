function injectScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement('script')
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', file_path);
  node.appendChild(script);
}

// eslint-disable-next-line no-undef
injectScript(chrome.runtime.getURL('scripts/inject-script.js'), 'body');

window.addEventListener('message', function(event) {
  if(event.data.type && event.data.type === 'FROM_PAGE') {
    if(event?.data?.mobxVisualizerData?.mobxVisualizer) {
      // eslint-disable-next-line no-undef
      chrome.runtime.sendMessage(chrome.runtime.id, {mobxVisualizerData: event.data.mobxVisualizerData});
    }
  }
}, false);