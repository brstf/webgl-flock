var gl;
var requestId;
var world;
var view;
var obsi = null;

var NUM_BOIDS = 100;

function update( time ) {
    // Setup another request
    requestId = requestAnimFrame( update, document.getElementById('c') );
    
    world.update();
    world.move();
    
    // Finally, display
    view.draw( world );
}

/**
 * Initializes all variables, shaders, and WebGL options 
 * needed for this program.
 */ 
function init() {
    // Generate a number of boids:
    world = new World( 1.0, 1.0, NUM_BOIDS );
    view = new Views( gl );
    
    // Reshape the canvas, and setup the viewport and projection
    reshape();
    
    requestId = requestAnimFrame( update, document.getElementById('c') );
}

/**
 * Reshape function, reshapes the WebGL viewport and sets up the 
 * projection matrix based on current zoom level.
 */
var reshape = function() {
    // Get the WebGl canvas
    var canvas = document.getElementById('c');
    
    // Resize the canvas based on the window size
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    
    view.reshape( canvas.width, canvas.height );
    world.setBounds( view.width, view.height );
}

/**
 * Entry point of the application.
 */
function main() {
    // Get the WebGL canvas, and initialize WebGL
    var c = document.getElementById('c');
    gl = WebGLDebugUtils.makeDebugContext( WebGLUtils.setupWebGL( c ) );
    
    // Escape on any error
    if(!gl) {
        return;
    }
    
    // Setup the window's resize function
    window.onresize = reshape;
    c.onmousedown = mouseDown;
    c.onmouseup = mouseUp;
    c.onmousemove = mouseMove;
    
    // Initialize all variables and display the scene
    init();
    view.draw( world );
}

/**
 * Handles mouse click events, such as initially creating
 * an obstacle.
 * @param ev Mouse down event object
 */
function mouseDown( ev ) {
    obsi = world.obs.length;
    
    var c = document.getElementById('c');
    var offsets = c.getBoundingClientRect();
    var x = ( ev.clientX - offsets.left ) / c.width * world.width;
    var y = ( 1.0 - ( ev.clientY - offsets.top ) / c.height ) * world.height;
    world.addObstacle( x, y, 0 );
}

/**
 * Releases selected obstacle on mouse up (if any).
 * @param ev Mouse up event object
 */
function mouseUp( ev ) {
    obsi = null;
}

/**
 * Handles mouse motion events, such as creating obstacles.
 * @param ev Mouse motion event object
 */
function mouseMove( ev ) {
    if( obsi === null ) {
        return;
    }
    
    var obs = world.getObstacle( obsi );
    var c = document.getElementById('c');
    var offsets = c.getBoundingClientRect();
    var x = ( ev.clientX - offsets.left ) / c.width * world.width;
    var y = ( 1.0 - ( ev.clientY - offsets.top ) / c.height ) * world.height;
    var pos = new Vec2( x, y );
    obs.rad = pos.minus( obs.pos ).magnitude();
}
