var gl;
var requestId;
var world;
var view;
var sel_obs = null;
var mouse_pos = null;

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
    world.setBounds( canvas.width / canvas.height, 1.0 );
}

/**
 * Entry point of the application.
 */
function main() {
    // Get the WebGL canvas, and initialize WebGL
    var c = document.getElementById('c');
    //gl = WebGLDebugUtils.makeDebugContext( WebGLUtils.setupWebGL( c ) );
    gl = WebGLUtils.setupWebGL( c );
    
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
    // Project the cursors location into world space
    var c = document.getElementById('c');
    var offsets = c.getBoundingClientRect();
    var x = ( ev.clientX - offsets.left ) / c.width * world.width;
    var y = ( 1.0 - ( ev.clientY - offsets.top ) / c.height ) * world.height;
    
    var pos = new Vec2( x, y );
    
    // Now loop through all obstacles to see if the user is selecting 
    // an obstacle
    for( var i = 0; i < world.obs.length; ++i ) {
        if( world.obs[i].nearEdge( pos ) ) {
            sel_obs = i;
            view.selectObstacle( sel_obs, false, true );
            return;
        } else if( world.obs[i].distance( pos ) == 0 ) {
            sel_obs = i;
            mouse_pos = world.obs[i].pos.minus( pos );
            view.selectObstacle( sel_obs, false, false );
            return;
        }
    }
    
    // If the cursor wasn't on any obstacle, add a new one
    sel_obs = world.obs.length;
    world.addObstacle( x, y, 0 );
    view.selectObstacle( sel_obs, false, true );
}

/**
 * Releases selected obstacle on mouse up (if any).
 * @param ev Mouse up event object
 */
function mouseUp( ev ) {
    if( world.obs[ sel_obs ].rad < 0.005 ) {
        world.obs[ sel_obs ].rad = 0.005;
    }
    sel_obs = null;
    mouse_pos = null;
    view.deselectObstacle();
}

/**
 * Handles mouse motion events, such as creating obstacles.
 * @param ev Mouse motion event object
 */
function mouseMove( ev ) {
    // Project mouse coordinates into world coordinates
    var c = document.getElementById('c');
    var offsets = c.getBoundingClientRect();
    var x = ( ev.clientX - offsets.left ) / c.width * world.width;
    var y = ( 1.0 - ( ev.clientY - offsets.top ) / c.height ) * world.height;
    var pos = new Vec2( x, y );
    
    if( sel_obs === null ) {
        for( var i = 0; i < world.obs.length; ++i ) {
            if( world.obs[i].nearEdge( pos ) ) {
                view.selectObstacle( i, true, true );
                return;
            } else if( world.obs[i].distance( pos ) == 0 ) {
                view.selectObstacle( i, true, false );
                return;
            }
        }
        view.deselectObstacle();
        return;
    }
    
    var obs = world.obs[ sel_obs ];
    if( mouse_pos !== null ) {
        obs.pos = pos.plus( mouse_pos );
    } else {
        obs.rad = pos.minus( obs.pos ).magnitude();
    }
}
