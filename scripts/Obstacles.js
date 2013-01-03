/**
 * Obstacles.js - Contains obstacle objects that the Boids will avoid.
 */
 
/**
 * Constructor for a default point obstacle.
 * @param x X-coordinate of this point obstacle
 * @param y Y-coordinate of this point obstacle
 */
function Obstacle( x, y ) {
    this.pos = new Vec2( x, y );
}

/**
 * Distance function that returns the distance to this obstacle.
 * For a simple point obstacle, this desitance is simply the distance
 * between the two points.
 * @param pos Vec2 position of the boid to calculate distance from
 */
Obstacle.prototype.distance = function( pos ) {
    return pos.minus( this.pos ).magnitude();
}

/**
 * Circle Obstacle
 */
CircleObstacle.prototype = new Obstacle();
CircleObstacle.prototype.constructor = CircleObstacle;

/**
 * Constructor for a CircleObstacle with a given position and
 * radius.
 * @param x X-position of the circle obstacle
 * @param y Y-position of the circle obstacle
 * @param r Radius of this circle obstacle
 */
function CircleObstacle( x, y, r ) {
    this.pos = new Vec2( x, y );
    this.rad = r;
}

/**
 * Distance function that returns the distance to this obstacle.
 * For a circle obstacle, this is the from the center of the circle
 * to the point minus the radius of the circle.
 * @param pos Vec2 position of the boid to calculate distance from
 */
CircleObstacle.prototype.distance = function( pos ) {
    var dist = pos.minus( this.pos ).magnitude() - this.rad
    return dist > 0 ? dist : 0;
}

/**
 * Square Obstacle
 */
RectangleObstacle.prototype = new Obstacle();
RectangleObstacle.prototype.constructor = RectangleObstacle;

/**
 * Constructor for a RectangleObstacle with a given center and 
 * a width and height
 * @param x X-position of the rectangle  obstacle
 * @param y Y-position of the rectangle obstacle
 * @param w Width of the rectangle obstacle
 * @param h Height of the rectangle obstacle
 */
function RectangleObstacle( x, y, w, h ) {
    this.pos = new Vec2( x, y );
    this.width = w;
    this.height = h;
}