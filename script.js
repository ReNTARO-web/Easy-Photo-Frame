document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const canvasContainer = document.getElementById('canvasContainer');
    const imageWrapper = document.getElementById('imageWrapper');
    const uploadedImage = document.getElementById('uploadedImage');
    const snapGuides = document.getElementById('snapGuides');

    let currentLayer = null;
    let isDragging = false;
    let isResizing = false;
    let resizeHandle = null;
    let initialX, initialY, initialWidth, initialHeight;

    // --- 1. 画像のアップロードと初期設定 ---
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImage.src = e.target.result;
                uploadedImage.onload = () => {
                    imageWrapper.style.display = 'block';
                    // 画像の初期サイズをコンテナの80%に設定
                    const containerWidth = canvasContainer.offsetWidth;
                    const containerHeight = canvasContainer.offsetHeight;
                    const imgRatio = uploadedImage.naturalWidth / uploadedImage.naturalHeight;
                    const containerRatio = containerWidth / containerHeight;

                    let newWidth, newHeight;
                    if (imgRatio > containerRatio) {
                        newWidth = containerWidth * 0.8;
                        newHeight = newWidth / imgRatio;
                    } else {
                        newHeight = containerHeight * 0.8;
                        newWidth = newHeight * imgRatio;
                    }

                    imageWrapper.style.width = `${newWidth}px`;
                    imageWrapper.style.height = `${newHeight}px`;
                    imageWrapper.style.left = `${(containerWidth - newWidth) / 2}px`;
                    imageWrapper.style.top = `${(containerHeight - newHeight) / 2}px`;

                    currentLayer = imageWrapper;
                    updateSnapGuides();
                };
            };
            reader.readAsDataURL(file);
        }
    });

    // --- 2. ドラッグ機能 ---
    imageWrapper.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle')) {
            isResizing = true;
            resizeHandle = e.target;
            initialWidth = imageWrapper.offsetWidth;
            initialHeight = imageWrapper.offsetHeight;
            initialX = e.clientX;
            initialY = e.clientY;
            return;
        }

        isDragging = true;
        initialX = e.clientX - imageWrapper.offsetLeft;
        initialY = e.clientY - imageWrapper.offsetTop;
        imageWrapper.style.cursor = 'grabbing';
    });

    // --- 3. リサイズ機能 ---
    canvasContainer.addEventListener('mousemove', (e) => {
        if (isResizing) {
            const dx = e.clientX - initialX;
            const dy = e.clientY - initialY;

            let newWidth = initialWidth;
            let newHeight = initialHeight;

            if (resizeHandle.classList.contains('top-left')) {
                newWidth = initialWidth - dx;
                newHeight = initialHeight - dy;
                imageWrapper.style.left = `${imageWrapper.offsetLeft + dx}px`;
                imageWrapper.style.top = `${imageWrapper.offsetTop + dy}px`;
            } else if (resizeHandle.classList.contains('top-right')) {
                newWidth = initialWidth + dx;
                newHeight = initialHeight - dy;
                imageWrapper.style.top = `${imageWrapper.offsetTop + dy}px`;
            } else if (resizeHandle.classList.contains('bottom-left')) {
                newWidth = initialWidth - dx;
                newHeight = initialHeight + dy;
                imageWrapper.style.left = `${imageWrapper.offsetLeft + dx}px`;
            } else if (resizeHandle.classList.contains('bottom-right')) {
                newWidth = initialWidth + dx;
                newHeight = initialHeight + dy;
            }

            // 縦横比を維持
            const newRatio = newWidth / newHeight;
            const originalRatio = initialWidth / initialHeight;
            if (Math.abs(newRatio - originalRatio) > 0.1) {
                if (newWidth / initialWidth > newHeight / initialHeight) {
                    newHeight = newWidth / originalRatio;
                } else {
                    newWidth = newHeight * originalRatio;
                }
            }

            // 最小サイズを設定
            if (newWidth > 50 && newHeight > 50) {
                imageWrapper.style.width = `${newWidth}px`;
                imageWrapper.style.height = `${newHeight}px`;
                updateSnapGuides();
            }
            return;
        }

        if (!isDragging) return;

        const newX = e.clientX - initialX;
        const newY = e.clientY - initialY;

        imageWrapper.style.left = `${newX}px`;
        imageWrapper.style.top = `${newY}px`;
        updateSnapGuides();
    });

    // --- 4. ドラッグとリサイズ終了 ---
    canvasContainer.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        imageWrapper.style.cursor = 'grab';
    });

    // --- 5. スナップガイドの更新 ---
    const updateSnapGuides = () => {
        if (!currentLayer || currentLayer.style.display === 'none') {
            snapGuides.style.display = 'none';
            return;
        }

        const layerRect = currentLayer.getBoundingClientRect();
        const containerRect = canvasContainer.getBoundingClientRect();

        // レイヤーの中央座標を計算 (canvasContainerに対する相対位置)
        const layerCenterX = layerRect.left + layerRect.width / 2 - containerRect.left;
        const layerCenterY = layerRect.top + layerRect.height / 2 - containerRect.top;

        const horizontalGuide = snapGuides.querySelector('.snap-line.horizontal');
        const verticalGuide = snapGuides.querySelector('.snap-line.vertical');

        if (horizontalGuide && verticalGuide) {
            horizontalGuide.style.top = `${layerCenterY}px`;
            verticalGuide.style.left = `${layerCenterX}px`;
            snapGuides.style.display = 'block';
        }
    };

    // ウィンドウサイズ変更時にスナップガイドを更新
    window.addEventListener('resize', updateSnapGuides);
});
