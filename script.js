document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const addTextButton = document.getElementById('addTextButton');
    const canvasContainer = document.getElementById('canvasContainer');
    const snapGuides = document.getElementById('snapGuides');
    const layerList = document.getElementById('layerList');

    let layers = [];
    let activeLayer = null;

    // --- 1. レイヤー管理とアクティブ化 ---
    const activateLayer = (layerElement) => {
        if (activeLayer) {
            activeLayer.classList.remove('active');
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
            layerList.prepend(li);
        });
    };

    // --- 2. 画像のアップロードとフレーム追加 ---
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const image = new Image();
                image.src = e.target.result;
                image.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const frameRatio = 1.2; // フレームの縦横比を調整
                    canvas.width = image.width * frameRatio;
                    canvas.height = image.height * frameRatio;
                    
                    // 白いフレームを描画
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // 中央に画像を描画
                    const imageX = (canvas.width - image.width) / 2;
                    const imageY = (canvas.height - image.height) / 2;
                    ctx.drawImage(image, imageX, imageY);
                    
                    const framedImage = document.createElement('img');
                    framedImage.src = canvas.toDataURL('image/jpeg');
                    framedImage.id = 'frameImage';
                    
                    const imageFrame = document.createElement('div');
                    imageFrame.classList.add('layer', 'image-frame');
                    imageFrame.appendChild(framedImage);
                    
                    const containerWidth = canvasContainer.offsetWidth;
                    const containerHeight = canvasContainer.offsetHeight;
                    const imgRatio = framedImage.naturalWidth / framedImage.naturalHeight;
                    const containerRatio = containerWidth / containerHeight;
                    let newWidth, newHeight;
                    if (imgRatio > containerRatio) {
                        newWidth = containerWidth * 0.8;
                        newHeight = newWidth / imgRatio;
                    } else {
                        newHeight = containerHeight * 0.8;
                        newWidth = newHeight * imgRatio;
                    }
                    imageFrame.style.width = `${newWidth}px`;
                    imageFrame.style.height = `${newHeight}px`;
                    imageFrame.style.left = `${(containerWidth - newWidth) / 2}px`;
                    imageFrame.style.top = `${(containerHeight - newHeight) / 2}px`;
                    
                    canvasContainer.appendChild(imageFrame);
                    layers.push(imageFrame);
                    imageFrame.dataset.name = '画像';
                    activateLayer(imageFrame);

                    // EXIF情報の読み取りとテキスト追加
                    EXIF.getData(image, function() {
                        const exifData = EXIF.getAllTags(this);
                        const textData = formatExifData(exifData);
                        addText(textData, imageFrame.offsetLeft, imageFrame.offsetTop + imageFrame.offsetHeight);
                    });
                };
            };
            reader.readAsDataURL(file);
        }
    });

    const formatExifData = (data) => {
        let text = '';
        if (data.Make && data.Model) {
            text += `カメラ: ${data.Make} ${data.Model}\n`;
        }
        if (data.FocalLength) {
            text += `焦点距離: ${data.FocalLength}mm\n`;
        }
        if (data.FNumber) {
            text += `絞り: f/${data.FNumber}\n`;
        }
        if (data.ISOSpeedRatings) {
            text += `ISO感度: ${data.ISOSpeedRatings}\n`;
        }
        if (data.ExposureTime) {
            text += `シャッタースピード: ${data.ExposureTime}s\n`;
        }
        return text.trim();
    };

    // --- 3. テキストの追加 ---
    const addText = (initialText = 'テキストを入力', x = 100, y = 100) => {
        const textLayer = document.createElement('div');
        textLayer.classList.add('layer', 'text-layer');
        textLayer.setAttribute('contenteditable', 'true');
        textLayer.textContent = initialText;
        textLayer.style.left = `${x}px`;
        textLayer.style.top = `${y}px`;
        
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
    };
    
    addTextButton.addEventListener('click', () => addText());

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
            e.preventDefault();
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
