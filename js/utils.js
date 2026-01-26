// ============== Math Utilities ==============

// Vector operations
export function sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
export function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
export function cross(a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
export function normalize(v) { const l = Math.sqrt(dot(v, v)); return l > 0 ? [v[0]/l, v[1]/l, v[2]/l] : [0,0,0]; }
export function length(v) { return Math.sqrt(dot(v, v)); }

// Matrix operations
export const mat4 = {
    create: () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),
    perspective: (fovy, aspect, near, far) => {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);
        return new Float32Array([
            f/aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far+near)*nf, -1,
            0, 0, 2*far*near*nf, 0
        ]);
    },
    lookAt: (eye, center, up) => {
        const z = normalize(sub(eye, center));
        const x = normalize(cross(up, z));
        const y = cross(z, x);
        return new Float32Array([
            x[0], y[0], z[0], 0,
            x[1], y[1], z[1], 0,
            x[2], y[2], z[2], 0,
            -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
        ]);
    },
    multiply: (a, b) => {
        const out = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                out[i*4+j] = a[j]*b[i*4] + a[4+j]*b[i*4+1] + a[8+j]*b[i*4+2] + a[12+j]*b[i*4+3];
            }
        }
        return out;
    },
    translate: (m, v) => {
        const out = new Float32Array(m);
        out[12] = m[0]*v[0] + m[4]*v[1] + m[8]*v[2] + m[12];
        out[13] = m[1]*v[0] + m[5]*v[1] + m[9]*v[2] + m[13];
        out[14] = m[2]*v[0] + m[6]*v[1] + m[10]*v[2] + m[14];
        return out;
    }
};