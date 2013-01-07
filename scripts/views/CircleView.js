/*
 * CircleView.js - Object that handles display of circles.
 */
 
CircleView.prototype = new BaseView();
CircleView.prototype.constructor = CircleView;
CircleView.prototype.parent = BaseView.prototype;

/**
 * Constructor that takes in a WebGL context to initialize this view with.
 * @param gl WebGL context associated with the views object.
 */
function CircleView( gl ) {   
    this.gl = gl;
    this.NUM_VERTICES = 10;
    
    this.mvmat = mat4.create();
    this.init();
    
    // Set the color of this object to be a pale red
    this.color = new Float32Array( [ 0.0, 0.0, 1.0, 1.0 ] );
}

CircleView.prototype.init = function() {
    this.parent.init.call( this );
    
    // Bind the vertex buffer and add the circle vertices
    this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vbo );
    var verts = [ ];
    var inds = [ ];
    var count = 0;
    for( var theta = 0; theta < 2 * Math.PI; theta += 2 * Math.PI / this.NUM_VERTICES ) {
        verts.push( Math.cos( theta ) );
        verts.push( Math.sin( theta ) );
        verts.push( 0.0 );
        inds.push( count );
        ++count;
    }
    
    this.gl.bufferData( this.gl.ARRAY_BUFFER, new Float32Array( verts ), 
        this.gl.STATIC_DRAW );
    this.vbo.length = verts.length;
    
    // Bind and set the data of the index buffer
    this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, this.ind );
    this.gl.bufferData( this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( inds ), 
        this.gl.STATIC_DRAW );
    this.ind.length = inds.length;
}

CircleView.prototype.draw = function( pos, r, scale, mvloc ) {
    // Translate and rotate to match the obstacle's position
    mat4.identity( this.mvmat );
    mat4.translate( this.mvmat, [ scale * pos.x, scale * pos.y, 0.0 ], this.mvmat );
    mat4.scale( this.mvmat, [ scale * r, scale * r, 1.0 ], this.mvmat );

    // Send the matrix data to the shader location specified, and
    // draw the obstacle
    this.gl.uniformMatrix4fv( mvloc, false, this.mvmat );
    this.gl.drawElements( this.gl.TRIANGLE_FAN, this.ind.length, this.gl.UNSIGNED_SHORT, 0 );
}
