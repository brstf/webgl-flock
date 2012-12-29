/**
 * View.js - Base object that all views inherit from
 */

function View( gl ) {
    this.gl = gl;
    this.mvmat = mat4.create();
    this.vbo = 0;
    this.ind = 0;
}

/**
 * Initializes all GL vars
 */
View.prototype.init = function() {
    this.vbo = this.gl.createBuffer();
    this.ind = this.gl.createBuffer();
}

/**
 * Retrieves the vertex buffer object of this view's model.
 * @return VBO of this view's model
 */
View.prototype.getVBO = function() {
    return this.vbo;
}

/**
 * Retrieves the element array buffer object of this view's model.
 * @return Element array buffer of this view's model
 */
View.prototype.getIndexBuffer = function() {
    return this.ind;
}