const { createApp, ref, onMounted, nextTick } = Vue;

createApp({
    setup() {
        const selectedSize = ref('default');
        const tiers = ref([
            { id: 't1', name: '夯', color: '#ff7f7f' },
            { id: 't2', name: '顶级', color: '#ffbf7f' },
            { id: 't3', name: '人上人', color: '#ffff7f' },
            { id: 't4', name: 'NPC', color: '#7fff7f' },
            { id: 't5', name: '拉完了', color: '#7f7fff' },
        ]);
        const pool = ref([]);
        const allCharacters = ref([]); // Global list of characters with their current location
        const contextMenu = ref({ visible: false, x: 0, y: 0, targetId: null });
        const tierContainer = ref(null);

        // Helper to get characters in a specific tier
        const getCharactersInTier = (tierId) => {
            return allCharacters.value.filter(char => char.tierId === tierId);
        };

        const addTier = () => {
            const id = 't' + Date.now();
            tiers.value.push({ id, name: '新标签', color: null });
            nextTick(() => initSortables());
        };

        const updateTierName = (index, event) => {
            tiers.value[index].name = event.target.innerText;
        };

        const handleFileUpload = (e) => {
            const files = e.target.files;
            processFiles(files);
        };

        const processFiles = (files) => {
            for (let file of files) {
                if (!file.type.startsWith('image/')) continue;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const char = {
                        id: 'c' + Date.now() + Math.random(),
                        src: event.target.result,
                        tierId: 'pool'
                    };
                    allCharacters.value.push(char);
                    pool.value.push(char);
                };
                reader.readAsDataURL(file);
            }
        };

        const resetAll = () => {
            allCharacters.value.forEach(char => char.tierId = 'pool');
            pool.value = [...allCharacters.value];
        };

        const saveScreenshot = () => {
            html2canvas(tierContainer.value, {
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
                alert('截图失败，请尝试刷新页面。');
            });
        };

        const showCharContextMenu = (e, charId) => {
            contextMenu.value = {
                visible: true,
                x: e.pageX,
                y: e.pageY,
                targetId: charId
            };
        };

        const confirmDelete = () => {
            const id = contextMenu.value.targetId;
            allCharacters.value = allCharacters.value.filter(c => c.id !== id);
            pool.value = pool.value.filter(c => c.id !== id);
            contextMenu.value.visible = false;
        };

        const initSortables = () => {
            // 1. Sortable for Tiers (Rows)
            Sortable.create(tierContainer.value, {
                animation: 150,
                draggable: '.tier-row',
                onEnd: (evt) => {
                    const items = Array.from(tierContainer.value.querySelectorAll('.tier-row'));
                    const newTiers = items.map(el => {
                        const id = el.getAttribute('data-id');
                        return tiers.value.find(t => t.id === id);
                    });
                    tiers.value = newTiers;
                }
            });

            // 2. Sortable for Characters in each Tier and Pool
            const zones = document.querySelectorAll('.drop-zone');
            zones.forEach(zone => {
                Sortable.create(zone, {
                    group: 'characters',
                    animation: 150,
                    fallbackOnTouch: true, // Important for mobile
                    swapThreshold: 0,
                    onEnd: (evt) => {
                        const charId = evt.item.getAttribute('data-char-id');
                        const newTierId = evt.to.getAttribute('data-tier-id');
                        
                        const char = allCharacters.value.find(c => c.id === charId);
                        if (char) {
                            char.tierId = newTierId;
                            // Sync pool array
                            pool.value = allCharacters.value.filter(c => c.tierId === 'pool');
                        }
                    }
                });
            });
        };

        onMounted(() => {
            initSortables();

            // Handle window-level paste
            document.addEventListener('paste', (e) => {
                const items = e.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const blob = items[i].getAsFile();
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const char = {
                                id: 'c' + Date.now() + Math.random(),
                                src: event.target.result,
                                tierId: 'pool'
                            };
                            allCharacters.value.push(char);
                            pool.value.push(char);
                        };
                        reader.readAsDataURL(blob);
                    }
                }
            });

            // Handle window-level drag and drop
            window.addEventListener('dragover', (e) => e.preventDefault());
            window.addEventListener('drop', (e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files.length > 0) processFiles(files);
            });

            // Close context menu on click
            document.addEventListener('click', () => {
                contextMenu.value.visible = false;
            });
        });

        return {
            selectedSize, tiers, pool, contextMenu, tierContainer,
            getCharactersInTier, addTier, updateTierName, handleFileUpload, 
            resetAll, saveScreenshot, showCharContextMenu, confirmDelete
        };
    }
}).mount('#app');