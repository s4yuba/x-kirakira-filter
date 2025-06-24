# アイコン生成ガイド

拡張機能に必要なアイコンを生成する方法を説明します。

## 必要なアイコン

- `icon16.png` - 16x16ピクセル
- `icon48.png` - 48x48ピクセル  
- `icon128.png` - 128x128ピクセル

## 生成方法

### 方法1: HTMLファイルを使用

以下のHTMLをブラウザで開いて、各サイズのアイコンを生成できます：

```html
<!DOCTYPE html>
<html>
<head>
    <title>Generate Kirakira Icons</title>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script>
        function generateIcon(size) {
            const canvas = document.getElementById('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);
            
            // Draw star
            ctx.save();
            ctx.translate(size/2, size/2);
            
            // Star properties
            const outerRadius = size * 0.35;
            const innerRadius = size * 0.15;
            const spikes = 8;
            
            ctx.beginPath();
            ctx.fillStyle = 'white';
            
            for(let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI) / spikes;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if(i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.closePath();
            ctx.fill();
            
            // Add glow effect
            ctx.shadowColor = 'white';
            ctx.shadowBlur = size * 0.1;
            ctx.fill();
            
            ctx.restore();
            
            // Add small sparkles
            const sparkleCount = Math.floor(size / 20);
            for(let i = 0; i < sparkleCount; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const sparkleSize = Math.random() * 2 + 1;
                
                ctx.beginPath();
                ctx.arc(x, y, sparkleSize, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fill();
            }
            
            // Download the icon
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.download = `icon${size}.png`;
                a.href = url;
                a.click();
                URL.revokeObjectURL(url);
            });
        }
        
        // Generate all required sizes
        setTimeout(() => generateIcon(16), 100);
        setTimeout(() => generateIcon(48), 300);
        setTimeout(() => generateIcon(128), 500);
    </script>
    <p>Icons will be generated automatically. Please save them as icon16.png, icon48.png, and icon128.png</p>
</body>
</html>
```

### 方法2: 画像編集ソフトを使用

1. 紫色のグラデーション背景（#667eea → #764ba2）を作成
2. 中央に白い8角星を配置
3. 周りに小さな白い光の粒子を散りばめる
4. 各サイズにリサイズして保存

生成したアイコンは `icons/` ディレクトリに保存してください。