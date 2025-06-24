const STORAGE_KEY = 'kirakira_mute_words';

const elements = {
  newWordInput: document.getElementById('new-word-input'),
  addWordBtn: document.getElementById('add-word-btn'),
  muteWordsList: document.getElementById('mute-words-list'),
  wordCount: document.getElementById('word-count'),
  resetDefaultBtn: document.getElementById('reset-default-btn')
};

let muteWords = [];

async function loadMuteWords() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    muteWords = result[STORAGE_KEY] || [];
    renderMuteWords();
  } catch (error) {
    console.error('Failed to load mute words:', error);
  }
}

async function saveMuteWords() {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: muteWords });
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

function createWordItem(word, index) {
  const item = document.createElement('div');
  item.className = 'word-item';
  
  const wordText = document.createElement('span');
  wordText.className = 'word-text';
  wordText.textContent = word;
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = '✕';
  deleteBtn.title = '削除';
  deleteBtn.onclick = () => deleteWord(index);
  
  item.appendChild(wordText);
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
  
  if (muteWords.includes(newWord)) {
    elements.newWordInput.classList.add('duplicate');
    setTimeout(() => {
      elements.newWordInput.classList.remove('duplicate');
    }, 300);
    return;
  }
  
  muteWords.push(newWord);
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

async function loadDefaultWords() {
  try {
    const response = await fetch(chrome.runtime.getURL('src/default-mute-words.json'));
    const data = await response.json();
    const defaultWords = data.defaultMuteWords || [];
    
    if (confirm(`デフォルトのミュートワード（${defaultWords.length}個）を読み込みますか？\n現在のワードは置き換えられます。`)) {
      muteWords = [...defaultWords];
      await saveMuteWords();
      renderMuteWords();
      
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

document.addEventListener('DOMContentLoaded', loadMuteWords);