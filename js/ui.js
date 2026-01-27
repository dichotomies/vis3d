// ============== UI Module ==============

// UI state variables
export let currentSelected = [];
export let selectedPairs = [];
window.selectedImages = currentSelected; // For compatibility, but will change to pairs later
window.selectedPairs = selectedPairs; // Make it globally accessible
export let maxDetectFeatures = 500;
export let maxDisplayFeatures = 500;
let currentFeaturePairIndex = 0;

export let matches = [];
export let inliers = [];
export let rotationMatrix = null;
export let translationVector = null;
export let intrinsicsMatrix = null;
export let poseSummary = '';
export let debugOutput = '';
export let triangulatedPoints = [];
export let triangulationStats = {};
export let cameraStats = {};
export let reprojectionErrors = [];
export let gtPoints = [];
export let gtPointCount = 0;
export let showGTPoints = false;

// Screen management functions
export async function showImageSelectionScreen() {
    document.getElementById('image-selection-screen').classList.remove('hidden');

    try {
        const apiUrl = window.location.protocol === 'file:' ? 'http://localhost:8000/api/images' : '/api/images';
        const response = await fetch(apiUrl);
        const data = await response.json();
        const availableImages = data.images;

        const grid = document.getElementById('image-grid');
        grid.innerHTML = '';

        availableImages.forEach((img, index) => {
            const baseUrl = window.location.protocol === 'file:' ? 'http://localhost:8000' : window.location.origin;
            const absolutePath = baseUrl + img.path;
            const card = document.createElement('div');
            card.className = 'image-card-wrapper';
            card.innerHTML = `
                <div class="image-card" data-index="${index}" data-name="${img.name}">
                    <img src="${absolutePath}" alt="${img.name}">
                    <div class="image-name">${img.name}</div>
                    <div class="selection-badge"></div>
                </div>
            `;
            grid.appendChild(card);

            const imageCard = card.querySelector('.image-card');
            imageCard.addEventListener('click', (event) => {
                console.log('Image card clicked, index:', index, 'name:', img.name);
                toggleImageSelection(index, img.name, imageCard, availableImages);
            });
        });
    } catch (error) {
        console.error('Failed to load images:', error);
    }

    // Reset state
    currentSelected.length = 0;
    selectedPairs.length = 0;
    updateSelectionStatus();
}

// Toggle image selection
function toggleImageSelection(index, name, cardElement, availableImages) {
    console.log('toggleImageSelection called with index:', index, 'name:', name, 'current length:', currentSelected.length);
    const existingIndex = currentSelected.findIndex(img => img.index === index);

    if (existingIndex !== -1) {
        // Deselect
        console.log('Deselecting image at index', index);
        currentSelected.splice(existingIndex, 1);
        cardElement.classList.remove('selected');
    } else if (currentSelected.length < 2) {
        // Select
        console.log('Selecting image at index', index);
        const baseUrl = window.location.protocol === 'file:' ? 'http://localhost:8000' : window.location.origin;
        const absolutePath = baseUrl + availableImages[index].path;
        currentSelected.push({ index, name, path: absolutePath });
        cardElement.classList.add('selected');
    } else {
        console.log('Cannot select more than 2 images');
    }

    updateSelectionStatus();
}

// Update selection status display
function updateSelectionStatus() {
    console.log('updateSelectionStatus called, currentSelected.length:', currentSelected.length);
    document.getElementById('selected-count').textContent = currentSelected.length;

    const namesSpan = document.getElementById('selected-names');
    if (currentSelected.length > 0) {
        namesSpan.textContent = ` (${currentSelected.map(img => img.name).join(', ')})`;
    } else {
        namesSpan.textContent = '';
    }

    // Update selection badges
    document.querySelectorAll('.image-card').forEach(card => {
        const badge = card.querySelector('.selection-badge');
        const cardIndex = parseInt(card.dataset.index);
        const selOrder = currentSelected.findIndex(img => img.index === cardIndex);
        if (selOrder !== -1) {
            badge.textContent = selOrder + 1;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });

    // Enable/disable add pair button
    const addPairDisabled = currentSelected.length !== 2;
    console.log('addPairDisabled:', addPairDisabled);
    const btn = document.getElementById('btn-add-pair');
    console.log('btn element:', btn);
    if (addPairDisabled) {
        btn.setAttribute('disabled', 'true');
    } else {
        btn.removeAttribute('disabled');
    }

    // Update debug panel
    const debugCount = document.getElementById('debug-images-count');
    console.log('debug-images-count element:', debugCount);
    if (debugCount) {
        debugCount.textContent = currentSelected.length;
    }
    const debugState = document.getElementById('debug-button-state');
    if (debugState) {
        debugState.textContent = addPairDisabled ? 'Inactive' : 'Active';
    }
    const debugReq = document.getElementById('debug-requirement');
    if (debugReq) {
        const requirementText = currentSelected.length === 0 ? 'Need 2 images' :
                               currentSelected.length === 1 ? 'Need 1 more image' :
                               'Ready to add pair';
        debugReq.textContent = requirementText;
    }

    // Enable/disable detect features button (enabled if at least one pair)
    const detectBtn = document.getElementById('btn-detect-features');
    if (selectedPairs.length === 0) {
        detectBtn.setAttribute('disabled', 'true');
    } else {
        detectBtn.removeAttribute('disabled');
    }

    // Update selected pairs list
    updateSelectedPairsDisplay();
}

// Update selected pairs display
function updateSelectedPairsDisplay() {
    const list = document.getElementById('selected-pairs-list');
    const noPairs = list.querySelector('.no-pairs');

    if (selectedPairs.length === 0) {
        list.innerHTML = '<p class="no-pairs">No pairs selected yet.</p>';
        return;
    }

    if (noPairs) noPairs.remove();

    list.innerHTML = '';
    selectedPairs.forEach((pair, index) => {
        const pairItem = document.createElement('div');
        pairItem.className = 'pair-item';
        pairItem.innerHTML = `
            <div class="pair-info">
                Pair ${index + 1}: <strong>${pair[0].name}</strong> & <strong>${pair[1].name}</strong>
            </div>
            <button class="pair-remove" data-index="${index}">Remove</button>
        `;
        list.appendChild(pairItem);
    });

    // Add event listeners to remove buttons
    document.querySelectorAll('.pair-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removePair(index);
        });
    });
}

// Update feature pairs display (selectable)
function updateFeaturePairsDisplay(selectedIndex) {
    const list = document.getElementById('feature-selected-pairs-list');
    const noPairs = list.querySelector('.no-pairs');

    if (selectedPairs.length === 0) {
        list.innerHTML = '<p class="no-pairs">No pairs selected yet.</p>';
        return;
    }

    if (noPairs) noPairs.remove();

    list.innerHTML = '';
    selectedPairs.forEach((pair, index) => {
        const pairItem = document.createElement('div');
        pairItem.className = `pair-item ${index === selectedIndex ? 'selected' : ''}`;
        pairItem.dataset.index = index;
        pairItem.innerHTML = `
            <div class="pair-info">
                Pair ${index + 1}: <strong>${pair[0].name}</strong> & <strong>${pair[1].name}</strong>
            </div>
        `;
        list.appendChild(pairItem);

        // Make the item clickable
        pairItem.addEventListener('click', () => {
            selectFeaturePair(index);
        });
    });
}

// Add current selected images as a pair
function addPair() {
    if (currentSelected.length === 2) {
        selectedPairs.push([...currentSelected]);
        currentSelected.length = 0; // Clear current selection
        updateSelectionStatus();
    }
}

// Remove a pair
function removePair(index) {
    selectedPairs.splice(index, 1);
    updateSelectionStatus();
}

// Update debug output
export function updateDebugOutput(output) {
    debugOutput = output || 'No debug info yet.';
    document.getElementById('debug-output').innerHTML = debugOutput;
}

// Select a pair for feature detection
function selectFeaturePair(index) {
    currentFeaturePairIndex = index;
    updateFeaturePairsDisplay(currentFeaturePairIndex);

    const pairToUse = selectedPairs[index];
    window.selectedImages = pairToUse; // Set globally for compatibility

    // Update image names in headers
    document.getElementById('feature-img1-name').textContent = pairToUse[0].name;
    document.getElementById('feature-img2-name').textContent = pairToUse[1].name;
    document.getElementById('feature-stats').textContent = 'Detecting features...';

    // Reset sliders
    document.getElementById('max-detect-slider').value = maxDetectFeatures;
    document.getElementById('max-detect-value').textContent = maxDetectFeatures;
    document.getElementById('max-display-slider').value = maxDisplayFeatures;
    document.getElementById('max-display-value').textContent = maxDisplayFeatures;

    // Call the SfM function from global scope
    if (window.detectAndDisplayFeatures) {
        window.detectAndDisplayFeatures();
    }
}

// Screen management functions (SfM screens)
export function showFeatureDetectionScreen() {
    document.getElementById('image-selection-screen').classList.add('hidden');
    document.getElementById('feature-detection-screen').classList.remove('hidden');

    // Set default to first pair
    currentFeaturePairIndex = 0;

    // Update the pairs display
    updateFeaturePairsDisplay(currentFeaturePairIndex);

    // Initial selection
    selectFeaturePair(0);
}

export function showFeatureMatchingScreen() {
    document.getElementById('feature-detection-screen').classList.add('hidden');
    document.getElementById('feature-matching-screen').classList.remove('hidden');

    // Call the SfM function from global scope
    if (window.computeAndDisplayMatches) {
        window.computeAndDisplayMatches();
    }
}

export function showPoseEstimationScreen() {
    document.getElementById('feature-matching-screen').classList.add('hidden');
    document.getElementById('pose-estimation-screen').classList.remove('hidden');

    // Call the SfM function from global scope
    if (window.estimatePose) {
        window.estimatePose();
    }
}

export function showTriangulationScreen() {
    document.getElementById('pose-estimation-screen').classList.add('hidden');
    document.getElementById('triangulation-screen').classList.remove('hidden');

    // Call the SfM function from global scope
    if (window.triangulatePoints) {
        window.triangulatePoints();
    }
}

// Initialize UI event listeners (basic ones, SfM ones are in index.html)
export function initUIEvents() {
    // Welcome screen buttons
    document.getElementById('btn-load-reconstruction').addEventListener('click', () => {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('loading').classList.remove('hidden');
        // loadData() will be called from main
    });

    document.getElementById('btn-create-sfm').addEventListener('click', () => {
        document.getElementById('welcome-screen').classList.add('hidden');
        showImageSelectionScreen();
    });

    // Image selection screen buttons
    document.getElementById('btn-back-to-welcome').addEventListener('click', () => {
        document.getElementById('image-selection-screen').classList.add('hidden');
        document.getElementById('welcome-screen').classList.remove('hidden');
        currentSelected.length = 0;
        selectedPairs.length = 0;
        updateSelectionStatus();
    });
    
    document.getElementById('btn-add-pair').addEventListener('click', () => {
        addPair();
    });

    // SfM screen buttons
    document.getElementById('btn-detect-features').addEventListener('click', () => {
        if (selectedPairs.length > 0) {
            showFeatureDetectionScreen();
        }
    });

    document.getElementById('btn-match-features').addEventListener('click', () => {
        showFeatureMatchingScreen();
    });

    document.getElementById('btn-estimate-pose').addEventListener('click', () => {
        showPoseEstimationScreen();
    });

    document.getElementById('btn-triangulate').addEventListener('click', () => {
        showTriangulationScreen();
    });

    // Back buttons
    document.getElementById('btn-back-to-images').addEventListener('click', () => {
        document.getElementById('feature-detection-screen').classList.add('hidden');
        document.getElementById('image-selection-screen').classList.remove('hidden');
        // Clear detected features
        loadedImages.img1 = null;
        loadedImages.img2 = null;
        // Reset keypoints arrays if they exist
        if (window.detectedFeatures) {
            window.detectedFeatures.image1.length = 0;
            window.detectedFeatures.image2.length = 0;
        }
    });

    document.getElementById('btn-back-to-features').addEventListener('click', () => {
        document.getElementById('feature-matching-screen').classList.add('hidden');
        document.getElementById('feature-detection-screen').classList.remove('hidden');
    });

    document.getElementById('btn-back-to-matching').addEventListener('click', () => {
        document.getElementById('pose-estimation-screen').classList.add('hidden');
        document.getElementById('feature-matching-screen').classList.remove('hidden');
    });

    document.getElementById('btn-back-to-pose').addEventListener('click', () => {
        document.getElementById('triangulation-screen').classList.add('hidden');
        document.getElementById('pose-estimation-screen').classList.remove('hidden');
    });

    document.getElementById('btn-view-3d').addEventListener('click', () => {
        document.getElementById('triangulation-screen').classList.add('hidden');
        // 3D viewer is shown
    });

    document.getElementById('btn-back-to-triangulation').addEventListener('click', () => {
        // Hide 3D viewer and show triangulation screen
        showTriangulationScreen();
    });
}