import * as CG from './transforms.js';
import { Matrix, Vector } from "./matrix.js";

const LEFT =   32; // binary 100000
const RIGHT =  16; // binary 010000
const BOTTOM = 8;  // binary 001000
const TOP =    4;  // binary 000100
const FAR =    2;  // binary 000010
const NEAR =   1;  // binary 000001
const FLOAT_EPSILON = 0.000001;

class Renderer {
    // canvas:              object ({id: __, width: __, height: __})
    // scene:               object (...see description on Canvas)
    constructor(canvas, scene) {
        this.canvas = document.getElementById(canvas.id);
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.scene = this.processScene(scene);
        this.enable_animation = false;  // <-- disabled for easier debugging; enable for animation
        this.start_time = null;
        this.prev_time = null;
    }

    //
    updateTransforms(time, delta_time) {
        // TODO: update any transformations needed for animation
    }

    //
    rotateLeft() {
    // translate PRP to origin
    let matTranslate = new Matrix(4, 4);
    matTranslate.values = [[1, 0, 0, -this.scene.view.prp.x],
                           [0, 1, 0, -this.scene.view.prp.y],
                           [0, 0, 1, -this.scene.view.prp.z],
                           [0, 0, 0,                      1]];

    // rotate VRC such that (u,v,n) align with (x,y,z)
    let n = this.scene.view.prp.subtract(this.scene.view.srp);
    n.normalize();
    let u = this.scene.view.vup.cross(n);
    u.normalize();
    let v = n.cross(u);
    let matRotate = new Matrix(4, 4);
    matRotate.values = [[u.x, u.y, u.z, 0],
                        [v.x, v.y, v.z, 0],
                        [n.x, n.y, n.z, 0],
                        [  0,   0,   0, 1]];

    // rotation matrix around the v-axis with the PRP as the origin
    let matRotateV = new Matrix(4, 4);
    CG.mat4x4RotateY(matRotateV, 15*Math.PI/180);

    // go back to the original location
    let matRotate_inv = matRotate.inverse();
    let matTranslate_inv = matTranslate.inverse();

    // put all together
    let matRotateLeft = Matrix.multiply([matTranslate_inv, matRotate_inv, matRotateV, matRotate, matTranslate]);

    // cartesian srp -> homogeneous srp
    let homo_srp = CG.Vector4(this.scene.view.srp.x, this.scene.view.srp.y, this.scene.view.srp.z, 1);

    // rotate srp
    let rotate_srp = Matrix.multiply([matRotateLeft, homo_srp]);
    console.log(rotate_srp);
    
    // homogeneous srp -> cartesian srp
    this.scene.view.srp.x = rotate_srp.x / rotate_srp.w;
    this.scene.view.srp.y = rotate_srp.y / rotate_srp.w;
    this.scene.view.srp.z = rotate_srp.z / rotate_srp.w;
    console.log(this.scene.view.srp);

    this.draw();
    }
    
    //
    rotateRight() {
    // translate PRP to origin
    let matTranslate = new Matrix(4, 4);
    matTranslate.values = [[1, 0, 0, -this.scene.view.prp.x],
                           [0, 1, 0, -this.scene.view.prp.y],
                           [0, 0, 1, -this.scene.view.prp.z],
                           [0, 0, 0,                      1]];

    // rotate VRC such that (u,v,n) align with (x,y,z)
    let n = this.scene.view.prp.subtract(this.scene.view.srp);
    n.normalize();
    let u = this.scene.view.vup.cross(n);
    u.normalize();
    let v = n.cross(u);
    let matRotate = new Matrix(4, 4);
    matRotate.values = [[u.x, u.y, u.z, 0],
                        [v.x, v.y, v.z, 0],
                        [n.x, n.y, n.z, 0],
                        [  0,   0,   0, 1]];

    // rotation matrix around the v-axis with the PRP as the origin
    let matRotateV = new Matrix(4, 4);
    CG.mat4x4RotateY(matRotateV, -15*Math.PI/180);

    // go back to the original location
    let matRotate_inv = matRotate.inverse();
    let matTranslate_inv = matTranslate.inverse();

    // put all together
    let matRotateLeft = Matrix.multiply([matTranslate_inv, matRotate_inv, matRotateV, matRotate, matTranslate]);

    // cartesian srp -> homogeneous srp
    let homo_srp = CG.Vector4(this.scene.view.srp.x, this.scene.view.srp.y, this.scene.view.srp.z, 1);

    // rotate srp
    let rotate_srp = Matrix.multiply([matRotateLeft, homo_srp]);
    console.log(rotate_srp);
    
    // homogeneous srp -> cartesian srp
    this.scene.view.srp.x = rotate_srp.x / rotate_srp.w;
    this.scene.view.srp.y = rotate_srp.y / rotate_srp.w;
    this.scene.view.srp.z = rotate_srp.z / rotate_srp.w;
    console.log(this.scene.view.srp);

    this.draw();
    }
    
    //
    moveLeft() {
        let n = this.scene.view.prp.subtract(this.scene.view.srp);
        n.normalize();
        const u = this.scene.view.vup.cross(n);
        u.normalize();
        this.scene.view.prp = this.scene.view.prp.subtract(u);
        this.scene.view.srp = this.scene.view.srp.subtract(u);
        this.draw();
    }
    
    //
    moveRight() {
        let n = this.scene.view.prp.subtract(this.scene.view.srp);
        n.normalize();
        const u = this.scene.view.vup.cross(n);
        u.normalize();
        this.scene.view.prp = this.scene.view.prp.add(u);
        this.scene.view.srp = this.scene.view.srp.add(u);
        this.draw();
    }
    
    //
    moveBackward() {
        let n = this.scene.view.prp.subtract(this.scene.view.srp);
        n.normalize();
        this.scene.view.prp = this.scene.view.prp.add(n);
        this.scene.view.srp = this.scene.view.srp.add(n);
        this.draw();
    }
    
    //
    moveForward() {
        let n = this.scene.view.prp.subtract(this.scene.view.srp);
        n.normalize();
        this.scene.view.prp = this.scene.view.prp.subtract(n);
        this.scene.view.srp = this.scene.view.srp.subtract(n);
        this.draw();
    }

    //
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // TODO: implement drawing here!
        // For each model
        //   * For each vertex
        //     * transform endpoints to canonical view volume
        //   * For each line segment in each edge
        //     * clip in 3D
        //     * project to 2D
        //     * translate/scale to viewport (i.e. window)
        //     * draw line
        for (const model of this.scene.models) {
            const canonicalVertices = [];
            //console.log(model.vertices);
            //console.log(model);
            model.vertices.forEach((vertex, i) => {
                canonicalVertices[i] = Matrix.multiply([CG.mat4x4Perspective(this.scene.view.prp, this.scene.view.srp, this.scene.view.vup, this.scene.view.clip), vertex]);
            });
            //console.log(canonicalVertices);
            const z_min = -this.scene.view.clip[4]/this.scene.view.clip[5]; // TODO: define z_min
            for (const edge of model.edges) {
                for (let i = 0; i < edge.length - 1; i++) {
                    const v0 = canonicalVertices[edge[i]];
                    const v1 = canonicalVertices[edge[i+1]];
                    const line = {
                        pt0: CG.Vector4(v0.x, v0.y, v0.z, 1),
                        pt1: CG.Vector4(v1.x, v1.y, v1.z, 1)
                    };
                    //console.log(line);
                    const clippedLine = this.clipLinePerspective(line, z_min);

                    if (clippedLine != null) {
                        // project to 2D
                        let mper = CG.mat4x4MPer();
                        let pt0_ViewVolume = Matrix.multiply([mper, clippedLine.pt0]);
                        let pt1_ViewVolume = Matrix.multiply([mper, clippedLine.pt1]);

                        // translate/scale to viewport
                        let viewport = CG.mat4x4Viewport(this.canvas.width, this.canvas.height);
                        let pt0_viewport = Matrix.multiply([viewport, pt0_ViewVolume]);
                        let pt1_viewport = Matrix.multiply([viewport, pt1_ViewVolume]);
                        
                        // homogeneous coordinates -> cartesian coordinates
                        pt0_viewport.x = pt0_viewport.x / pt0_viewport.w;
                        pt0_viewport.y = pt0_viewport.y / pt0_viewport.w;
                        pt0_viewport.z = pt0_viewport.z / pt0_viewport.w;
                        pt1_viewport.x = pt1_viewport.x / pt1_viewport.w;
                        pt1_viewport.y = pt1_viewport.y / pt1_viewport.w;
                        pt1_viewport.z = pt1_viewport.z / pt1_viewport.w;
                        
                        // draw
                        this.drawLine(pt0_viewport.x, pt0_viewport.y, pt1_viewport.x, pt1_viewport.y);
                    }
                }
            }
        }
    }

    // Get outcode for a vertex
    // vertex:       Vector4 (transformed vertex in homogeneous coordinates)
    // z_min:        float (near clipping plane in canonical view volume)
    outcodePerspective(vertex, z_min) {
        let outcode = 0;
        if (vertex.x < (vertex.z - FLOAT_EPSILON)) {
            outcode += LEFT;
        }
        else if (vertex.x > (-vertex.z + FLOAT_EPSILON)) {
            outcode += RIGHT;
        }
        if (vertex.y < (vertex.z - FLOAT_EPSILON)) {
            outcode += BOTTOM;
        }
        else if (vertex.y > (-vertex.z + FLOAT_EPSILON)) {
            outcode += TOP;
        }
        if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
            outcode += FAR;
        }
        else if (vertex.z > (z_min + FLOAT_EPSILON)) {
            outcode += NEAR;
        }
        return outcode;
    }

    // Clip line - should either return a new line (with two endpoints inside view volume)
    //             or null (if line is completely outside view volume)
    // line:         object {pt0: Vector4, pt1: Vector4}
    // z_min:        float (near clipping plane in canonical view volume)
    clipLinePerspective(line, z_min) {
        let result = null;
        let p0 = CG.Vector3(line.pt0.x, line.pt0.y, line.pt0.z); 
        let p1 = CG.Vector3(line.pt1.x, line.pt1.y, line.pt1.z);
        let out0 = this.outcodePerspective(p0, z_min);
        let out1 = this.outcodePerspective(p1, z_min);
        
        // TODO: implement clipping here!
        if ((out0 | out1) == 0) {
            // Trivial accept
            return line;
        } else if ((out0 & out1) != 0) {
            // Trivial reject
            return null;
        } else {
            if (out0 != 0) {
                // Find intersection of p0 and edge
                result = { pt0: this.getEdgeIntersection(p0, p1, z_min), pt1: line.pt1 };
            } else {
                // Find intersection of p1 and edge
                result = { pt0: line.pt0, pt1: this.getEdgeIntersection(p1, p0, z_min) };
            }
            return this.clipLinePerspective(result, z_min);
        }
    }

    getEdgeIntersection(ptOut, ptIn, z_min) {
        let dx = ptOut.x - ptIn.x;
        let dy = ptOut.y - ptIn.y;
        let dz = ptOut.z - ptIn.z;
        let t;
        if (ptOut.x < (ptOut.z - FLOAT_EPSILON)) {
            // Left
            t = (-ptIn.x + ptIn.z) / (dx - dz);
        }
        else if (ptOut.x > (-ptOut.z + FLOAT_EPSILON)) {
            // Right
            t = (ptIn.x + ptIn.z) / (-dx - dz);
        }
        else if (ptOut.y < (ptOut.z - FLOAT_EPSILON)) {
            // Bottom
            t = (-ptIn.y + ptIn.z) / (dy - dz);
        }
        else if (ptOut.y > (-ptOut.z + FLOAT_EPSILON)) {
            // Top
            t = (ptIn.y + ptIn.z) / (-dy - dz);
        }
        else if (ptOut.z < (-1.0 - FLOAT_EPSILON)) {
            // Far
            t = (-ptIn.z - 1) / dz
        }
        else if (ptOut.z > (z_min + FLOAT_EPSILON)) {
            // Near
            t = (ptIn.z - z_min) / -dz
        }
        return CG.Vector4(ptIn.x + t * dx, ptIn.y + t * dy, ptIn.z + t * dz, 1);
    }

    //
    animate(timestamp) {
        // Get time and delta time for animation
        if (this.start_time === null) {
            this.start_time = timestamp;
            this.prev_time = timestamp;
        }
        let time = timestamp - this.start_time;
        let delta_time = timestamp - this.prev_time;

        // Update transforms for animation
        this.updateTransforms(time, delta_time);

        // Draw slide
        this.draw();

        // Invoke call for next frame in animation
        if (this.enable_animation) {
            window.requestAnimationFrame((ts) => {
                this.animate(ts);
            });
        }

        // Update previous time to current one for next calculation of delta time
        this.prev_time = timestamp;
    }

    //
    updateScene(scene) {
        this.scene = this.processScene(scene);
        if (!this.enable_animation) {
            this.draw();
        }
    }

    //
    processScene(scene) {
        let processed = {
            view: {
                prp: CG.Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]),
                srp: CG.Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]),
                vup: CG.Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]),
                clip: [...scene.view.clip]
            },
            models: []
        };

        for (let i = 0; i < scene.models.length; i++) {
            let model = { type: scene.models[i].type };
            if (model.type === 'generic') {
                model.vertices = [];
                model.edges = JSON.parse(JSON.stringify(scene.models[i].edges));
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    model.vertices.push(CG.Vector4(scene.models[i].vertices[j][0],
                                                   scene.models[i].vertices[j][1],
                                                   scene.models[i].vertices[j][2],
                                                   1));
                    if (scene.models[i].hasOwnProperty('animation')) {
                        model.animation = JSON.parse(JSON.stringify(scene.models[i].animation));
                    }
                }
            }
            /*
            else if (model.type === 'cube') {
                model.vertices = [];
                for (let i=0; i<8; i++) {
                    model.vertices[i].push(CG.Vector4());
                }

            }*/
            else {
                model.center = CG.Vector4(scene.models[i].center[0],
                                       scene.models[i].center[1],
                                       scene.models[i].center[2],
                                       1);
                for (let key in scene.models[i]) {
                    if (scene.models[i].hasOwnProperty(key) && key !== 'type' && key != 'center') {
                        model[key] = JSON.parse(JSON.stringify(scene.models[i][key]));
                    }
                }
            }

            model.matrix = new Matrix(4, 4);
            processed.models.push(model);
        }

        return processed;
    }
    
    // x0:           float (x coordinate of p0)
    // y0:           float (y coordinate of p0)
    // x1:           float (x coordinate of p1)
    // y1:           float (y coordinate of p1)
    drawLine(x0, y0, x1, y1) {
        this.ctx.strokeStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();

        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(x0 - 2, y0 - 2, 4, 4);
        this.ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    }
};

export { Renderer };
