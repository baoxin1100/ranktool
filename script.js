document.addEventListener('DOMContentLoaded', function() {
    const defaultTiers = [
        { name: '夯', color: '#ff7f7f' },
        { name: '顶级', color: '#ffbf7f' },
        { name: '人上人', color: '#ffff7f' },
        { name: 'NPC', color: '#7fff7f' },
        { name: '拉完了', color: '#7f7fff' },
    ];

    const tierContainer = document.getElementById('tier-container');
    const characterPool = document.getElementById('character-pool');
    const fileUpload = document.getElementById('file-upload');
    const addTierBtn = document.getElementById('add-tier-btn');
    const resetBtn = document.getElementById('reset-btn');
    const sizeSelector = document.getElementById('size-selector');

    // 初始化卡片池的 Sortable
    const poolSortable = new Sortable(characterPool, {
        group: 'characters',
        animation: 150,
        ghostClass: 'sortable-ghost',
        forceFallback: true
    });

    // 初始化排名栏位的 Sortable (允许行之间排序)
    const rowsSortable = new Sortable(tierContainer, {
        animation: 150,
        handle: '.tier-label', // 只有点击标签才能拖动整行
        ghostClass: 'sortable-tier-ghost',
        forceFallback: true
    });

    sizeSelector.addEventListener('change', function() {
        const selectedSize = this.value;
        document.querySelectorAll('.character-item').forEach(item => {
            item.classList.remove('size-small', 'size-default', 'size-medium', 'size-large');
            item.classList.add(`size-${selectedSize}`);
        });
    });

    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.display = 'none';
    document.body.appendChild(contextMenu);

    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    defaultTiers.forEach(tier => createTierRow(tier.name, tier.color));
    updateTiersColors();

    function updateTiersColors() {
        const rows = tierContainer.querySelectorAll('.tier-row');
        const total = rows.length;
        rows.forEach((row, index) => {
            const label = row.querySelector('.tier-label');
            const hue = index * (240 / Math.max(1, total - 1));
            label.style.backgroundColor = `hsl(${hue}, 80%, 70%)`;
        });
    }

    function createTierRow(name, color) {
        const row = document.createElement('div');
        row.className = 'tier-row';
        
        const label = document.createElement('div');
        label.className = 'tier-label';
        label.textContent = name;
        if (color) label.style.backgroundColor = color;
        label.contentEditable = true; 
        
        const dropZone = document.createElement('div');
        dropZone.className = 'tier-drop-zone drop-zone';
        
        // 为每个排名栏位初始化 Sortable
        new Sortable(dropZone, {
            group: 'characters',
            animation: 150,
            ghostClass: 'sortable-ghost',
            forceFallback: true,
            onAdd: function(evt) {
                // 可以在这里添加元素进入时的逻辑
            }
        });
        
        row.appendChild(label);
        row.appendChild(dropZone);

        row.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.pageX, e.pageY, () => {
                const items = dropZone.querySelectorAll('.character-item');
                items.forEach(item => characterPool.appendChild(item));
                row.remove();
                updateTiersColors();
            });
        });

        tierContainer.appendChild(row);
    }

    addTierBtn.addEventListener('click', () => {
        createTierRow('新标签', null);
        updateTiersColors();
    });

    fileUpload.addEventListener('change', function(e) {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;
            const reader = new FileReader();
            reader.onload = (event) => createCharacterItem(event.target.result);
            reader.readAsDataURL(file);
        }
        this.value = '';
    });

    function createCharacterItem(src) {
        const container = document.createElement('div');
        const selectedSize = document.getElementById('size-selector').value;
        container.className = `character-item size-${selectedSize}`;
        
        const img = document.createElement('img');
        img.src = src;
        img.className = 'character-img';
        img.draggable = false;
        
        container.appendChild(img);

        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e.pageX, e.pageY, () => {
                container.remove();
            });
        });
        
        characterPool.appendChild(container);
    }

    function showContextMenu(x, y, onDelete) {
        contextMenu.innerHTML = '';
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.textContent = '删除';
        item.onclick = () => {
            onDelete();
            contextMenu.style.display = 'none';
        };
        contextMenu.appendChild(item);
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.style.display = 'block';
    }

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    });

    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => createCharacterItem(event.target.result);
                reader.readAsDataURL(blob);
            }
        }
    });

    function handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;
            const reader = new FileReader();
            reader.onload = (event) => createCharacterItem(event.target.result);
            reader.readAsDataURL(file);
        }
    }

    resetBtn.addEventListener('click', () => {
        document.querySelectorAll('.character-item').forEach(item => characterPool.appendChild(item));
    });

    document.getElementById('save-btn').addEventListener('click', () => {
        const tierContainer = document.getElementById('tier-container');
        
        html2canvas(tierContainer, {
            backgroundColor: '#1a1a1a',
            useCORS: true,
            scale: 2
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = '从夯到拉排名.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            console.error('截图失败:', err);
            alert('截图失败，请检查浏览器权限或尝试刷新页面。');
        });
    });
});