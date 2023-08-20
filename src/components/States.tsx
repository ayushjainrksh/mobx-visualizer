import { useEffect, useState } from 'react'
import { JSONTree } from 'react-json-tree';
import { parse } from 'flatted';
import './styles/States.css';

const sampleData = {
  "mobxVisualizer": {
      "sampleStore": {
          "storeData": [
            "abc"
          ]
      }
  }
};

const States = () => {
    const [mobxStore, setMobxStore] = useState(sampleData.mobxVisualizer),
      [filters, setFilters] = useState(''),
      [searchValue, setSearchValue] = useState('');

    const filteredStores = filters ? (mobxStore as any)[filters]: mobxStore;

    useEffect(() => {
      chrome?.runtime?.onMessage && chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if(message?.mobxVisualizerData?.mobxVisualizer) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
              if(tab.id === sender?.tab?.id) {
                setMobxStore(parse(message?.mobxVisualizerData?.mobxVisualizer));
              }
            })
          }
        });
    }, []);

    const renderStores = () => {
      const storeList = [];
      for(const store in mobxStore) {
        if(searchValue && !store.toLowerCase().includes(searchValue.toLowerCase())) continue;

        storeList.push(
          <div
            className={`mv-states__stores__item ${filters === store ? 'mv-states__stores__item--selected': ''}`}
            onClick={() => setFilters(store)}
          >
            {store}
          </div>
        )
      }

      return storeList;
    };

  return (
    <div className='mv-states'>
      <div className='mv-states__stores'>
        {
          <div className='mv-states__stores__action' onClick={() => setFilters('')}>
            {
              filters ? 
              'Clear filter':
              'Filter stores'
            }
          </div>
        }
        {
          <div className='mv-states__stores__search'>
            <input
              type='text'
              placeholder='Search stores'
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        }
        {renderStores()}
      </div>
      <div className='mv-states__json-view'>
        <JSONTree data={filteredStores} />;
      </div>
    </div>
  )
}

export default States;