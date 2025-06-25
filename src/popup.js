const STORAGE_KEY = 'kirakira_mute_words';
const STORAGE_KEY_V2 = 'kirakira_mute_words_v2';

const elements = {
  newWordInput: document.getElementById('new-word-input'),
  addWordBtn: document.getElementById('add-word-btn'),
  muteWordsList: document.getElementById('mute-words-list'),
  wordCount: document.getElementById('word-count'),
  resetDefaultBtn: document.getElementById('reset-default-btn'),
  toggleAllWords: document.getElementById('toggle-all-words'),
  exportBtn: document.getElementById('export-btn'),
  importBtn: document.getElementById('import-btn'),
  importFile: document.getElementById('import-file')
};

let muteWords = [];

async function loadMuteWords() {
  try {
    const resultV2 = await chrome.storage.sync.get([STORAGE_KEY_V2]);
    if (resultV2[STORAGE_KEY_V2]) {
      muteWords = resultV2[STORAGE_KEY_V2];
    } else {
      const resultV1 = await chrome.storage.sync.get([STORAGE_KEY]);
      if (resultV1[STORAGE_KEY]) {
        muteWords = resultV1[STORAGE_KEY].map(word => ({ text: word, enabled: true }));
        await saveMuteWords();
      } else {
        muteWords = [];
      }
    }
    updateToggleAllState();
    renderMuteWords();
  } catch (error) {
    console.error('Failed to load mute words:', error);
  }
}

async function saveMuteWords() {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY_V2]: muteWords });
    const enabledWords = muteWords.filter(w => w.enabled).map(w => w.text);
    await chrome.storage.sync.set({ [STORAGE_KEY]: enabledWords });
    updateWordCount();
  } catch (error) {
    console.error('Failed to save mute words:', error);
  }
}

function renderMuteWords() {
  elements.muteWordsList.innerHTML = '';
  
  if (muteWords.length === 0) {
    elements.muteWordsList.innerHTML = '<p class="empty-message">ミュートワードがありません</p>';
  } else {
    muteWords.forEach((word, index) => {
      const wordItem = createWordItem(word, index);
      elements.muteWordsList.appendChild(wordItem);
    });
  }
  
  updateWordCount();
}

function createWordItem(wordObj, index) {
  const item = document.createElement('div');
  item.className = 'word-item';
  if (!wordObj.enabled) {
    item.classList.add('disabled');
  }
  
  const wordText = document.createElement('span');
  wordText.className = 'word-text';
  wordText.textContent = wordObj.text;
  
  const toggleBtn = document.createElement('label');
  toggleBtn.className = 'toggle-switch small';
  toggleBtn.style.marginLeft = 'auto';
  toggleBtn.style.marginRight = '8px';
  
  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.checked = wordObj.enabled;
  toggleInput.onchange = () => toggleWord(index);
  
  const toggleSlider = document.createElement('span');
  toggleSlider.className = 'toggle-slider';
  
  toggleBtn.appendChild(toggleInput);
  toggleBtn.appendChild(toggleSlider);
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = '✕';
  deleteBtn.title = '削除';
  deleteBtn.onclick = () => deleteWord(index);
  
  item.appendChild(wordText);
  item.appendChild(toggleBtn);
  item.appendChild(deleteBtn);
  
  return item;
}

function addWord() {
  const newWord = elements.newWordInput.value.trim();
  
  if (newWord === '') {
    elements.newWordInput.classList.add('error');
    setTimeout(() => {
      elements.newWordInput.classList.remove('error');
    }, 300);
    return;
  }
  
  if (muteWords.some(w => w.text === newWord)) {
    elements.newWordInput.classList.add('duplicate');
    setTimeout(() => {
      elements.newWordInput.classList.remove('duplicate');
    }, 300);
    return;
  }
  
  muteWords.push({ text: newWord, enabled: true });
  saveMuteWords();
  renderMuteWords();
  
  elements.newWordInput.value = '';
  elements.newWordInput.focus();
  
  const wordItems = document.querySelectorAll('.word-item');
  if (wordItems.length > 0) {
    wordItems[wordItems.length - 1].classList.add('new-word');
  }
}

function deleteWord(index) {
  const wordItem = elements.muteWordsList.children[index];
  wordItem.classList.add('deleting');
  
  setTimeout(() => {
    muteWords.splice(index, 1);
    saveMuteWords();
    renderMuteWords();
  }, 300);
}

function updateWordCount() {
  elements.wordCount.textContent = muteWords.length;
}

function toggleWord(index) {
  muteWords[index].enabled = !muteWords[index].enabled;
  saveMuteWords();
  renderMuteWords();
  updateToggleAllState();
}

function toggleAllWords() {
  const newState = elements.toggleAllWords.checked;
  muteWords.forEach(word => {
    word.enabled = newState;
  });
  saveMuteWords();
  renderMuteWords();
  updateToggleLabelText();
}

function updateToggleAllState() {
  const enabledCount = muteWords.filter(w => w.enabled).length;
  if (enabledCount === 0) {
    elements.toggleAllWords.checked = false;
    elements.toggleAllWords.indeterminate = false;
  } else if (enabledCount === muteWords.length) {
    elements.toggleAllWords.checked = true;
    elements.toggleAllWords.indeterminate = false;
  } else {
    elements.toggleAllWords.checked = false;
    elements.toggleAllWords.indeterminate = true;
  }
  updateToggleLabelText();
}

function updateToggleLabelText() {
  const label = document.querySelector('.toggle-label');
  if (elements.toggleAllWords.checked) {
    label.textContent = 'すべて有効';
  } else if (elements.toggleAllWords.indeterminate) {
    label.textContent = '一部有効';
  } else {
    label.textContent = 'すべて無効';
  }
}

async function loadDefaultWords() {
  try {
    const response = await fetch(chrome.runtime.getURL('src/default-mute-words.json'));
    const data = await response.json();
    const defaultWords = data.defaultMuteWords || [];
    
    if (confirm(`デフォルトのミュートワード（${defaultWords.length}個）を読み込みますか？\n現在のワードは置き換えられます。`)) {
      muteWords = defaultWords.map(word => ({ text: word, enabled: true }));
      await saveMuteWords();
      renderMuteWords();
      updateToggleAllState();
      
      // 成功メッセージを表示
      elements.resetDefaultBtn.textContent = '✓ 読み込み完了';
      elements.resetDefaultBtn.classList.add('success');
      setTimeout(() => {
        elements.resetDefaultBtn.textContent = 'デフォルトワードを読み込む';
        elements.resetDefaultBtn.classList.remove('success');
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to load default words:', error);
    alert('デフォルトワードの読み込みに失敗しました');
  }
}

elements.addWordBtn.addEventListener('click', addWord);

elements.newWordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addWord();
  }
});

elements.resetDefaultBtn.addEventListener('click', loadDefaultWords);

elements.toggleAllWords.addEventListener('change', toggleAllWords);

elements.exportBtn.addEventListener('click', exportMuteWords);

elements.importBtn.addEventListener('click', () => {
  elements.importFile.click();
});

elements.importFile.addEventListener('change', importMuteWords);

async function exportMuteWords() {
  const exportData = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    muteWords: muteWords
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `kirakira-mute-words-${date}.json`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
  
  elements.exportBtn.classList.add('success');
  setTimeout(() => {
    elements.exportBtn.classList.remove('success');
  }, 1000);
}

async function importMuteWords(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!validateImportData(data)) {
      throw new Error('無効なファイル形式です');
    }
    
    const importWords = data.muteWords || [];
    const wordCount = importWords.length;
    
    if (wordCount === 0) {
      alert('インポートするミュートワードがありません');
      return;
    }
    
    if (confirm(`${wordCount}個のミュートワードをインポートしますか？\n現在のワードは置き換えられます。`)) {
      muteWords = importWords;
      await saveMuteWords();
      renderMuteWords();
      updateToggleAllState();
      
      elements.importBtn.classList.add('success');
      setTimeout(() => {
        elements.importBtn.classList.remove('success');
      }, 1000);
    }
  } catch (error) {
    console.error('Import failed:', error);
    alert('ファイルのインポートに失敗しました: ' + error.message);
  } finally {
    event.target.value = '';
  }
}

function validateImportData(data) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.muteWords)) return false;
  
  return data.muteWords.every(item => 
    typeof item === 'object' &&
    typeof item.text === 'string' &&
    typeof item.enabled === 'boolean'
  );
}

document.addEventListener('DOMContentLoaded', loadMuteWords);