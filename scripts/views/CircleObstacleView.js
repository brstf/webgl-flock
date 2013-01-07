/*
 * CircleObstacleView.js - Object that handles display of circle obstacle objects.
 */
 
CircleObstacleView.prototype = new BaseView();
CircleObstacleView.prototype.constructor = CircleObstacleView;
CircleObstacleView.prototype.parent = BaseView.prototype;

/**
 * Constructor that takes in a WebGL context to initialize this view with.
 * @param gl WebGL context associated with the views object.
 */
function CircleObstacleView( gl ) {   
    this.gl = gl;
    this.NUM_VERTICES = 50;
    
    this.mvmat = mat4.create();
    this.init();
    
    // Set the color of this object to be a pale red
    this.color = new Float32Array( [ 1.0, 0.5, 0.5, 1.0 ] );
    this.ring_color = new Float32Array( [ 1.0, 0.3, 0.3, 1.0 ] );
    this.hov_color = new Float32Array( [ 0.5, 1.0, 0.5, 1.0 ] );
    this.hov_ring_color = new Float32Array( [ 0.3, 1.0, 0.3, 1.0 ] );
    this.sel_color = new Float32Array( [ 0.5, 0.5, 1.0, 1.0 ] );
    this.sel_ring_color = new Float32Array( [ 0.3, 0.3, 1.0, 1.0 ] );
}

CircleObstacleView.prototype.init = function() {
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

CircleObstacleView.prototype.draw = function( obs, selected, edge, scale, prog_loc ) {
    // Translate and rotate to match the obstacle's position
    mat4.identity( this.mvmat );
    mat4.translate( this.mvmat, [ scale * obs.pos.x, scale * obs.pos.y, 0.0 ], this.mvmat );
    mat4.scale( this.mvmat, [ scale * obs.rad, scale * obs.rad, obs.rad ], this.mvmat );

    // Send the matrix data to the shader location specified, and
    // draw the obstacle
    this.gl.uniformMatrix4fv( prog_loc.uMVMatrix, false, this.mvmat );
    
    // Set the blue color if this edge is selected, red if not
    if( selected == 1 && edge ) {
        this.gl.uniform4fv( prog_loc.uColor, this.sel_ring_color );
    } else if ( selected == 2 && edge ) {
        this.gl.uniform4fv( prog_loc.uColor, this.hov_ring_color );
    } else {
        this.gl.uniform4fv( prog_loc.uColor, this.ring_color );
    }
    
    this.gl.drawElements( this.gl.TRIANGLE_FAN, this.ind.length, this.gl.UNSIGNED_SHORT, 0 );
    mat4.scale( this.mvmat, [ 1.0 / (scale * obs.rad), 1.0 / (scale * obs.rad), 1.0 ], this.mvmat );
    mat4.scale( this.mvmat, [ (scale * obs.rad) - 3, (scale * obs.rad) - 3, 1.0 ], this.mvmat );
    this.gl.uniformMatrix4fv( prog_loc.uMVMatrix, false, this.mvmat );
    
    // Set the blue color if this edge is selected, red if not
    if( selected == 1 && !edge ) {
        this.gl.uniform4fv( prog_loc.uColor, this.sel_color );
    } else if ( selected == 2 && !edge ) {
        this.gl.uniform4fv( prog_loc.uColor, this.hov_color );
    } else {
        this.gl.uniform4fv( prog_loc.uColor, this.color );
    }
    
    this.gl.drawElements( this.gl.TRIANGLE_FAN, this.ind.length, this.gl.UNSIGNED_SHORT, 0 );
}
