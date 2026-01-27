// ============== Main Entry Point ==============

import { mat4 } from './utils.js';
import { initUIEvents } from './ui.js';
import { renderState, sfmState, canvas, gl } from './state.js';

// Canvas and WebGL setup
canvas = document.getElementById('canvas');
gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
    document.getElementById('loading').innerHTML = '<p style="color:#f44">WebGL not supported</p>';
    throw new Error('WebGL not supported');
}

// Initialize rotation matrix
renderState.rotationMatrix = mat4.create();

// Re-export from state for backward compatibility
export {
    canvas, gl,
    ...renderState,
    ...sfmState
};