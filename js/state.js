// ============== Centralized State Module ==============

import { mat4 } from './utils.js';

// WebGL and Rendering State
export const renderState = {
    pointProgram: null,
    lineProgram: null,
    textureProgram: null,
    pointBuffer: null,
    colorBuffer: null,
    cameraBuffer: null,
    pointCount: 0,
    cameraVertexCount: 0,
    center: [0, 0, 0],
    distance: 5,
    rotationX: 0.3,
    rotationY: 0,
    pointSize: 3,
    showCameras: true,
    autoRotate: false,
    freeRotation: true,
    cameraSize: 1.0,
    rotationMatrix: null,
    cameraPos: [0, 0, 0],
    moveSpeed: 0.15,
    isDragging: false,
    lastMouse: [0, 0],
    keys: { w: false, a: false, s: false, d: false },
    cameraImages: [],
    baseSceneScale: 1,
    cameraIntrinsics: {},
    selectedCamera: null,
    CAMERA_MODELS: {
        0: 'SIMPLE_PINHOLE', 1: 'PINHOLE', 2: 'SIMPLE_RADIAL', 3: 'RADIAL',
        4: 'OPENCV', 5: 'OPENCV_FISHEYE', 6: 'FULL_OPENCV', 7: 'FOV',
        8: 'SIMPLE_RADIAL_FISHEYE', 9: 'RADIAL_FISHEYE', 10: 'THIN_PRISM_FISHEYE'
    }
};

// SfM State
export const sfmState = {
    selectedImages: [],
    availableImages: [],
    isSfMMode: false,
    detectedFeatures: { image1: [], image2: [] },
    featureDescriptors: { image1: { descriptors: [], keypoints: [] }, image2: { descriptors: [], keypoints: [] } },
    featureMatches: [],
    loadedImages: { img1: null, img2: null },
    maxDetectFeatures: 500,
    maxDisplayFeatures: 500,
    ratioThreshold: 0.75,
    maxMatchesDisplay: 100,
    ransacIterations: 1000,
    inlierThreshold: 3.0,
    estimatedPose: null,
    cameraIntrinsicsK: null,
    useIntrinsics: true,
    debugLog: [],
    maxReprojError: 4.0,
    minTriangleAngle: 2.0,
    triangulatedPoints: [],
    triangulatedPointsWithReproj: [],
    gtCameras: [],
    gtCameraBuffer: null,
    gtCameraVertexCount: 0,
    showGTCameras: false,
    sfmToGtTransform: null,
    gtPoints: [],
    gtPointBuffer: null,
    gtColorBuffer: null,
    gtPointCount: 0,
    showGTPoints: false
};

// UI State (imported from ui.js to centralize)
export const uiState = {
    currentSelected: [],
    selectedPairs: [],
    matches: [],
    inliers: [],
    rotationMatrix: null,
    translationVector: null,
    intrinsicsMatrix: null,
    poseSummary: '',
    debugOutput: '',
    triangulatedPoints: [],
    triangulationStats: {},
    cameraStats: {},
    reprojectionErrors: [],
    gtPoints: [],
    gtPointCount: 0,
    showGTPoints: false,
    currentFeaturePairIndex: 0
};

// Canvas and WebGL context (will be set in main)
export let canvas, gl;

// Initialize rotation matrix
renderState.rotationMatrix = mat4.create();

// For backward compatibility, expose some globals to window
// These will be removed in future refactoring
window.detectedFeatures = sfmState.detectedFeatures;
window.estimatedPose = sfmState.estimatedPose;
window.selectedImages = sfmState.selectedImages;
window.featureMatches = sfmState.featureMatches;
window.loadedImages = sfmState.loadedImages;