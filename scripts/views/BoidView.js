/*
 * BoidView.js - Object that handles display of boid objects.
 */
 
BoidView.prototype = new BaseView();
BoidView.prototype.constructor = BoidView;
BoidView.prototype.parent = BaseView.prototype;

/**
 * Constructor that takes in a WebGL context to initialize this view with.
 * @param gl WebGL context associated with the views object.
 */
function BoidView( gl ) {   
    this.gl = gl;
    
    this.mvmat = mat4.create();
    this.init();
    
    // Set the color of this object to be blue
    this.color = new Float32Array( [ 0.0, 0.0, 1.0, 1.0 ] );
}

BoidView.prototype.init = function() {
    this.parent.init.call( this );
    
    // Bind the vertex buffer and add the boid triangle vertices to it
    this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vbo );
    var verts = new Float32Array([ -1.0, 0.5, 0.0, -1.0, -0.5, 0.0, 1.0, 0.0, 0.0 ]);
    this.gl.bufferData( this.gl.ARRAY_BUFFER, verts, this.gl.STATIC_DRAW );
    this.vbo.length = 9;
    
    // Bind and set the data of the index buffer
    this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, this.ind );
    this.gl.bufferData( this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2]), this.gl.STATIC_DRAW );
    this.ind.length = 3;
}

BoidView.prototype.draw = function( boid, scale, mvloc ) {
    // Translate and rotate to match the boid's position
    mat4.identity( this.mvmat );
    mat4.translate( this.mvmat, [ boid.pos.x, boid.pos.y, 0.0 ], this.mvmat );
    var theta = Math.acos( boid.vel.x / boid.vel.magnitude() ) * ( boid.vel.y > 0.0 ? 1.0 : -1.0 );
    
    mat4.rotateZ( this.mvmat, theta, this.mvmat );
    mat4.scale( this.mvmat, [ scale, scale, scale ], this.mvmat );
    

    // Send the matrix data to the shader location specified, and
    // draw the boid
    this.gl.uniformMatrix4fv( mvloc, false, this.mvmat );
    this.gl.drawElements( this.gl.TRIANGLES, 3, this.gl.UNSIGNED_SHORT, 0 );
}
