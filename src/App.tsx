import React, { useEffect, useState } from 'react';
import './App.css';
import States from './components/States';

const PINNED_KEY = 'mobxVisualizerPinned';
const WINDOW_ID_KEY = 'mobxVisualizerWindowId';

function isStandaloneWindow(): boolean {
  return new URLSearchParams(window.location.search).has('pinned');
}

function openStandaloneWindow(activeTabId?: number | null): void {
  const params = new URLSearchParams({ pinned: '1' });
  if (activeTabId != null) {
    params.set('tabId', String(activeTabId));
  }
  const url = chrome.runtime.getURL(`index.html?${params.toString()}`);
  chrome.windows.create(
    { url, type: 'popup', width: 620, height: 440 },
    (win) => {
      if (win?.id != null) {
        void chrome.storage.local.set({ [WINDOW_ID_KEY]: win.id });
      }
      window.close();
    },
  );
}

function focusExistingWindow(windowId: number): void {
  chrome.windows.update(windowId, { focused: true }, (win) => {
    if (chrome.runtime.lastError != null || win == null) {
      void chrome.storage.local.remove(WINDOW_ID_KEY);
      openStandaloneWindow();
    } else {
      window.close();
    }
  });
}

function App(): React.JSX.Element {
  const [pinned, setPinned] = useState<boolean>(isStandaloneWindow());
  const [ready, setReady] = useState<boolean>(isStandaloneWindow());

  useEffect(() => {
    if (isStandaloneWindow()) {
      document.body.classList.add('standalone');
    }
  }, []);

  useEffect(() => {
    if (isStandaloneWindow()) return;

    chrome?.tabs?.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
      const tabId = tab?.id;
      chrome?.storage?.local?.get([PINNED_KEY, WINDOW_ID_KEY], (result) => {
        if (result?.[PINNED_KEY]) {
          const existingWindowId = result?.[WINDOW_ID_KEY] as
            | number
            | undefined;
          if (existingWindowId != null) {
            focusExistingWindow(existingWindowId);
          } else {
            openStandaloneWindow(tabId);
          }
          return;
        }
        setReady(true);
      });
    });
  }, []);

  const handleToggle = (): void => {
    if (pinned) {
      void chrome.storage.local.set({ [PINNED_KEY]: false });
      void chrome.storage.local.remove(WINDOW_ID_KEY);
      setPinned(false);
      window.close();
    } else {
      void chrome.storage.local.set({ [PINNED_KEY]: true });
      const params = new URLSearchParams(window.location.search);
      const tabIdFromUrl = params.get('tabId');
      const tabId = tabIdFromUrl != null ? Number(tabIdFromUrl) : null;
      if (isStandaloneWindow() && tabId != null) {
        openStandaloneWindow(tabId);
      } else {
        chrome?.tabs?.query(
          { active: true, lastFocusedWindow: true },
          ([tab]) => {
            openStandaloneWindow(tab?.id);
          },
        );
      }
    }
  };

  if (!ready) return <div className='App' />;

  return (
    <div className={`App ${isStandaloneWindow() ? 'App--standalone' : ''}`}>
      <div className='App__header'>
        <div className='App__header__title'>Mobx Visualizer</div>
        <button
          className={`App__header__pin ${pinned ? 'App__header__pin--active' : ''}`}
          onClick={handleToggle}
          title={pinned ? 'Unpin window' : 'Pin window (keep open)'}
        >
          <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
            <path d='M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5a.5.5 0 0 1-1 0V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A6 6 0 0 1 5 6.708V2.277a3 3 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354' />
          </svg>
        </button>
      </div>
      <States />
    </div>
  );
}

export default App;
