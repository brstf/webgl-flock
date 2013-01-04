/**
 * BaseView.js - Base object that all views inherit from
 */

function BaseView( gl ) {
    this.gl = gl;
    this.mvmat = mat4.create();
    this.vbo = 0;
    this.ind = 0;
    this.color = new Float32Array( [ 1.0, 0.0, 1.0, 1.0 ] );
}

/**
 * Initializes all GL vars
 */
BaseView.prototype.init = function() {
    this.vbo = this.gl.createBuffer();
    this.ind = this.gl.createBuffer();
}

/**
 * Retrieves the vertex buffer object of this view's model.
 * @return VBO of this view's model
 */
BaseView.prototype.getVBO = function() {
    return this.vbo;
}

/**
 * Retrieves the element array buffer object of this view's model.
 * @return Element array buffer of this view's model
 */
BaseView.prototype.getIndexBuffer = function() {
    return this.ind;
}

/**
 * Retrieves the color array of for this object
 * @return 4-element Float32Array containing the color of
 *         this view
 */
BaseView.prototype.getColor = function() {
    return this.color;
}