/* ベーススタイル */
body {
    margin: 0;
    font-family: Arial, sans-serif;
    background-color: #f0f2f5;
    color: #333;
}

#app {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

header {
    background-color: #ffffff;
    padding: 10px 20px;
    border-bottom: 1px solid #ddd;
    display: flex;
    align-items: center;
    gap: 20px;
}

#editorContainer {
    display: flex;
    flex-grow: 1;
    background-color: #f8f9fa;
}

#canvasContainer {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    position: relative;
    background-color: #e9ecef;
    border: 1px dashed #ccc;
    margin: 20px;
}

#sidebar {
    width: 250px;
    background-color: #ffffff;
    border-left: 1px solid #ddd;
    padding: 20px;
    box-shadow: -2px 0 5px rgba(0,0,0,0.05);
}

/* 画像とハンドルをラップするコンテナ */
#imageWrapper {
    position: absolute;
    cursor: grab;
    border: 1px solid blue; /* 選択時の枠線 */
}

#uploadedImage {
    display: block;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

/* リサイズハンドル */
.resize-handle {
    position: absolute;
    width: 12px;
    height: 12px;
    background: #007bff;
    border: 1px solid #fff;
    border-radius: 50%;
    z-index: 200;
}

.top-left { top: -6px; left: -6px; cursor: nwse-resize; }
.top-right { top: -6px; right: -6px; cursor: nesw-resize; }
.bottom-left { bottom: -6px; left: -6px; cursor: nesw-resize; }
.bottom-right { bottom: -6px; right: -6px; cursor: nwse-resize; }

/* スナップガイド */
#snapGuides {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.snap-line {
    background-color: rgba(255, 0, 0, 0.5);
    position: absolute;
    z-index: 1000;
}

.snap-line.horizontal {
    width: 100%;
    height: 1px;
}

.snap-line.vertical {
    width: 1px;
    height: 100%;
}
