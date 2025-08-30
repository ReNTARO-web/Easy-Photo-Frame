document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const uploadedImage = document.getElementById('uploadedImage');
    const canvasContainer = document.getElementById('canvasContainer');
    const snapGuides = document.getElementById('snapGuides');

    let currentLayer = null; // 現在選択されている（ドラッグ中の）レイヤーや画像
    let isDragging = false;
    let initialX, initialY;
    let xOffset = 0, yOffset = 0;

    // --- 1. 画像のアップロードとリサイズ ---
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImage.src = e.target.result;
                uploadedImage.style.display = 'block';
                // 画像が読み込まれたら、現在のレイヤーとして設定
                currentLayer = uploadedImage;
                updateSnapGuides(currentLayer); // 初期スナップガイドの表示
            };
            reader.readAsDataURL(file);
        }
    });

    // --- 3. スナップ機能の修正 ---
    // レイアウト変更時や画像ロード時にスナップガイドを更新する
    const updateSnapGuides = (layerElement) => {
        if (!layerElement || layerElement.style.display === 'none') {
            snapGuides.style.display = 'none';
            return;
        }

        const containerRect = canvasContainer.getBoundingClientRect();
        const layerRect = layerElement.getBoundingClientRect();

        // レイヤーの中央座標を計算 (canvasContainerに対する相対位置)
        const layerCenterX = layerRect.left + layerRect.width / 2 - containerRect.left;
        const layerCenterY = layerRect.top + layerRect.height / 2 - containerRect.top;

        // スナップガイドの位置を更新
        const horizontalGuide = snapGuides.querySelector('.snap-line.horizontal');
        const verticalGuide = snapGuides.querySelector('.snap-line.vertical');

        if (horizontalGuide && verticalGuide) {
            horizontalGuide.style.top = `${layerCenterY}px`;
            verticalGuide.style.left = `${layerCenterX}px`;
            snapGuides.style.display = 'block';
        }
    };

    // 画像のロード完了時にもスナップガイドを更新
    uploadedImage.onload = () => {
        updateSnapGuides(uploadedImage);
    };

    // リサイズイベントが発生した場合にもスナップガイドを更新
    window.addEventListener('resize', () => {
        if (currentLayer) {
            updateSnapGuides(currentLayer);
        }
    });

    // --- レイアードラッグ機能 (参考) ---
    // 実際にはより高度なドラッグ＆リサイズライブラリを使用することが多いです
    canvasContainer.addEventListener('mousedown', (e) => {
        if (e.target === uploadedImage) {
            isDragging = true;
            currentLayer = uploadedImage;
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            currentLayer.style.cursor = 'grabbing';
        }
    });

    canvasContainer.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        e.preventDefault(); // デフォルトのドラッグ動作を防止

        xOffset = e.clientX - initialX;
        yOffset = e.clientY - initialY;

        if (currentLayer) {
            currentLayer.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
            updateSnapGuides(currentLayer); // ドラッグ中にスナップガイドを更新
        }
    });

    canvasContainer.addEventListener('mouseup', () => {
        isDragging = false;
        if (currentLayer) {
            currentLayer.style.cursor = 'grab';
        }
    });

    canvasContainer.addEventListener('mouseleave', () => {
        // コンテナ外に出た場合もドラッグを終了
        isDragging = false;
        if (currentLayer) {
            currentLayer.style.cursor = 'grab';
        }
    });
});
