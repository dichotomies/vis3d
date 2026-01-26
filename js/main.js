// ============== Main Entry Point ==============

import { mat4, sub, dot, cross, normalize, length } from './utils.js';
import { initUIEvents } from './ui.js';

// Canvas and WebGL setup
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
    document.getElementById('loading').innerHTML = '<p style="color:#f44">WebGL not supported</p>';
    throw new Error('WebGL not supported');
}

// Global state
let pointProgram, lineProgram, textureProgram;
let pointBuffer, colorBuffer, cameraBuffer;
let pointCount = 0, cameraVertexCount = 0;
let center = [0, 0, 0];
let distance = 5;
let rotationX = 0.3, rotationY = 0;
let pointSize = 3;
let showCameras = true;
let autoRotate = false;  // Default: off
let freeRotation = true; // Default: on
let cameraSize = 1.0;    // Camera size multiplier

// For trackball rotation (free rotation mode)
let rotationMatrix = mat4.create();

// Camera position for WASD navigation
let cameraPos = [0, 0, 0];
let moveSpeed = 0.15;  // Default slower speed

// Mouse state
let isDragging = false;
let lastMouse = [0, 0];

// Keyboard state
const keys = { w: false, a: false, s: false, d: false };

// Camera image data
let cameraImages = [];  // Array of {texture, position, direction, right, up, vertices, texCoords}
let baseSceneScale = 1; // Will be set based on point cloud size
let cameraIntrinsics = {}; // Camera intrinsics from COLMAP
let selectedCamera = null; // Currently selected camera for details view

// Camera model names
const CAMERA_MODELS = {
    0: 'SIMPLE_PINHOLE', 1: 'PINHOLE', 2: 'SIMPLE_RADIAL', 3: 'RADIAL',
    4: 'OPENCV', 5: 'OPENCV_FISHEYE', 6: 'FULL_OPENCV', 7: 'FOV',
    8: 'SIMPLE_RADIAL_FISHEYE', 9: 'RADIAL_FISHEYE', 10: 'THIN_PRISM_FISHEYE'
};

// SfM state
let selectedImages = [];
let availableImages = [];
let isSfMMode = false;
let detectedFeatures = { image1: [], image2: [] };
let featureDescriptors = { image1: { descriptors: [], keypoints: [] }, image2: { descriptors: [], keypoints: [] } };

// Export globals for other modules
export {
    canvas, gl,
    pointProgram, lineProgram, textureProgram,
    pointBuffer, colorBuffer, cameraBuffer,
    pointCount, cameraVertexCount,
    center, distance, rotationX, rotationY, pointSize,
    showCameras, autoRotate, freeRotation, cameraSize,
    rotationMatrix, cameraPos, moveSpeed,
    isDragging, lastMouse, keys,
    cameraImages, baseSceneScale, cameraIntrinsics, selectedCamera,
    CAMERA_MODELS,
    selectedImages, availableImages, isSfMMode,
    detectedFeatures, featureDescriptors
};