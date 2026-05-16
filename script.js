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
        const allCharacters = ref([]); // Global ordered list of characters
        const contextMenu = ref({ visible: false, x: 0, y: 0, targetId: null });
        const tierContainer = ref(null);

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
            e.target.value = ''; // Reset input
        };

        const processFiles = (files) => {
            const newChars = [];
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
                    syncPool();
                };
                reader.readAsDataURL(file);
            }
        };

        const syncPool = () => {
            pool.value = allCharacters.value.filter(c => c.tierId === 'pool');
        };

        const resetAll = () => {
            allCharacters.value.forEach(char => char.tierId = 'pool');
            syncPool();
        };

        const saveScreenshot = () => {
            html2canvas(tierContainer.value, {
                backgroundColor: '#1a1a1a',
                useCORS: true,
                scale: 2,
                logging: false
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
            syncPool();
            contextMenu.value.visible = false;
        };

        const initSortables = () => {
            // 1. Tiers Sorting
            Sortable.create(tierContainer.value, {
                animation: 200,
                draggable: '.tier-row',
                handle: '.tier-label', // Only drag by label to avoid conflict with char drag
                ghostClass: 'sortable-ghost',
                onEnd: (evt) => {
                    const items = Array.from(tierContainer.value.querySelectorAll('.tier-row'));
                    const newTiers = items.map(el => {
                        const id = el.getAttribute('data-id');
                        return tiers.value.find(t => t.id === id);
                    });
                    tiers.value = newTiers;
                }
            });

            // 2. Characters Sorting
            const zones = document.querySelectorAll('.drop-zone');
            zones.forEach(zone => {
                Sortable.create(zone, {
                    group: 'characters',
                    animation: 200,
                    fallbackOnTouch: true,
                    swapThreshold: 0.2,
                    ghostClass: 'sortable-ghost',
                    dragClass: 'sortable-drag',
                    forceFallback: true, // Increases smoothness and reliability on mobile
                    onEnd: (evt) => {
                        const charId = evt.item.getAttribute('data-char-id');
                        const newTierId = evt.to.getAttribute('data-tier-id');
                        
                        const char = allCharacters.value.find(c => c.id === charId);
                        if (char) {
                            char.tierId = newTierId;
                        }

                        // CRITICAL: Sync the global allCharacters array order to match DOM order
                        // This allows inserting between images and prevents "snapping back"
                        const allZones = document.querySelectorAll('.drop-zone');
                        const newOrderedList = [];
                        
                        allZones.forEach(z => {
                            const items = z.querySelectorAll('.character-item');
                            items.forEach(item => {
                                const id = item.getAttribute('data-char-id');
                                const found = allCharacters.value.find(c => c.id === id);
                                if (found) newOrderedList.push(found);
                            });
                        });

                        allCharacters.value = newOrderedList;
                        syncPool();
                    }
                });
            });
        };

        onMounted(() => {
            initSortables();

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
                            syncPool();
                        };
                        reader.readAsDataURL(blob);
                    }
                }
            });

            window.addEventListener('dragover', (e) => e.preventDefault());
            window.addEventListener('drop', (e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files.length > 0) processFiles(files);
            });

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