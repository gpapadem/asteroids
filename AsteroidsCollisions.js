/************************************************ 
Program Asteroids and Black Hole
Based on a web lecture by Derek Banas

Modified by JorgePap, Dec 2020, during Covid-19 lockdown...

Added: Asteroids random rotation, random asteroid speed, bullet lifespan, debris,  
new ship design, ship acceleration indication, controlable friction (up-down arrows), 
velocity-acceleration-friction-durability info views, elastic collisions, breaking asteroids 
and ship if the impact energy is great, or ship durability is low, random asteroid shape, 
ship collision durability, elastic collision between asteroids, game and test modes, 
and a massive object (black hole?) with Newtonian gravity (for fun) 
that attracts and eats everything ... 

*************************************************/

let canvas;
let ctx;
let canvasWidth = 1200;
let canvasHeight = 650;
let keys = [];
let ship;
let blackHole;
let bullets = [];
let asteroids = [];
let debris = [];
let score = 0;
let lives = 3;
let astnumber = 3;
let collisionEnergyMax = 120;
let printHelp = false;
let printHelpLife = 800; // cycles
let maxSpeed = 20;
let gravityConstant = 0.06;
let localFriction = 0;
let radgrad;  // for the gradient
let debFlag = false;  // for additional info on screen
let game = true;

// HOMEWORK SOLUTION - Contributed by luckyboysunday
let highScore;
let localStorageName = "HighScore";
 
document.addEventListener('DOMContentLoaded', SetupCanvas);
 
function SetupCanvas(){
    canvas = document.getElementById("my-canvas");
    ctx = canvas.getContext("2d");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
 
    ship = new Ship();
    blackHole = new BlackHole();
    //blackHole.visible = false;
 
    for(let i = 0; i < astnumber; i++){
      asteroids.push(new Asteroid());
    }
 
    document.body.addEventListener("keydown", HandleKeyDown);
    document.body.addEventListener("keyup", HandleKeyUp);
 
    // HOMEWORK SOLUTION - Contributed by luckyboysunday
    // Retrieves locally stored high scores
    if (localStorage.getItem(localStorageName) == null) {
        highScore = 0;
    } else {
        highScore = localStorage.getItem(localStorageName);
    }
 
    Render();
}
 
// HOMEWORK SOLUTION
// Move event handling functions so that we can turn off
// event handling if game over is reached
function HandleKeyDown(e){
    keys[e.keyCode] = true;
    if (e.keyCode == 38) {
        ship.friction += 0.001;
    }
    if (e.keyCode == 40) {
        if (ship.friction > 0 ) { 
            ship.friction -= 0.001;
        }
        else {ship.friction = 0;}
    }
    if (e.keyCode == 39) {
        localFriction += 0.0005;
    }
    if (e.keyCode == 37) {
        if (localFriction > 0 ) { 
            localFriction -= 0.0005;
        }
        else {localFriction = 0;}
    }
    if (e.keyCode == 83) {
        if (game == true) { 
            game = false;
            ship.visible = false;
        }
        else {
            game = true;
            ship.visible = true;
        }
    }
    if (e.keyCode == 72 && !printHelp) {
        printHelp = true;
        printHelpLife = 1000;
    } else {
        printHelpLife = 0;
        printHelp = false;
    }
    if (e.keyCode == 66) {
        if (blackHole.visible) {
            blackHole.visible = false;
        } else {
            blackHole.visible = true;
        }
    } 
    if (e.keyCode == 77) {
        asteroids.push(new Asteroid());
    } 
    if (e.keyCode == 71 && !debFlag) {
        debFlag = true;
    } else if (e.keyCode == 71 && debFlag) {
        debFlag = false;
    }
}

function HandleKeyUp(e){
    keys[e.keyCode] = false;
    if (e.keyCode === 32){
        bullets.push(new Bullet(ship.angle));
    }
}
 
class Ship {
    constructor() {
        this.visible = true;
        this.x = canvasWidth / 2 + 150;
        this.y = canvasHeight / 2;
        this.accelerating = false;
        this.acceleration = 0.08;
        this.velX = 0;
        this.velY = 0;
        this.rotateSpeed = 0.001;
        this.friction = 0.001;
        this.frictionmultiplier = 1 - this.friction;
        this.radius = 15;
        this.angle = 0;
        this.strokeColor = 'white';
        // Used to know where to fire the bullet from
        this.noseX = canvasWidth / 2 - 15;
        this.noseY = canvasHeight / 2;
        this.mass = this.radius * 1.8;
        this.wear = 500;
    }

    Rotate(dir) {
        this.angle += this.rotateSpeed * dir;
    }
    
    Update() {
        // Get current direction ship is facing
        let radians = this.angle / Math.PI * 180;
        // Calculate new frictionmultiplier because can be changed by the player
        this.frictionmultiplier = 1 - this.friction;
 
        // If moving forward calculate changing values of x & y
        // If you want to find the new point x use the 
        // formula oldX + cos(radians) * distance
        // Forumla for y oldY + sin(radians) * distance
        if (this.accelerating) {
            this.velX += Math.cos(radians) * this.acceleration;
            this.velY += Math.sin(radians) * this.acceleration;
        }
        // If ship goes off board place it on the opposite
        // side    
        if (this.x < 0) {
            this.x = canvas.width;
        }
        if (this.x > canvas.width) {
            this.x = 0;
        }
        if (this.y < 0) {
            this.y = canvas.height;
        }
        if (this.y > canvas.height) {
            this.y = 0;
        }
        // Slow ship speed 
        this.velX *= this.frictionmultiplier;
        this.velY *= this.frictionmultiplier;
 
        // Change value of x & y while accounting for
        // air friction    
        this.x += this.velX;
        this.y += this.velY;
        // Decrease speed if we overdo it
        if (this.velX > maxSpeed || this.velY > maxSpeed) {
            this.velX *= 0.9;
            this.velY *= 0.9; 
        }
    }

    Draw() {
        ctx.strokeStyle = this.strokeColor;
        ctx.beginPath();
        // Angle between vertices of the ship
        let vertAngle = ((Math.PI * 2) / 2.5);
 
        let radians = this.angle / Math.PI * 180;
        // Where to fire bullet from
        this.noseX = this.x + this.radius * Math.cos(radians);
        this.noseY = this.y + this.radius * Math.sin(radians);
 
        // Draw the ship triangle
        ctx.lineTo(this.x + this.radius * Math.cos(radians), 
            this.y + this.radius * Math.sin(radians));
        ctx.lineTo(this.x + this.radius * Math.cos(vertAngle + radians), 
            this.y + this.radius * Math.sin(vertAngle + radians));
        ctx.lineTo(this.x + this.radius * Math.cos(-vertAngle + radians), 
            this.y + this.radius * Math.sin(-vertAngle + radians));
        ctx.lineTo(this.x + this.radius * Math.cos(radians), 
            this.y + this.radius * Math.sin(radians));
        
        // When accelerating show a litle fire at the back of the ship
        if (this.accelerating) {
            ctx.moveTo(this.x - this.radius * Math.cos(2*Math.PI + radians), 
            this.y - this.radius * Math.sin(2*Math.PI + radians));
            ctx.lineTo(this.x - this.radius * Math.cos(2*Math.PI + radians)*1.45 , 
            this.y - this.radius * Math.sin(2*Math.PI + radians)*1.45);
        }

        ctx.closePath();
        ctx.stroke();
    }
}

class BlackHole {
    constructor() {
        this.visible = true;
        this.mass = 5000;
        this.radius = 20;
        this.SchwarzsRadius = 4;
        this.maxSpeed = 0.15;
        this.angle = 30;
        this.x = canvasWidth / 2; //Math.floor(Math.random() * canvasWidth);
        this.y = canvasHeight / 2; // Math.floor(Math.random() * canvasHeight);
        this.speed = 0; // Math.random() * 1;
        this.direction = Math.floor(Math.random() * 359);
        let rads = this.direction / Math.PI * 180;
        this.velX = Math.cos(rads) * this.speed;
        this.velY = Math.sin(rads) * this.speed;

    }

    Update() {
        this.updateMySpeed();
        this.x += this.velX;
        this.y += this.velY;
        if (this.x < 0) {
            this.x = canvas.width;
        }
        if (this.x > canvas.width) {
            this.x = 0;
        }
        if (this.y < 0) {
            this.y = canvas.height;
        }
        if (this.y > canvas.height) {
            this.y = 0;
        }
        this.SchwarzsRadius = this.mass/2500;
    }

    updateMySpeed() {
        this.speed = calcSpeed(this.velX, this.velY);
        if (this.speed > this.maxSpeed) {
            this.velX *= 0.98;
            this.velY *= 0.98;
        }
    }

    Draw() {
        ctx.beginPath();
        radgrad = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, 6);
        radgrad.addColorStop(0, "white");
        radgrad.addColorStop(1, "gray");
        ctx.fillStyle = radgrad;
        ctx.globalAlpha=0.5;// opacity at 0.5
        let vertAngle = ((Math.PI * 2) / 6);
        var radians = this.angle / Math.PI * 180;
        // Draw a different shape every time!
        for(let i = 0; i < 6; i++){
            ctx.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians + Math.random()), 
            this.y - this.radius * Math.sin(vertAngle * i + radians + Math.random()));
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha=1;// opacity at 1
        ctx.fillStyle = "black";
    }
}

class Bullet{
    constructor(angle) {
        this.visible = true;
        this.life = 100;
        this.mass = 1;
        this.x = ship.noseX;
        this.y = ship.noseY;
        this.angle = angle;
        this.height = 4;
        this.width = 4;
        this.speed = 5;
        this.velX = ship.velX;
        this.velY = ship.velY;
    }

    Update(){
        let radians = this.angle / Math.PI * 180;
        this.x += Math.cos(radians) * this.speed + this.velX;
        this.y += Math.sin(radians) * this.speed + this.velY;
        // If bullet goes off board place it on the opposite
        // side    
        if (this.x < 0) {
            this.x = canvas.width;
        }
        if (this.x > canvas.width) {
            this.x = 0;
        }
        if (this.y < 0) {
            this.y = canvas.height;
        }
        if (this.y > canvas.height) {
            this.y = 0;
        }
        this.life -= 1;
    }

    Draw(){
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x,this.y,this.width,this.height);
    }
}
 
class Asteroid{
    constructor(x, y, radius, level, collisionRadius, vx, vy, dir) {
        this.visible = true;
        this.x = x || Math.floor(Math.random() * canvasWidth);
        this.y = y || Math.floor(Math.random() * canvasHeight);
        this.speed = Math.random() * 5;
        this.direction = dir || Math.floor(Math.random() * 359);
        let rads = this.direction / Math.PI * 180;
        this.velX = vx || Math.cos(rads) * this.speed;
        this.velY = vy || Math.sin(rads) * this.speed;
        //this.radius = radius*(Math.random()*radius/5)  || 25*(Math.random()*5);
        this.radius = radius || 25;
        var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
        this.rotateSpeed = Math.random() * 0.002 * plusOrMinus;
        this.angle = Math.floor(Math.random() * 359);
        this.strokeColor = 'white';
        this.collisionRadius = collisionRadius || 20;
        // Used to decide if this asteroid can be broken into smaller pieces
        this.level = level || 1;  
        // Create random asteroid shape
        this.distortion = [];
        for (let i = 0; i < 6; i++) {
            let tv = Math.random() * 1.2 - 2.4;
            this.distortion[i] = tv;
        }
       this.mass = this.radius ** 2 + (Math.random() * 5 - 2.5);
       this.endurance = this.mass * 8;
       this.markForBreak = false;
    }

    Update(){
        this.angle += this.rotateSpeed;
        this.updateMySpeed();
        this.x += this.velX;
        this.y += this.velY;
        if (this.x < 0) {
            this.x = canvas.width;
        }
        if (this.x > canvas.width) {
            this.x = 0;
        }
        if (this.y < 0) {
            this.y = canvas.height;
        }
        if (this.y > canvas.height) {
            this.y = 0;
        }
    }

    updateMySpeed() {
        this.speed = calcSpeed(this.velX, this.velY);
        if (this.speed > maxSpeed) {
            this.velX *= 0.9;
            this.velY *= 0.9;
        } else {
            this.velX *= 1 - localFriction;
            this.velY *= 1 - localFriction;
        }
    }

    Draw(){
        ctx.beginPath();
        let vertAngle = ((Math.PI * 2) / 6);
        var radians = this.angle / Math.PI * 180;
        for(let i = 0; i < 6; i++){
            ctx.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians + this.distortion[i]), 
            this.y - this.radius * Math.sin(vertAngle * i + radians + this.distortion[i]));
        }
        ctx.closePath();
        ctx.stroke();
    }
}

class Debris{
    constructor(x, y, velX, velY) {
        this.visible = true;
        this.x = x;
        this.y = y; 
        this.speed = Math.random() * 3;
        this. mass = Math.random() + 2;
        //this.radius = radius*(Math.random()*radius/5)  || 25*(Math.random()*5);
        this.radius = 6;
        var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
        this.rotateSpeed = Math.random() * 0.003 * plusOrMinus;
        this.angle = Math.floor(Math.random() * 359);
        this.direction = Math.floor(Math.random() * 359);
        let rads = this.direction / Math.PI * 180; 
        this.velX = Math.cos(rads) * this.speed + velX;
        this.velY = Math.sin(rads) * this.speed + velY;
        this.strokeColor = 'white';
        this.life = Math.floor(Math.random() * 200 + 50);
        this.collisionRadius = 3;
        this.endurance = 5;
    }

    Update(){
        this.angle += this.rotateSpeed;
        this.updateMySpeed();
        this.x += this.velX;
        this.y += this.velY;
        if (this.x < 0) {
            this.x = canvas.width;
        }
        if (this.x > canvas.width) {
            this.x = 0;
        }
        if (this.y < 0) {
            this.y = canvas.height;
        }
        if (this.y > canvas.height) {
            this.y = 0;
        }
       this.life -= 1;
    }        
    
    updateMySpeed() {
        this.speed = calcSpeed(this.velX, this.velY);
        if (this.speed > maxSpeed) {
            this.velX *= 0.9;
            this.velY *= 0.9;
        } else {
            this.velX *= 1 - localFriction;
            this.velY *= 1 - localFriction;
        }
    }

    Draw(){
        ctx.beginPath();
        var radians = this.angle / Math.PI * 180;
        ctx.moveTo(this.x - this.radius * Math.cos(radians), 
                    this.y - this.radius * Math.sin(radians));
        ctx.lineTo(this.x + this.radius * Math.cos(radians), 
                    this.y + this.radius * Math.sin(radians));           
        ctx.closePath(); 
        ctx.stroke();
    }
}

function calcSpeed(vx, vy) {
    return Math.sqrt(vx**2 + vy**2);
}

// Collision between two sphares
function CircleCollision(p1x, p1y, r1, p2x, p2y, r2){
    let radiusSum;
    let xDiff;
    let yDiff;
 
    radiusSum = r1 + r2;
    xDiff = p1x - p2x;
    yDiff = p1y - p2y;
 
    if (radiusSum > Math.sqrt((xDiff * xDiff) + (yDiff * yDiff))) {
        return true;
    } else {
        return false;
    }
}

// Returns the new velocities assuming elastic collision between two objects.
// Also returns an analog to the collision energy
function ElasticColission(x1, y1, vx1, vy1, m1, x2, y2, vx2, vy2, m2) {
    // thet is the angle between the x-axis and the objects centres
    let thet = Math.atan2((y2 - y1) , (x2 - x1));
    let v1p;
    let v1k;
    let v2p;
    let v2k;
    let v1pn;
    let v1kn;
    let v2pn;
    let v2kn;
    let v1xn;
    let v2xn;
    let v1yn;
    let v2yn;

    // calculate the velocities parallel (p) and normal (k) to the object centres
    v1p = vx1 * Math.cos(thet) + vy1 * Math.sin(thet);
    v2p = vx2 * Math.cos(thet) + vy2 * Math.sin(thet);
    v1k = vx1 * Math.sin(thet) - vy1 * Math.cos(thet);
    v2k = vx2 * Math.sin(thet) - vy2 * Math.cos(thet);

    //check if v1p > v2p or 

    // calculate the new velocities p and k assuming elastic collision
    v1pn = ((m1 - m2) * v1p + 2 * m2 * v2p) / (m1 + m2);
    v2pn = ((m2 - m1) * v2p + 2 * m1 * v1p) / (m1 + m2);
    v1kn = v1k;
    v2kn = v2k;

    // caclulate the new velocities on x and y-axis
    v1xn = v1kn * Math.sin(thet) + v1pn * Math.cos(thet);
    v1yn = - v1kn * Math.cos(thet) + v1pn * Math.sin(thet);
    v2xn = v2kn * Math.sin(thet) + v2pn * Math.cos(thet);
    v2yn = - v2kn * Math.cos(thet) + v2pn * Math.sin(thet);

    // Caclulate an analog to the collision energy
    let CollisionEnergy = Math.abs(m1 * v1p - m2 * v2p);

    // return the values
    return [v1xn, v1yn, v2xn, v2yn, CollisionEnergy];
}

// Returns the gravity force vector  
function CaclulateAttraction(x1, y1, m1, x2, y2, m2) {
    let gravity =  gravityConstant * m1 * m2 /((x1 - x2)**2 + (y1 - y2)**2);
    let vector = Math.atan2((x2-x1) , (y2-y1));
    return [gravity, vector];
}

// Handles drawing life ships on screen
function DrawLifeShips(){
    let startX = canvasWidth-50;
    let startY = 10;
    let points = [[5, 15], [-5, 15]];
    ctx.strokeStyle = 'white'; // Stroke color of ships
    // Cycle through all live ships remaining
    for(let i = 0; i < lives; i++){
        // Start drawing ship
        ctx.beginPath();
        // Move to origin point
        ctx.moveTo(startX, startY);
        // Cycle through all other points
        for(let j = 0; j < points.length; j++){
            ctx.lineTo(startX + points[j][0], 
                startY + points[j][1]);
        }
        // Draw from last point to 1st origin point
        ctx.closePath();
        // Stroke the ship shape white
        ctx.stroke();
        // Move next shape 30 pixels to the left
        startX -= 30;
    }
}

// Display a little help for the user
function Help() {
    if (game) {
        let startX = canvasWidth / 2;
        let startY = canvasHeight / 2 - 80;
        ctx.strokeStyle = 'white'; // Stroke color of message
        ctx.font = "30px Comic Sans MS";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.fillText("ASTEROIDS - A Physics Test Battlescape", startX, startY);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Keys: A - turn left, D - turn right, W - accelerate, Up/Down key - increase/decrease fricton", startX, startY + 50);
        ctx.fillText("The black hole attracts (and is attracted by) ship and asteroids with Newtonian gravity", startX, startY + 75);
        ctx.fillText("The collisions between ship and asteroids are elastic. Just dont overdo it!", startX, startY + 100);
        ctx.fillText("By George Papademetriou - 2020. Based on online javascript lecture of Derek Banas", startX, startY + 130);    
    } else {
        let startX = canvasWidth / 2;
        let startY = canvasHeight / 2 - 80;
        ctx.strokeStyle = 'white'; // Stroke color of message
        ctx.font = "30px Comic Sans MS";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.fillText("ASTEROIDS - A Physics Test Battlescape", startX, startY);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Keys: left arrow/right arrow - decrease/increase friction, M : More Asteroids", startX, startY + 50);
        ctx.fillText("The black hole attracts (and is attracted by) asteroids with Newtonian gravity", startX, startY + 75);
        ctx.fillText("The collisions are elastic but can destroy an asteroid if the forces are high", startX, startY + 100);
        ctx.fillText("By George Papademetriou - 2020. Based on online javascript lecture of Derek Banas", startX, startY + 130);    
    }
    ctx.textAlign = "left";
}
 
function Render() {
    // Check if the ship is moving forward
    ship.accelerating = (keys[87]);
 
    if (keys[68]) {
        // d key rotate right
        ship.Rotate(1);
    }
    if (keys[65]) {
        // a key rotate left
       ship.Rotate(-1);
    }
   
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
 
    // Display score
    if (game) {
        ctx.fillStyle = 'white';
        ctx.font = '21px Arial';
        ctx.fillText("Newton Laws Test", 20, 35);
        ctx.fillText("SCORE : " + score.toString(), 20, 70);
    } else {
        ctx.fillStyle = 'white';
        ctx.font = '21px Arial';
        ctx.fillText("Newton Laws Test", 20, 35);
        ctx.fillText("Asteroids & Black Hole", 20, 70);
    }

    if (printHelp && printHelpLife > 0) {
        Help();
        printHelpLife -= 1;
    }

    // If no lives signal game over
    if(lives <= 0 && game){
        // HOMEWORK SOLUTION
        // If Game over remove event listeners to stop getting keyboard input
        document.body.removeEventListener("keydown", HandleKeyDown);
        document.body.removeEventListener("keyup", HandleKeyUp);
 
        ship.visible = false;
        //ctx.textBaseline = 'middle'; 
        ctx.textAlign = 'center'; 
        ctx.fillStyle = 'white';
        ctx.font = '50px Arial';
        ctx.fillText("GAME OVER", canvasWidth / 2, canvasHeight / 2);
        ctx.font = '20px Arial';
        ctx.fillText("Refresh the page to start again", canvasWidth / 2, canvasHeight / 2 + 60);
        ctx.font = '16px Arial';
        ctx.fillText("Or just sit and watch the beast feeding on the whole universe...", canvasWidth / 2, canvasHeight / 2 + 90);
        ctx.textAlign = 'left';
    }
 
    // HOME WORK SOLUTION : Creates a new level and increases asteroid speed
    if(asteroids.length === 0){
        astnumber += 1;
        for(let i = 0; i < astnumber; i++){
            let asteroid = new Asteroid();
            asteroid.speed += 0.8;
            asteroids.push(asteroid);
        }
    }
 
    // Draw life ships
    if (game) {
        DrawLifeShips();
    }
 
    // Check for collision of ship with asteroid
    if (asteroids.length !== 0) {
loop3:
        for(let k = 0; k < asteroids.length; k++){
            // Calculate attraction force and change the acceleration of the asteroid-black hole
            if (blackHole.visible == true) {
                let gravAccel = CaclulateAttraction(asteroids[k].x, asteroids[k].y, asteroids[k].mass, blackHole.x, blackHole.y, blackHole.mass);
                asteroids[k].velX += gravAccel[0]*Math.sin(gravAccel[1]) / asteroids[k].mass;
                asteroids[k].velY += gravAccel[0]*Math.cos(gravAccel[1]) / asteroids[k].mass;
                // Stress forces break asteroids down...
                if (asteroids[k].level==1 && gravAccel[0] > 350) {
                    asteroids.push(new Asteroid(asteroids[k].x - 10, asteroids[k].y - 10, 15, 2, 13, asteroids[k].velX * Math.random() * 2, 
                        asteroids[k].velY * Math.random() * 2, asteroids[k].direction - 20));
                    asteroids.push(new Asteroid(asteroids[k].x + 10, asteroids[k].y + 10, 15, 2, 13, asteroids[k].velX * Math.random() * 2, 
                        asteroids[k].velY * Math.random() * 2, asteroids[k].direction + 20));                        
                    for (let s = 1; s < 12; s++) {
                        debris.push(new Debris(asteroids[k].x + Math.floor(Math.random() * 3.1 - 1.6), 
                            asteroids[k].y + Math.floor(Math.random() * 3.1 - 1.6), asteroids[k].velX, asteroids[k].velY));    
                    }
                    blackHole.velX -= gravAccel[0]*Math.sin(gravAccel[1]) / blackHole.mass;
                    blackHole.velY -= gravAccel[0]*Math.cos(gravAccel[1]) / blackHole.mass; 
                    blackHole.mass += asteroids[k].mass;
                    asteroids.splice(k,1);
                    break loop3;
                }
                if (asteroids[k].level==2 && gravAccel[0] > 300) {
                    asteroids.push(new Asteroid(asteroids[k].x - 8, asteroids[k].y - 8, 8, 3, 6, asteroids[k].velX * Math.random() * 2, 
                        asteroids[k].velY * Math.random() * 2, asteroids[k].direction - 20));
                    asteroids.push(new Asteroid(asteroids[k].x + 8, asteroids[k].y + 8, 8, 3, 6, asteroids[k].velX * Math.random() * 2, 
                        asteroids[k].velY * Math.random() * 2, asteroids[k].direction + 20));                        
                    for (let s = 1; s < 10; s++) {
                        debris.push(new Debris(asteroids[k].x + Math.floor(Math.random() * 3.1 - 1.6), 
                        asteroids[k].y + Math.floor(Math.random() * 3.1 - 1.6), asteroids[k].velX, asteroids[k].velY));    
                    }
                    blackHole.velX -= gravAccel[0]*Math.sin(gravAccel[1]) / blackHole.mass;
                    blackHole.velY -= gravAccel[0]*Math.cos(gravAccel[1]) / blackHole.mass; 
                    blackHole.mass += asteroids[k].mass;
                    asteroids.splice(k,1);
                    break loop3;
                }
                if (asteroids[k].level==3 && gravAccel[0] > 250) {
                    for (let s = 1; s < 8; s++) {
                        debris.push(new Debris(asteroids[k].x + Math.floor(Math.random() * 3.1 - 1.6), 
                        asteroids[k].y + Math.floor(Math.random() * 3.1 - 1.6), asteroids[k].velX, asteroids[k].velY));    
                    }
                    blackHole.velX -= gravAccel[0]*Math.sin(gravAccel[1]) / blackHole.mass;
                    blackHole.velY -= gravAccel[0]*Math.cos(gravAccel[1]) / blackHole.mass; 
                    blackHole.mass += asteroids[k].mass;
                    asteroids.splice(k,1);
                    break loop3;
                }
                // into the black hole!
                let distance = Math.sqrt((asteroids[k].x - blackHole.x)**2 + (asteroids[k].y - blackHole.y)**2);
                if ( distance < blackHole.SchwarzsRadius) {
                    if(asteroids[k].level === 1){
                        for (let s = 1; s < 12; s++) {
                            debris.push(new Debris(asteroids[k].x + Math.floor(Math.random() * 3.1 - 1.6), 
                                asteroids[k].y + Math.floor(Math.random() * 3.1 - 1.6), asteroids[k].velX, asteroids[k].velY));    
                        }
                    } else if(asteroids[k].level === 2){
                     for (let s = 1; s < 10; s++) {
                            debris.push(new Debris(asteroids[k].x + Math.floor(Math.random() * 3.1 - 1.6), 
                            asteroids[k].y + Math.floor(Math.random() * 3.1 - 1.6), asteroids[k].velX, asteroids[k].velY));    
                        }
                    } else {
                        for (let s = 1; s < 8; s++) {
                            debris.push(new Debris(asteroids[k].x + Math.floor(Math.random() * 3.1 - 1.6), 
                                asteroids[k].y + Math.floor(Math.random() * 3.1 - 1.6), asteroids[k].velX, asteroids[k].velY));    
                        }
                    }
                    blackHole.mass += asteroids[k].mass;
                    asteroids.splice(k,1);
                    break loop3;
                }                 
            }
            if (ship.visible && game) {
                if(CircleCollision(ship.x, ship.y, 11, asteroids[k].x, asteroids[k].y, asteroids[k].collisionRadius)){
                    // Caclucate new velocities assuming elastic collision or break asteroid and ship if 
                    // the collision energy is high 
                    let velocities = ElasticColission(ship.x, ship.y, ship.velX, ship.velY, ship.mass, 
                        asteroids[k].x, asteroids[k].y, asteroids[k].velX, asteroids[k].velY, asteroids[k].mass);
                    ship.velX = velocities[0];
                    ship.velY = velocities[1];
                    ship.x += ship.velX;
                    ship.y += ship.velY;
                    ship.wear -= Math.floor(velocities[4] / 2);
                    asteroids[k].velX = velocities[2];
                    asteroids[k].velY = velocities[3];
                    asteroids[k].x += velocities[2];
                    asteroids[k].y += velocities[3];
                    if (velocities[4] > ship.wear || ship.wear < 0) {
                        if(asteroids[k].level === 1){
                            asteroids.push(new Asteroid(asteroids[k].x - 10, asteroids[k].y - 10, 15, 2, 13));
                            asteroids.push(new Asteroid(asteroids[k].x + 10, asteroids[k].y + 10, 15, 2, 13));
                            for (let s = 1; s < 7; s++) {
                                debris.push(new Debris(asteroids[k].x, asteroids[k].y, asteroids[k].velX, asteroids[k].velY));    
                            }
                        } else if(asteroids[k].level === 2){
                            asteroids.push(new Asteroid(asteroids[k].x - 8, asteroids[k].y - 8, 8, 3, 6));
                            asteroids.push(new Asteroid(asteroids[k].x + 8, asteroids[k].y + 8, 8, 3, 6));
                            for (let s = 1; s < 6; s++) {
                                debris.push(new Debris(asteroids[k].x, asteroids[k].y, asteroids[k].velX, asteroids[k].velY));    
                            }
                        } else {
                            for (let s = 1; s < 5; s++) {
                                debris.push(new Debris(asteroids[k].x, asteroids[k].y, asteroids[k].velX, asteroids[k].velY));    
                            }
                        }
                        asteroids.splice(k,1);
                        score += 20;
                        for (let s = 1; s < 7; s++) {
                            debris.push(new Debris(ship.x, ship.y, ship.velX, ship.velY));
                        }
                        ship.x = canvasWidth / 2;
                        ship.y = canvasHeight / 2;
                        ship.velX = 0;
                        ship.velY = 0;
                        ship.angle = 0;
                        ship.wear = 500;
                        lives -= 1;
                        break loop3;
                                
                    }    
                }
            }
            // Colission with other asteroids
loop5:
            for (let i=0; i<asteroids.length; i++) {
                if (i == k) {
                    break loop5;
                } else {
                    if(CircleCollision(asteroids[i].x, asteroids[i].y, asteroids[i].collisionRadius, asteroids[k].x, asteroids[k].y, asteroids[k].collisionRadius)){
                        // Caclucate new velocities assuming elastic collision or break any asteroid if 
                        // the collision energy is high 
                        let velocities = ElasticColission(asteroids[i].x, asteroids[i].y, asteroids[i].velX, asteroids[i].velY, asteroids[i].mass, 
                            asteroids[k].x, asteroids[k].y, asteroids[k].velX, asteroids[k].velY, asteroids[k].mass);
                        asteroids[i].velX = velocities[0];
                        asteroids[i].velY = velocities[1];
                        asteroids[i].x += velocities[0];
                        asteroids[i].y += velocities[1];
                        asteroids[k].velX = velocities[2];
                        asteroids[k].velY = velocities[3];
                        asteroids[k].x += velocities[2];
                        asteroids[k].y += velocities[3];
                        if (velocities[4] > asteroids[i].endurance) {
                            asteroids[i].markForBreak = true;
                        }
                        if (velocities[4] > asteroids[k].endurance) {
                            asteroids[k].markForBreak = true;
                        }
                    }
                }
            }          
        }
    }
    
    // Destroy asteroids that were marked for break
    if (asteroids.length !== 0) {
loop6:
        for (let k = 0; k < asteroids.length; k++) {
            if (asteroids[k].markForBreak) {
                if(asteroids[k].level === 1){
                    asteroids.push(new Asteroid(asteroids[k].x - 10, asteroids[k].y - 10, 15, 2, 13));
                    asteroids.push(new Asteroid(asteroids[k].x + 10, asteroids[k].y + 10, 15, 2, 13));
                    for (let s = 1; s < 7; s++) {
                        debris.push(new Debris(asteroids[k].x, asteroids[k].y, asteroids[k].velX, asteroids[k].velY));    
                    }
                } else if(asteroids[k].level === 2){
                    asteroids.push(new Asteroid(asteroids[k].x - 8, asteroids[k].y - 8, 8, 3, 6));
                    asteroids.push(new Asteroid(asteroids[k].x + 8, asteroids[k].y + 8, 8, 3, 6));
                    for (let s = 1; s < 6; s++) {
                        debris.push(new Debris(asteroids[k].x, asteroids[k].y, asteroids[k].velX, asteroids[k].velY));    
                    }
                } else {
                    for (let s = 1; s < 5; s++) {
                        debris.push(new Debris(asteroids[k].x, asteroids[k].y, asteroids[k].velX, asteroids[k].velY));    
                    }
                }
                asteroids.splice(k,1);
                break loop6;
            }
        }
    }

    if (ship.visible) {
        if (blackHole.visible) {
            // Calculate mutual attraction
            let gravAccel = CaclulateAttraction(ship.x, ship.y, ship.mass, blackHole.x, blackHole.y, blackHole.mass);
            ship.velX += gravAccel[0] * Math.sin(gravAccel[1]) / ship.mass;
            ship.velY += gravAccel[0] * Math.cos(gravAccel[1]) / ship.mass; 
            blackHole.velX -= gravAccel[0] * Math.sin(gravAccel[1]) / blackHole.mass;
            blackHole.velY -= gravAccel[0] * Math.cos(gravAccel[1]) / blackHole.mass; 
        }
        ship.Update();
        ship.Draw();
    }

    // Check for collision with bullet and asteroid
    if (asteroids.length !== 0 && bullets.length != 0){
loop1:
        for(let l = 0; l < asteroids.length; l++){
            for(let m = 0; m < bullets.length; m++){
                if(CircleCollision(bullets[m].x, bullets[m].y, 3, asteroids[l].x, asteroids[l].y, asteroids[l].collisionRadius)){
                    // Check if asteroid can be broken into smaller pieces
                    if(asteroids[l].level === 1){
                        asteroids.push(new Asteroid(asteroids[l].x - 10, asteroids[l].y - 10, 15, 2, 13, asteroids[l].velX * Math.random() * 2, 
                            asteroids[l].velY * Math.random() * 2, asteroids[l].direction - 20));
                        asteroids.push(new Asteroid(asteroids[l].x + 10, asteroids[l].y + 10, 15, 2, 13, asteroids[l].velX * Math.random() * 2, 
                            asteroids[l].velY * Math.random() * 2, asteroids[l].direction + 20));
                        for (let s = 1; s < 7; s++) {
                            debris.push(new Debris(asteroids[l].x, asteroids[l].y, asteroids[l].velX, asteroids[l].velY));
                        }
                    } else if(asteroids[l].level === 2){
                        asteroids.push(new Asteroid(asteroids[l].x - 8, asteroids[l].y - 8, 8, 3, 6, asteroids[l].velX * Math.random() * 2, 
                            asteroids[l].velY * Math.random() * 2, asteroids[l].direction - 20));
                        asteroids.push(new Asteroid(asteroids[l].x + 8, asteroids[l].y + 8, 8, 3, 6, asteroids[l].velX * Math.random() * 2, 
                            asteroids[l].velY * Math.random() * 2, asteroids[l].direction + 20));
                        for (let s = 1; s < 6; s++) {
                            debris.push(new Debris(asteroids[l].x, asteroids[l].y, asteroids[l].velX, asteroids[l].velY));
                        }
                    } else {
                        for (let s = 1; s < 5; s++) {
                            debris.push(new Debris(asteroids[l].x, asteroids[l].y, asteroids[l].velX, asteroids[l].velY));
                        }
                    }
                    asteroids.splice(l,1);
                    bullets.splice(m,1);
                    score += 5;
                    // Used to break out of loops because splicing arrays
                    // you are looping through will break otherwise
                    break loop1;
                }
            }
        }
    }
 
    if (bullets.length !== 0) {
loop2:
        for(let i = 0; i < bullets.length; i++) {
            if (blackHole.visible) {
                // Calculate mutual attraction
                let gravAccel = CaclulateAttraction(bullets[i].x, bullets[i].y, bullets[i].mass, blackHole.x, blackHole.y, blackHole.mass);
                bullets[i].velX += gravAccel[0] * Math.sin(gravAccel[1]) / bullets[i].mass;
                bullets[i].velY += gravAccel[0] * Math.cos(gravAccel[1]) / bullets[i].mass; 
                blackHole.velX -= gravAccel[0] * Math.sin(gravAccel[1]) / blackHole.mass;
                blackHole.velY -= gravAccel[0] * Math.cos(gravAccel[1]) / blackHole.mass; 
            }    
            bullets[i].Update();
            bullets[i].Draw();
            if (bullets[i].life < 0) {
                bullets.splice(i,1);
                break loop2;
            }
        }
    }

    if (asteroids.length !== 0) {
        for(let j = 0; j < asteroids.length; j++) {
            asteroids[j].Update();
            // Pass j so we can track which asteroid points
            // to store
            asteroids[j].Draw(j);
        }
    }

    if (debris.length !== 0) {
loop4:
        for(let j = 0; j < debris.length; j++){
            if (blackHole.visible) {
                // Calculate mutual attraction
                let gravAccel = CaclulateAttraction(debris[j].x, debris[j].y, debris[j].mass, blackHole.x, blackHole.y, blackHole.mass);
                debris[j].velX += gravAccel[0] * Math.sin(gravAccel[1]) / debris[j].mass;
                debris[j].velY += gravAccel[0] * Math.cos(gravAccel[1]) / debris[j].mass; 
                blackHole.velX -= gravAccel[0] * Math.sin(gravAccel[1]) / blackHole.mass;
                blackHole.velY -= gravAccel[0] * Math.cos(gravAccel[1]) / blackHole.mass;
                // into the black hole!
                let distance = Math.sqrt((debris[j].x - blackHole.x)**2 + (debris[j].y - blackHole.y)**2);
                if (distance < blackHole.SchwarzsRadius) {
                    blackHole.mass += debris[j].mass;
                    debris.splice(j,1);
                    break loop4;
                }                  
            }
            debris[j].Update();
            // Pass j so we can track which asteroid points
            // to store
            debris[j].Draw();
            if (debris[j].life < 0) {
                debris.splice(j,1);
                break loop4;
            }    
        }
    }

    if (blackHole.visible) {
        blackHole.Update();
        blackHole.Draw();
    }

    // HOMEWORK SOLUTION
    // Updates the high score using local storage
    highScore = Math.max(score, highScore);
    localStorage.setItem(localStorageName, highScore);
    let startY = 100;
    ctx.fillStyle = 'white';
    // Display highscore
    if (game) {
        ctx.font = '21px Arial';
        ctx.fillText("HIGHSCORE : " + highScore.toString(), 20, 100);
        startY += 30;
    } 

    // Display information about ship motion
    ctx.font = '12px Arial';
    if (ship.visible) {
        let velocity = Math.sqrt(ship.velX**2 + ship.velY**2)
        ctx.fillText("Velocity : " + velocity.toFixed(3) + " p/f", 20, 130);
        ctx.fillText("Acceleration : " + ship.acceleration.toString() + " p/f\u00B2" , 20, 145);
        ctx.fillText("Friction : " + ship.friction.toFixed(3) + " p/f\u00B2", 20, 160);
        if (ship.wear < 200) {
            ctx.fillStyle = "red";
            ctx.fillText("Durability : " + ship.wear.toString() + " a.u.", 20, 175);
            ctx.fillStyle = "white";
            startY = 190;
        } else {
            ctx.fillText("Durability : " + ship.wear.toString() + " a.u.", 20, 175);
            startY = 190;
        }
    } else if (game) {
        startY = 130;
    } else {
        startY = 100;
    }
    ctx.fillText("Black Hole M = " + blackHole.mass.toFixed(0), 20, startY);
    ctx.fillText("Friction = " + localFriction.toFixed(4), 20, startY + 15);
    startY += 15; 
        
    // Display inner data for debugging purposes
    if (debFlag) {
        ctx.beginPath();
        ctx.moveTo(20, startY+10);
        ctx.lineTo(120, startY+10);
        ctx.closePath();
        ctx.stroke();
        startY += 25;
        let bhvelocity = Math.sqrt(blackHole.velX**2 + blackHole.velY**2)
        ctx.fillText("Black Hole v = " + bhvelocity.toFixed(3), 20, startY);
        startY +=15;        
        if (asteroids.length !== 0) {
            for(let j = 0; j < asteroids.length; j++) {
                let ystep = 15;
                let velocity = Math.sqrt(asteroids[j].velX**2 + asteroids[j].velY**2);
                ctx.fillText("Asteroid" + j.toString() + " v = "  + velocity.toFixed(3), 20, startY + j * ystep);
            }
        }    
    }
    
    requestAnimationFrame(Render);
}
