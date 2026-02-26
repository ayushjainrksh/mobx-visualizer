import React, { useEffect, useRef, useState } from 'react';
import { JSONTree } from 'react-json-tree';
import { parse } from 'flatted';
import './styles/States.css';

const STORAGE_PREFIX = 'mobxVisualizerState_';

const sampleData = {
  mobxVisualizer: {
    sampleStore: {
      storeData: ['abc'],
    },
  },
};

const States = (): React.JSX.Element => {
  const [mobxStore, setMobxStore] = useState<Record<string, any>>(
    sampleData.mobxVisualizer,
  );
  const [filters, setFilters] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const activeTabIdRef = useRef<number | null>(null);

  const filteredStores = filters ? mobxStore[filters] : mobxStore;

  const resetState = (): void => {
    setMobxStore(sampleData.mobxVisualizer);
    setFilters('');
    setSearchValue('');
    setIsLoading(true);
  };

  const loadCachedState = (tabId: number): void => {
    const key = `${STORAGE_PREFIX}${tabId}`;
    chrome?.storage?.local?.get(key, (result) => {
      const cached = result?.[key];
      if (cached?.mobxStore) {
        setMobxStore(cached.mobxStore);
        setFilters(cached.filters ?? '');
        setSearchValue(cached.searchValue ?? '');
        setIsLoading(false);
      } else {
        resetState();
      }
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabIdFromUrl = params.get('tabId');

    if (tabIdFromUrl != null) {
      const tabId = Number(tabIdFromUrl);
      activeTabIdRef.current = tabId;
      loadCachedState(tabId);
    } else {
      chrome?.tabs?.query(
        { active: true, lastFocusedWindow: true },
        ([tab]) => {
          if (tab?.id != null) {
            activeTabIdRef.current = tab.id;
            loadCachedState(tab.id);
          }
        },
      );
    }

    chrome?.tabs?.onActivated?.addListener((activeInfo) => {
      activeTabIdRef.current = activeInfo.tabId;
      loadCachedState(activeInfo.tabId);
    });
  }, []);

  useEffect(() => {
    if (!chrome?.runtime?.onMessage) return;
    chrome.runtime.onMessage.addListener((message, sender) => {
      const senderTabId = sender?.tab?.id;
      if (message?.pageLoaded && senderTabId != null) {
        void chrome?.storage?.local?.remove(`${STORAGE_PREFIX}${senderTabId}`);
        if (senderTabId === activeTabIdRef.current) {
          resetState();
        }
        return;
      }
      if (message?.mobxVisualizerData?.mobxVisualizer && senderTabId != null) {
        if (senderTabId === activeTabIdRef.current) {
          const parsed = parse(message?.mobxVisualizerData?.mobxVisualizer);
          setMobxStore(parsed);
          setIsLoading(false);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (isLoading || activeTabIdRef.current == null) return;
    const key = `${STORAGE_PREFIX}${activeTabIdRef.current}`;
    void chrome?.storage?.local?.set({
      [key]: { mobxStore, filters, searchValue },
    });
  }, [mobxStore, filters, searchValue, isLoading]);

  const renderStores = (): React.JSX.Element[] => {
    const storeList = [];
    for (const store in mobxStore) {
      if (
        searchValue &&
        !store.toLowerCase().includes(searchValue.toLowerCase())
      )
        continue;

      storeList.push(
        <div
          className={`mv-states__stores__item ${filters === store ? 'mv-states__stores__item--selected' : ''}`}
          onClick={() => {
            setFilters(store);
          }}
        >
          {store}
        </div>,
      );
    }

    return storeList;
  };

  return (
    <div className='mv-states'>
      {isLoading ? (
        <div className='mv-states__loading'>
          <img src='/logo192.png' alt='Mobx Visualizer logo' />
          <div className='mv-states__loading__text'>
            <span className='mv-states__loading__text__title'>
              Connecting Mobx store...
            </span>
            <span className='mv-states__loading__text__subtitle'>
              Please refresh your tab if it takes too long to connect
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className='mv-states__stores'>
            {
              <div
                className='mv-states__stores__action'
                onClick={() => {
                  setFilters('');
                }}
              >
                {filters ? 'Clear filter' : 'Filter stores'}
              </div>
            }
            {
              <div className='mv-states__stores__search'>
                <input
                  type='text'
                  placeholder='Search stores'
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                  }}
                />
              </div>
            }
            {renderStores()}
          </div>
          <div className='mv-states__json-view'>
            <JSONTree data={filteredStores} />;
          </div>
        </>
      )}
    </div>
  );
};

export default States;
