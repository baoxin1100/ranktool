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

    sizeSelector.addEventListener('change', function() {
        const selectedSize = this.value;
        document.querySelectorAll('.character-item').forEach(item => {
            // 移除所有可能的尺寸类
            item.classList.remove('size-small', 'size-default', 'size-medium', 'size-large');
            // 添加当前选中的尺寸类
            item.classList.add(`size-${selectedSize}`);
        });
    });

    // 创建右键菜单
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.display = 'none';
    document.body.appendChild(contextMenu);

    // 全局点击关闭右键菜单
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
        row.draggable = true; 
        
        const label = document.createElement('div');
        label.className = 'tier-label';
        label.textContent = name;
        if (color) label.style.backgroundColor = color;
        label.contentEditable = true; 
        
        const dropZone = document.createElement('div');
        dropZone.className = 'tier-drop-zone drop-zone';
        setupDropZone(dropZone);
        
        
        row.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('character-item')) return;
            row.classList.add('dragging-tier');
            e.dataTransfer.setData('text/plain', 'tier-row');
        });

        row.addEventListener('dragend', () => {
            row.classList.remove('dragging-tier');
            updateTiersColors();
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingTier = document.querySelector('.dragging-tier');
            if (!draggingTier || draggingTier === row) return;
            const rect = row.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            if (e.clientY < midpoint) {
                tierContainer.insertBefore(draggingTier, row);
            } else {
                tierContainer.insertBefore(draggingTier, row.nextSibling);
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
        container.draggable = true;
        
        const img = document.createElement('img');
        img.src = src;
        img.className = 'character-img';
        
        container.appendChild(img);

        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation(); // 阻止事件冒泡到 tier-row
            showContextMenu(e.pageX, e.pageY, () => {
                container.remove();
            });
        });
        
        container.addEventListener('dragstart', (e) => {
            container.classList.add('dragging');
            e.dataTransfer.setData('text/plain', ''); 
        });

        container.addEventListener('dragend', () => {
            container.classList.remove('dragging');
            
            // 核心逻辑：检查当前是否在任何 drop-zone 内部
            const isInsideDropZone = container.closest('.drop-zone');
            if (!isInsideDropZone) {
                characterPool.appendChild(container);
            }
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

    function setupDropZone(zone) {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = document.querySelector('.dragging');
            if (!draggingItem) return;

            zone.classList.add('drag-over');
            const afterElement = getDragAfterElement(zone, e.clientX, e.clientY);
            
            if (afterElement == null) {
                if (zone.lastElementChild !== draggingItem) {
                    zone.appendChild(draggingItem);
                }
            } else {
                if (afterElement !== draggingItem && afterElement.previousElementSibling !== draggingItem) {
                    zone.insertBefore(draggingItem, afterElement);
                }
            }
        });

        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
        });
    }

    function getDragAfterElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll('.character-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const centerX = box.left + box.width / 2;
            const centerY = box.top + box.height / 2;
            
            if (x < centerX && (x - centerX) > closest.offset) {
                if (Math.abs(y - centerY) < 60) {
                    return { element: child, offset: x - centerX };
                }
            }
            return closest;
        }, { element: null, offset: Number.NEGATIVE_INFINITY }).element;
    }

    setupDropZone(characterPool);

    resetBtn.addEventListener('click', () => {
        document.querySelectorAll('.character-item').forEach(item => characterPool.appendChild(item));
    });

    document.getElementById('save-btn').addEventListener('click', () => {
        const tierContainer = document.getElementById('tier-container');
        
        html2canvas(tierContainer, {
            backgroundColor: '#1a1a1a', // 保持与背景一致
            useCORS: true, // 允许跨域图片
            scale: 2 // 提高截图清晰度
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