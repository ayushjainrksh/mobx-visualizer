import React, { useEffect, useState } from 'react';
import { JSONTree } from 'react-json-tree';
import { parse } from 'flatted';
import './styles/States.css';

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

  const filteredStores = filters ? mobxStore[filters] : mobxStore;

  useEffect(() => {
    chrome?.runtime?.onMessage &&
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.mobxVisualizerData?.mobxVisualizer) {
          chrome.tabs.query(
            { active: true, lastFocusedWindow: true },
            ([tab]) => {
              if (tab.id === sender?.tab?.id) {
                setMobxStore(
                  parse(message?.mobxVisualizerData?.mobxVisualizer),
                );
                setIsLoading(false);
              }
            },
          );
        }
      });
  }, []);

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
