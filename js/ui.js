// ============== UI Module ==============

// UI state variables
export let selectedImages = [];
window.selectedImages = selectedImages; // Make it globally accessible
export let maxDetectFeatures = 500;
export let maxDisplayFeatures = 500;

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
        const response = await fetch('/api/images');
        const data = await response.json();
        const availableImages = data.images;

        const grid = document.getElementById('image-grid');
        grid.innerHTML = '';

        availableImages.forEach((img, index) => {
            const absolutePath = window.location.origin + '/' + img.path;
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

            card.querySelector('.image-card').addEventListener('click', () => {
                toggleImageSelection(index, img.name, card.querySelector('.image-card'), availableImages);
            });
        });
    } catch (error) {
        console.error('Failed to load images:', error);
    }
}

// Toggle image selection
function toggleImageSelection(index, name, cardElement, availableImages) {
    const existingIndex = selectedImages.findIndex(img => img.index === index);

    if (existingIndex !== -1) {
        // Deselect
        selectedImages.splice(existingIndex, 1);
        cardElement.classList.remove('selected');
    } else if (selectedImages.length < 2) {
        // Select
        const absolutePath = window.location.origin + '/' + availableImages[index].path;
        selectedImages.push({ index, name, path: absolutePath });
        cardElement.classList.add('selected');
    }

    updateSelectionStatus();
}

// Update selection status display
function updateSelectionStatus() {
    document.getElementById('selected-count').textContent = selectedImages.length;

    const namesSpan = document.getElementById('selected-names');
    if (selectedImages.length > 0) {
        namesSpan.textContent = ` (${selectedImages.map(img => img.name).join(', ')})`;
    } else {
        namesSpan.textContent = '';
    }

    // Update selection badges
    document.querySelectorAll('.image-card').forEach(card => {
        const badge = card.querySelector('.selection-badge');
        const cardIndex = parseInt(card.dataset.index);
        const selOrder = selectedImages.findIndex(img => img.index === cardIndex);
        if (selOrder !== -1) {
            badge.textContent = selOrder + 1;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });

    // Enable/disable detect features button
    document.getElementById('btn-detect-features').disabled = selectedImages.length !== 2;
}

// Update debug output
export function updateDebugOutput(output) {
    debugOutput = output || 'No debug info yet.';
    document.getElementById('debug-output').innerHTML = debugOutput;
}

// Screen management functions (SfM screens)
export function showFeatureDetectionScreen() {
    document.getElementById('image-selection-screen').classList.add('hidden');
    document.getElementById('feature-detection-screen').classList.remove('hidden');

    // Update image names in headers
    document.getElementById('feature-img1-name').textContent = selectedImages[0].name;
    document.getElementById('feature-img2-name').textContent = selectedImages[1].name;
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
        selectedImages.length = 0;
        updateSelectionStatus();
    });

    // SfM screen buttons
    document.getElementById('btn-detect-features').addEventListener('click', () => {
        if (selectedImages.length === 2) {
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