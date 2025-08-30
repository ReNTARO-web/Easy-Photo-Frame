document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const addTextButton = document.getElementById('addTextButton');
    const canvasContainer = document.getElementById('canvasContainer');
    const snapGuides = document.getElementById('snapGuides');
    const layerList = document.getElementById('layerList');

    let layers = []; // すべてのレイヤーを管理する配列
    let activeLayer = null;

    // --- 1. レイヤー管理とアクティブ化 ---
    const activateLayer = (layerElement) => {
        if (activeLayer) {
            activeLayer.classList.remove('active');
            // テキストレイヤーの場合、編集不可にする
            if (activeLayer.classList.contains('text-layer')) {
                activeLayer.setAttribute('contenteditable', 'false');
            }
        }
        activeLayer = layerElement;
        activeLayer.classList.add('active');
        updateSnapGuides();
        updateLayerList();
    };

    const updateLayerList = () => {
        layerList.innerHTML = '';
        layers.forEach((layer, index) => {
            const li = document.createElement('li');
            li.classList.add('layer-item');
            if (layer === activeLayer) {
                li.classList.add('active');
            }

            const layerName = layer.dataset.name || `レイヤー ${layers.length - index}`;
            li.textContent = layerName;
            li.addEventListener('click', () => {
                activateLayer(layer);
            });
            layerList.prepend(li); // 新しいレイヤーをリストの先頭に追加
        });
    };

    // --- 2. 画像のアップロードと初期設定 ---
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageWrapper = document.getElementById('imageWrapper');
                const uploadedImage = document.getElementById('uploadedImage');
                uploadedImage.src = e.target.result;
                uploadedImage.onload = () => {
                    imageWrapper.style.display = 'block';
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

                    layers.push(imageWrapper);
                    imageWrapper.dataset.name = '画像';
                    activateLayer(imageWrapper);
                };
            };
            reader.readAsDataURL(file);
        }
    });

    // --- 3. テキストの追加 ---
    addTextButton.addEventListener('click', () => {
        const textLayer = document.createElement('div');
        textLayer.classList.add('layer', 'text-layer');
        textLayer.setAttribute('contenteditable', 'true');
        textLayer.textContent = 'テキストを入力';
        textLayer.style.left = '50%';
        textLayer.style.top = '50%';
        textLayer.style.transform = 'translate(-50%, -50%)'; // 中央に配置

        // リサイズハンドルをテキストレイヤーに追加
        const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        handles.forEach(className => {
            const handle = document.createElement('div');
            handle.classList.add('resize-handle', className);
            textLayer.appendChild(handle);
        });

        canvasContainer.appendChild(textLayer);
        layers.push(textLayer);
        textLayer.dataset.name = `テキスト ${layers.filter(l => l.classList.contains('text-layer')).length}`;
        activateLayer(textLayer);
        textLayer.focus();
    });

    // --- 4. ドラッグ、リサイズ、アクティブ化のイベント管理 ---
    let isDragging = false;
    let isResizing = false;
    let resizeHandle = null;
    let initialX, initialY, initialWidth, initialHeight;

    canvasContainer.addEventListener('mousedown', (e) => {
        const targetLayer = e.target.closest('.layer');
        if (!targetLayer) {
            if (activeLayer) {
                activeLayer.classList.remove('active');
                activeLayer = null;
                updateSnapGuides();
                updateLayerList();
            }
            return;
        }

        activateLayer(targetLayer);

        if (e.target.classList.contains('resize-handle')) {
            isResizing = true;
            resizeHandle = e.target;
            initialWidth = targetLayer.offsetWidth;
            initialHeight = targetLayer.offsetHeight;
            initialX = e.clientX;
            initialY = e.clientY;
            e.preventDefault(); // ドラッグが開始しないように
            return;
        }
        
        isDragging = true;
        initialX = e.clientX - targetLayer.offsetLeft;
        initialY = e.clientY - targetLayer.offsetTop;
        targetLayer.style.cursor = 'grabbing';
    });

    canvasContainer.addEventListener('mousemove', (e) => {
        if (isResizing && activeLayer) {
            const dx = e.clientX - initialX;
            const dy = e.clientY - initialY;
            let newWidth = initialWidth;
            let newHeight = initialHeight;

            if (resizeHandle.classList.contains('top-left')) {
                newWidth = initialWidth - dx;
                newHeight = initialHeight - dy;
                activeLayer.style.left = `${activeLayer.offsetLeft + dx}px`;
                activeLayer.style.top = `${activeLayer.offsetTop + dy}px`;
            } else if (resizeHandle.classList.contains('top-right')) {
                newWidth = initialWidth + dx;
                newHeight = initialHeight - dy;
                activeLayer.style.top = `${activeLayer.offsetTop + dy}px`;
            } else if (resizeHandle.classList.contains('bottom-left')) {
                newWidth = initialWidth - dx;
                newHeight = initialHeight + dy;
                activeLayer.style.left = `${activeLayer.offsetLeft + dx}px`;
            } else if (resizeHandle.classList.contains('bottom-right')) {
                newWidth = initialWidth + dx;
                newHeight = initialHeight + dy;
            }

            // 最小サイズを設定
            if (newWidth > 50 && newHeight > 50) {
                activeLayer.style.width = `${newWidth}px`;
                activeLayer.style.height = `${newHeight}px`;
            }
            updateSnapGuides();
            return;
        }

        if (!isDragging || !activeLayer) return;
        
        const newX = e.clientX - initialX;
        const newY = e.clientY - initialY;
        
        activeLayer.style.left = `${newX}px`;
        activeLayer.style.top = `${newY}px`;
        updateSnapGuides();
    });

    canvasContainer.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        if (activeLayer) {
            activeLayer.style.cursor = 'grab';
        }
    });

    // --- 5. スナップガイドの更新 ---
    const updateSnapGuides = () => {
        if (!activeLayer || !activeLayer.classList.contains('active')) {
            snapGuides.style.display = 'none';
            return;
        }
        
        const layerRect = activeLayer.getBoundingClientRect();
        const containerRect = canvasContainer.getBoundingClientRect();
        
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
    
    window.addEventListener('resize', updateSnapGuides);
});
