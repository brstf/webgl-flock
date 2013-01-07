/*
 * World.js - Handles updating velocity, movement, wrap around
 *            etc. of all Boids.  Only 1 World is used
 *            for a collection of Boids.
 */
 
var CLOSE_THRESH = 0.11;
var SEP_THRESH = 0.05;
var OBS_THRESH = 0.025;

/**
 * Constructor that accepts parameters for width and height 
 * of display area (for wrap around) and the number of Boids
 * to start with initially.
 * @param width Width of display area
 * @param height Height of display area
 * @param nBoids Number of initial boids
 */
function World( width, height, nBoids ) {
    // Set necessary default values
    if( width === undefined ) {
        width = 1.0;
    }
    if( height === undefined ) {
        height = 1.0;
    }
    if( nBoids === undefined ) {
        nBoids = 0;
    }
    
    // Initialize properties:
    this.width = width;
    this.height = height;
    this.boids = [];
    this.obs = [];
    this.generateBoids( nBoids );
}

/**
 * Generates a number of new boids for this boid controller to keep 
 * track of.  Position and velocity of new boids are randomly generated.
 * @param nBoids Number of boids to generate
 */
World.prototype.generateBoids = function( nBoids ) {
    if( nBoids === undefined ) {
        nBoids = 1;
    }
    
    for( var i = 0; i < nBoids; ++i ) {
        pos = [ Math.random() * this.width, Math.random() * this.height ];
        vel = [ (Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 2.0 ];
        this.boids.push( new Boid( pos[0], pos[1], vel[0], vel[1] ) );
    }
}

/**
 * Adds a Boid with a random position and velocity to this boid controller.
 */
World.prototype.addBoid = function() {
    this.generateBoids( 1 );
}

/** 
 * Removes a boid from this World with the given index, or 
 * if no index is given, remove the last boid from the list.
 * @param bi Index of boid to remove, removes last boid if bi is undefined
 */
World.prototype.removeBoid = function( bi ) {
    if( bi === undefined ) {
        bi = this.boids.length - 1;
    }
    this.boids.splice( bi, 1 );
}

/**
 * Retrieve the number of boids currently active.
 * @return Number of boids in the world
 */
World.prototype.getNumBoids = function() {
    return this.boids.length;
}

/**
 * Adds an obstacle to the world with the given parameters.
 * If any parameter is unspecified, it will be randomly 
 * generated.
 * @param x x-location of the obstacle
 * @param y y-location of the obstacle
 * @param r radius of the obstacle
 */
World.prototype.addObstacle = function( x, y, r ) {
    if( x === undefined ) {
        x = Math.random() * this.width;
    }
    
    if( y === undefined ) {
        y = Math.random() * this.height;
    }
    
    if( r === undefined ) {
        r = Math.random() * 0.05;
    }
    
    this.obs.push( new CircleObstacle( x, y, r ) );
}

World.prototype.getObstacle = function( i ) {
    if( i >= 0 && i < this.obs.length ) {
        return this.obs[i];
    } else {
        return null;
    }
}

/** Function to return the wrap around point of pos2 that is closest
    to the given pos1.
    @param pos1 Anchor point used to calculate closest position
    @param pos2 Point to wrap around and find the closest position of
    @return Closest representation of pos2 to pos1 potentially wrapped 
            around the screen.
*/
World.prototype.closestPoint = function( pos1, pos2 ) {
    var dvec = new Vec2( pos2.x - pos1.x, pos2.y - pos1.y );
    var cpos = new Vec2( pos2.x, pos2.y );
    
    // Wrap around the x direction if necessary
    if( dvec.x > this.width / 2.0 ) {
        cpos.x -= this.width;
    } else if( dvec.x < -this.width / 2.0 ) {
        cpos.x += this.width;
    }
    
    // Wrap around the y direction if necessary
    if( dvec.y > this.height / 2.0 ) {
        cpos.y -= this.height;
    } else if( dvec.y < -this.height / 2.0 ) {
        cpos.y += this.height;
    }
    
    // Now cpos has the closest wrap around point of c2
    return cpos;
}

/**
 * Updates the velocities of all Boids according to the flocking algorithm.
 */
World.prototype.update = function() {
    // Loop through each boid
    for( var i = 0; i < this.boids.length; ++i ) {
        // Coherence, separation, and alignment vectors
        var coherence = new Vec2( 0.0, 0.0 );
        var separate  = new Vec2( 0.0, 0.0 );
        var align     = new Vec2( 0.0, 0.0 );
        
        // count the number of points in close range and sep range
        var count = 0, sepCount = 0;
        
        // Loop through each boid and calculate coherence and separation
        // positions and alignment direction
        for( var j = 0; j < this.boids.length; ++j ) {
            var cpos = this.closestPoint( this.boids[i].pos, this.boids[j].pos );
            var dist = this.boids[i].pos.minus( cpos ).magnitude();
            
            // If within the neighborhood threshold
            if( dist < CLOSE_THRESH && dist > 0) {
                coherence.add( cpos );
                align.add( this.boids[j].vel );
                ++count;
                
                if( dist < SEP_THRESH ) {
                    var sepvec = this.boids[i].pos.minus( cpos ).normalize();
                    separate = separate.plus( sepvec.multiply( 1.0 / dist ) );
                    ++sepCount;
                }
            }
        }
        
        // Loop through all obstacles and avoid them
        for( var j = 0; j < this.obs.length; ++j ) {
            var cpos = this.closestPoint( this.obs[j].pos, this.boids[i].pos );
            var dist = this.obs[j].distance( cpos );
            
            if( dist < OBS_THRESH && dist > 0 ) {
                dist += 0.001;
                var sepvec = cpos.minus( this.obs[j].pos ).normalize();
                separate = separate.plus( sepvec.multiply( 1.0 / dist ) );
                ++sepCount;
            }
        }
        
        if( count > 0 ) {
            coherence = coherence.multiply( 1.0 / count );
            align = align.multiply( 1.0 / count );
            
            if( sepCount > 0 ) {
                separate = separate.multiply( 1.0 / sepCount );
            }
            
            // Update the boid's velocity with the calculated vectors
            this.boids[i].flock( coherence, align, separate );
        }
    }
}

/**
 * Moves all of the boids, performing wrap around if necessary.
 */
World.prototype.move = function() {
    for( var i = 0; i < this.boids.length; ++i ) {
        this.boids[i].move();
        
        // Do wrap around X
        if( this.boids[i].pos.x > this.width ) {
            this.boids[i].pos.x -= this.width;
        } else if( this.boids[i].pos.x < 0 ) {
            this.boids[i].pos.x += this.width;
        }
        
        // Do wrap around Y
        if( this.boids[i].pos.y > this.height ) {
            this.boids[i].pos.y -= this.height;
        } else if( this.boids[i].pos.y < 0 ) {
            this.boids[i].pos.y += this.height;
        }
    }
}

World.prototype.setBounds = function( width, height ) {
    this.width = width;
    this.height = height;
}