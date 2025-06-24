const STORAGE_KEY = 'kirakira_mute_words';
let muteWords = [];

async function loadMuteWords() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    muteWords = result[STORAGE_KEY] || [];
    console.log('Mute words loaded:', muteWords.length, muteWords);
  } catch (error) {
    console.error('Failed to load mute words:', error);
    muteWords = [];
  }
}

function containsMuteWord(text) {
  if (!text || muteWords.length === 0) {
    console.log('No text or no mute words:', text?.length, muteWords.length);
    return false;
  }
  
  const lowerText = text.toLowerCase();
  const found = muteWords.some(word => {
    if (word.trim() === '') return false;
    const match = lowerText.includes(word.toLowerCase());
    if (match) {
      console.log('Mute word found:', word, 'in text:', text.substring(0, 100));
    }
    return match;
  });
  
  return found;
}

function createKirakiraOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'kirakira-overlay';
  
  // 中心の爆発エフェクト
  const explosion = document.createElement('div');
  explosion.className = 'kirakira-explosion';
  overlay.appendChild(explosion);
  
  // カラフルな破片を生成
  const colors = [
    '#FFE186', // 黄色
    '#FF6B9D', // ピンク
    '#66D9EF', // 水色
    '#A6E22E', // 緑
    '#FD971F', // オレンジ
    '#AE81FF', // 紫
    '#FF69B4', // ホットピンク
    '#00CED1', // ダークターコイズ
  ];
  
  // 大きな破片（数を削減）
  for (let i = 0; i < 12; i++) {
    const fragment = document.createElement('div');
    fragment.className = 'kirakira-fragment-large';
    
    const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3;
    const velocity = 150 + Math.random() * 100;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    fragment.style.setProperty('--angle', `${angle}rad`);
    fragment.style.setProperty('--velocity', `${velocity}%`);
    fragment.style.setProperty('--color', color);
    fragment.style.setProperty('--delay', `${Math.random() * 0.2}s`);
    fragment.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    
    overlay.appendChild(fragment);
  }
  
  // 小さな破片（数を削減）
  for (let i = 0; i < 20; i++) {
    const fragment = document.createElement('div');
    fragment.className = 'kirakira-fragment-small';
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = 200 + Math.random() * 150;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    fragment.style.setProperty('--angle', `${angle}rad`);
    fragment.style.setProperty('--velocity', `${velocity}%`);
    fragment.style.setProperty('--color', color);
    fragment.style.setProperty('--delay', `${Math.random() * 0.4}s`);
    
    overlay.appendChild(fragment);
  }
  
  // キラキラ光点（数を削減）
  for (let i = 0; i < 8; i++) {
    const star = document.createElement('div');
    star.className = 'kirakira-star';
    
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    star.style.setProperty('--x', `${x}%`);
    star.style.setProperty('--y', `${y}%`);
    star.style.setProperty('--delay', `${Math.random() * 2}s`);
    
    overlay.appendChild(star);
  }
  
  const clickHint = document.createElement('div');
  clickHint.className = 'kirakira-hint';
  clickHint.textContent = 'Click to reveal (spoiler hidden)';
  overlay.appendChild(clickHint);
  
  overlay.addEventListener('click', function(e) {
    e.stopPropagation();
    this.classList.add('kirakira-revealing');
    setTimeout(() => {
      this.remove();
    }, 600);
  });
  
  return overlay;
}

function processPost(article) {
  if (article.hasAttribute('data-kirakira-processed')) return;
  
  const textElements = article.querySelectorAll('[data-testid="tweetText"], [data-testid="tweet-text-show-more-link"], .css-901oao.r-1nao33i.r-37j5jr.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-bnwqim.r-qvutc0');
  
  let postText = '';
  textElements.forEach(el => {
    postText += el.textContent + ' ';
  });
  
  if (containsMuteWord(postText)) {
    const existingOverlay = article.querySelector('.kirakira-overlay');
    if (!existingOverlay) {
      article.style.position = 'relative';
      const overlay = createKirakiraOverlay();
      article.appendChild(overlay);
    }
  }
  
  article.setAttribute('data-kirakira-processed', 'true');
}

function processPosts() {
  const posts = document.querySelectorAll('article[data-testid="tweet"]');
  posts.forEach(processPost);
}

function observeTimeline() {
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && 
              (node.matches('article[data-testid="tweet"]') || 
               node.querySelector('article[data-testid="tweet"]'))) {
            shouldProcess = true;
            break;
          }
        }
      }
    }
    
    if (shouldProcess) {
      requestAnimationFrame(processPosts);
    }
  });
  
  const timeline = document.body;
  if (timeline) {
    observer.observe(timeline, {
      childList: true,
      subtree: true
    });
  }
  
  processPosts();
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes[STORAGE_KEY]) {
    muteWords = changes[STORAGE_KEY].newValue || [];
    
    document.querySelectorAll('[data-kirakira-processed]').forEach(article => {
      article.removeAttribute('data-kirakira-processed');
    });
    
    processPosts();
  }
});

async function init() {
  console.log('Kirakira extension initializing...');
  await loadMuteWords();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeTimeline);
  } else {
    observeTimeline();
  }
}

init();