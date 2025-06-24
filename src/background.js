const STORAGE_KEY = 'kirakira_mute_words';

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated. Reason:', details.reason);
  
  if (details.reason === 'install') {
    try {
      const url = chrome.runtime.getURL('src/default-mute-words.json');
      console.log('Loading default words from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const defaultWords = data.defaultMuteWords || [];
      
      console.log('Default words parsed:', defaultWords);
      
      await chrome.storage.sync.set({
        [STORAGE_KEY]: defaultWords
      });
      
      console.log('Default mute words saved:', defaultWords.length, 'words');
      
      // Verify the save
      const saved = await chrome.storage.sync.get([STORAGE_KEY]);
      console.log('Verification - saved words:', saved[STORAGE_KEY]);
    } catch (error) {
      console.error('Failed to load default mute words:', error);
      await chrome.storage.sync.set({
        [STORAGE_KEY]: []
      });
    }
  } else if (details.reason === 'update') {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    console.log('Update - existing words:', result[STORAGE_KEY]?.length || 0);
    
    // 開発中のテスト用: ワードが空の場合はデフォルトを読み込む
    if (!result[STORAGE_KEY] || result[STORAGE_KEY].length === 0) {
      try {
        const url = chrome.runtime.getURL('src/default-mute-words.json');
        console.log('Loading default words on update...');
        
        const response = await fetch(url);
        const data = await response.json();
        const defaultWords = data.defaultMuteWords || [];
        
        await chrome.storage.sync.set({
          [STORAGE_KEY]: defaultWords
        });
        
        console.log('Default words loaded on update:', defaultWords.length);
      } catch (error) {
        console.error('Failed to load default words on update:', error);
        await chrome.storage.sync.set({
          [STORAGE_KEY]: []
        });
      }
    }
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.action.openPopup();
});