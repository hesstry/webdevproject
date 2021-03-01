let simpleLevelPlan = [`
.......................
..#..o...o...o...o..#..
..#.................#..
..#.................#..
..#........@........#..
..###################..`];

const coin_label_unfiltered = ['home', 'about me', 'contact me', 'projects'];

let game_div = document.createElement("div");
game_div.className = "gameDiv";
document.body.appendChild(game_div);

class Vec {
  constructor(x, y) {
    this.x = x; 
    this.y = y;
  }
  plus(other) {
    return new Vec(this.x + other.x, this.y + other.y);
  }
  times(factor) {
    return new Vec(this.x * factor, this.y * factor);
  }
}

class Level {

  constructor(plan) {
  	// map forces all elements in a row to go into their own array
  	// final result is an array of arrays, each row is an array with background values
    let rows = plan.trim().split("\n").map(l => [...l]);
    this.height = rows.length;
    this.width = rows[0].length;
    this.startActors = [];

    // map(current_val, index_curr_val)
    this.rows = rows.map((row, y) => {
      return row.map((ch, x) => {
        let type = levelChars[ch];
        if (typeof type == "string") return type;
        this.startActors.push(
          type.create(new Vec(x, y), ch));
        return "empty";
      });
    });
  }
}

class State {
  constructor(level, actors, status) {
    this.level = level;
    this.actors = actors;
    this.status = status;
  }

  // static methods are called on the class variable itself
  static start(level) {
    return new State(level, level.startActors, "playing");
  }

  // returns the player in the actors array
  get player() {
    return this.actors.find(a => a.type == "player");
  }
}

class Player {
  constructor(pos, speed) {
    this.pos = pos;
    this.speed = speed;
  }

  get type() { return "player"; }

  static create(pos) {
  	// create player half block above @ sign so bottom aligns with bottom of @ sign's square
    return new Player(pos.plus(new Vec(0, -0.5)),
                      new Vec(0, 0));
  }
}
// use prototype since size is same for all players
Player.prototype.size = new Vec(1, 1.5);

// dynamic lava either drips or bounces
// if drip, resets after hitting ground
// if bounce, negate speed when hitting wall

class Lava {
  constructor(pos, speed, reset) {
    this.pos = pos;
    this.speed = speed;
    this.reset = reset;
  }

  get type() { return "lava"; }

  // conditionals needed because lava has three states
  static create(pos, ch) {
    if (ch == "=") {
      return new Lava(pos, new Vec(2, 0));
    } else if (ch == "|") {
      return new Lava(pos, new Vec(0, 2));
    } else if (ch == "v") {
      return new Lava(pos, new Vec(0, 3), pos);
    }
  }
}

Lava.prototype.size = new Vec(1, 1);

// coins contain a wobble to give cool effects
class Coin {
  constructor(pos, basePos, wobble) {
    this.pos = pos;
    this.basePos = basePos;
    this.wobble = wobble;
  }

  get type() { return "coin"; }

  static create(pos) {
    let basePos = pos.plus(new Vec(0.2, 0.1));
    // movement is determined by random curved patterns via sin/cos
    // math.random used to get random starting sequence of its wobble
    return new Coin(basePos, basePos,
                    Math.random() * Math.PI * 2);
  }
}

Coin.prototype.size = new Vec(0.6, 0.6);
// add labels prototype to connect page names with constantly updated coins
Coin.prototype.labels = ['home', 'about me', 'contact me', 'projects'];

const levelChars = {
  ".": "empty", "#": "wall", "+": "lava",
  "@": Player, "o": Coin,
  "=": Lava, "|": Lava, "v": Lava
};

// encapsulation used for the drawing board as to add re-useability
// triple dot notation used in case there are many children not in an array
function elt(name, attrs, ...children) {
  // create element
  let dom = document.createElement(name);
  // set attributes of element
  // attrs is an object that attribute_name: attribute_value format
  for (let attr of Object.keys(attrs)) {
    dom.setAttribute(attr, attrs[attr]);
  }
  // set all children of element 
  for (let child of children) {
    dom.appendChild(child);
  }
  return dom;
}

class DOMDisplay {
  constructor(parent, level) {
    this.dom = elt("div", {class: "game"}, drawGrid(level));
    // actorLayer used to keep track of element that holds the actors for easy trackin/changes
    this.actorLayer = null;
    // child node is the level grid, and parent node is most likely the document body
    parent.appendChild(this.dom);
  }

  clear() { this.dom.remove(); }
}

// scale is with respect to the width of the page so the variable is created each time an 
// actor or grid is drawn

function drawGrid(level) {
  // create table with background class and give units their size, scale x scale squares
  let scale = document.querySelector(".gameDiv").clientWidth/23;
  return elt("table", {
    class: "background",
    style: `width: ${level.width * scale}px;`
    // each level row becomes a table row with scale height
    // triple dot notation used so elt is called for each row and each of the rows elements
  }, ...level.rows.map(row =>
    elt("tr", {style: `height: ${scale}px;`},
    	// map each item in the row and make sure its class correspons to its type, either string or 
    	// the class objects it belongs to
        ...row.map(type => elt("td", {class: type})))
  ));
}

function drawActors(actors) {
  let scale = document.querySelector(".gameDiv").clientWidth/23;
  return elt("div", {}, ...actors.map((actor, actor_ind) => {
  	// for each actor, create a div element with class = actor actor.type
  	// separating classes by a space gives them two classes class:actor, class:actor.type
    let rect = elt("div", {class: `actor ${actor.type}`});
    // apply a text div to each coin for website page labeling
    if (`${actor.type}` == 'coin'){
    	let coin_text = document.createElement('div');
    	coin_text.style.marginTop = '-25px';
    	coin_text.style.fontFamily = '"Lucida Console", "Courier New", monospace'

    	// hard code navigation updating labels

    	if (actor.pos.x == 5.2) coin_text.textContent = actor.labels[0];
    	else if (actor.pos.x == 9.2) coin_text.textContent = actor.labels[1];
    	else if (actor.pos.x == 13.2) coin_text.textContent = actor.labels[2];
    	else if (actor.pos.x == 17.2) coin_text.textContent = actor.labels[3];
    	coin_text.style.fontSize = 'small';
    	rect.appendChild(coin_text);
    }
    // make sure player goes above the carousel
    if (`${actor.type}` == 'player') {rect.style.zIndex = 2};
    // scale everything so that we get our actor scales to match the background scale
    rect.style.width = `${actor.size.x * scale}px`;
    rect.style.height = `${actor.size.y * scale}px`;
    rect.style.left = `${actor.pos.x * scale}px`;
    rect.style.top = `${actor.pos.y * scale}px`;
    return rect;
  }));
}

// syncState uses to display a given state
// removes old actors and redraws them, inexpensive since we don't have a lot of actors
DOMDisplay.prototype.syncState = function(state) {
  // redraw grid in case resizing is needed
  let background_parent = this.dom.parentElement;
  let resized = elt("div", {class: "game"}, drawGrid(state.level));
  background_parent.replaceChild(resized, this.dom);
  this.dom = resized;
  // remove all actors
  if (this.actorLayer) this.actorLayer.remove();
  // update actor layer to redraw all of them
  // make sure first actorLayer only has non-current page coins
  let removed_current_page_coin = null;
  if (current_page === 'home'){
    removed_current_page_coin = state.actors.slice(1);
  }
  else if (current_page === 'aboutme'){
    removed_current_page_coin = state.actors.slice(0,1).concat(state.actors.slice(2));
  }
  else if (current_page === 'contactme'){
    removed_current_page_coin = state.actors.slice(0,2).concat(state.actors.slice(3));
  }
  else if (current_page === 'projects'){
    removed_current_page_coin = state.actors.slice(0,3).concat(state.actors.slice(4));
  }
  this.actorLayer = drawActors(removed_current_page_coin);
  // append actor layer to the DOM
  this.dom.appendChild(this.actorLayer);
  // update className to game and to state.status, win or lose
  this.dom.className = `game ${state.status}`;
  this.scrollPlayerIntoView(state);
};

// find players positions and update wrapping elements scroll position
// change by manipulating elements scrollLeft and scrollTop when player
// too close to edge

DOMDisplay.prototype.scrollPlayerIntoView = function(state) {
  let scale = document.querySelector(".gameDiv").clientWidth/23;
  let width = this.dom.clientWidth;
  let height = this.dom.clientHeight;
  let margin = width / 3;

  // The viewport
  // scrollLeft = number of pixel from left to be scrolled
  let left = this.dom.scrollLeft
  let right = left + width;
  // scroll top = number of pixel from top to be scrolled
  let top = this.dom.scrollTop
  let bottom = top + height;

  let player = state.player;
  // pos = top left corner, add size * .5
  let center = player.pos.plus(player.size.times(0.5))
                         .times(scale);

  // scroll left if were too far left from center of screen
  if (center.x < left + margin) {
    this.dom.scrollLeft = center.x - margin;
  } 
  // scroll right if too far right
  else if (center.x > right - margin) {
    this.dom.scrollLeft = center.x + margin - width;
  }
  // scroll down if too low on screen
  if (center.y < top + margin) {
    this.dom.scrollTop = center.y - margin;
  } 
  // scroll up if too high on screen
  else if (center.y > bottom - margin) {
    this.dom.scrollTop = center.y + margin - height;
  }
};

Level.prototype.touches = function(pos, size, type) {
  // flooring and ceiling the values gives the background square grids 
  // that sandwich the actor this gives a small set of squares to loop 
  // over and determine the actors possible moves
  let xStart = Math.floor(pos.x);
  let xEnd = Math.ceil(pos.x + size.x);
  let yStart = Math.floor(pos.y);
  let yEnd = Math.ceil(pos.y + size.y);

  // return true when a matching square is found
  // this helps us determine if the actor is touching a 
  // specified type of block
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      let isOutside = x < 0 || x >= this.width ||
                      y < 0 || y >= this.height;
      let here = isOutside ? "wall" : this.rows[y][x];
      if (here == type) return true;
    }
  }
  return false;
};

// State.update used for key controls for the player
// Losing a game via lava touhcing
// Coin grabbing for touching coins
// time step and pressed keys are passed
State.prototype.update = function(time, keys) {
  let actors = this.actors
  	// actors also get this (current state) so they can base update on same values as State class
    .map(actor => actor.update(time, this, keys));
  // newState = current state
  let newState = new State(this.level, actors, this.status);

  // no need to update if playing isnt true
  if (newState.status != "playing") return newState;

  // return once lost state is reached since nothing else should be processed
  let player = newState.player;
  if (this.level.touches(player.pos, player.size, "lava")) {
    return new State(this.level, actors, "lost");
  }

  // if player overlaps with lava or coin, returns true when they touch
  // overlapping occurs when they overlap along x and y axis
  for (let actor of actors) {
    if (actor != player && overlap(actor, player)) {
      // each actor will have its own collide method that has different functionality
      newState = actor.collide(newState);
    }
  }
  return newState;
};

function overlap(actor1, actor2) {
  return actor1.pos.x + actor1.size.x > actor2.pos.x &&
         actor1.pos.x < actor2.pos.x + actor2.size.x &&
         actor1.pos.y + actor1.size.y > actor2.pos.y &&
         actor1.pos.y < actor2.pos.y + actor2.size.y;
}

// lose the moment you touch lava
Lava.prototype.collide = function(state) {
  return new State(state.level, state.actors, "lost");
};

// this takes advantage of the fact that the coin x positions don't change
Coin.prototype.collide = function(state) {
  // once a coin is touched, filter out actors list so the touched coin is deleted
  let filtered_coins = this.coinHistory.filter(a => a.pos.x != this.pos.x);

  // if this is the first collision, replace four coins with three
  let player = state.actors[state.actors.length-1];
  let new_actors = filtered_coins.concat(player);

  // save the removed coin to all coin instances so that we can put it back in once a different
  // coin is selected
  Coin.prototype.removed = this;

  let temp_form = document.createElement("form");

  temp_form.setAttribute("method", "get");
  
  if (this.pos.x == 5.2){
    temp_form.setAttribute("action", "/");
  }
  else if (this.pos.x == 9.2) {
    temp_form.setAttribute("action", "/aboutme");
  }
  else if (this.pos.x == 13.2) {
    temp_form.setAttribute("action", "/contactme");
  }
  else if (this.pos.x == 17.2) {
    temp_form.setAttribute("action", "/projects");
  };

  document.body.appendChild(temp_form);

  temp_form.submit();

	let status = state.status;

	return new State(state.level, new_actors, status);
  	};

Lava.prototype.update = function(time, state) {
  // start off by updating position by movement speed*time passes
  let newPos = this.pos.plus(this.speed.times(time));
  // determine updated state by touches method
  // if no touching, Lava = lava with new position
  if (!state.level.touches(newPos, this.size, "wall")) {
    return new Lava(newPos, this.speed, this.reset);
  } 
  // if touching then reset it if it has a reset parameter, dripping lava
  else if (this.reset) {
    return new Lava(this.reset, this.speed, this.reset);
  } 
  // bounce if it hits a wall
  else {
    return new Lava(this.pos, this.speed.times(-1));
  }
};

const wobbleSpeed = 8, wobbleDist = 0.07;

// tracks time and uses sin function to give a period of vertical back-and-forth motion
Coin.prototype.update = function(time) {
  let wobble = this.wobble + time * wobbleSpeed;
  let wobblePos = Math.sin(wobble) * wobbleDist;
  return new Coin(this.basePos.plus(new Vec(0, wobblePos)),
                  this.basePos, wobble);
};

const playerXSpeed = 7;
const gravity = 30;
const jumpSpeed = 17;

Player.prototype.update = function(time, state, keys) {
  let xSpeed = 0;
  // only update new x position if not touching a wall based on movedX
  if (keys.ArrowLeft){
  	xSpeed -= playerXSpeed;
  }
  if (keys.ArrowRight){
  	xSpeed += playerXSpeed;
  }
  let pos = this.pos;
  let movedX = pos.plus(new Vec(xSpeed * time, 0));
  if (!state.level.touches(movedX, this.size, "wall")) {
    pos = movedX;
  }

  let ySpeed = this.speed.y + time * gravity;
  let movedY = pos.plus(new Vec(0, ySpeed * time));
  // if not touching a wall, then make the position change
  if (!state.level.touches(movedY, this.size, "wall")) {
    pos = movedY;
  } 
  // this is when you jump and you're touching the ground
  else if (keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed;
  } 
  // y speed is 0 if not jumping or moving in the air
  else {
    ySpeed = 0;
  }
  return new Player(pos, new Vec(xSpeed, ySpeed));
};

// key handler
function trackKeys(keys) {
  let down = Object.create(null);
  function track(event) {
    if (keys.includes(event.key)) {
      down[event.key] = event.type == "keydown";
      event.preventDefault();
    }
  }
  window.addEventListener("keydown", track);
  window.addEventListener("keyup", track);
  return down;
}

const arrowKeys =
  trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);

// need requestAnimationFrame to be called constantly, so make a method to do that for us
function runAnimation(frameFunc) {
  let lastTime = null;
  function frame(time) {
    if (lastTime != null) {
      // make minimum timeStep = 1/10 of a second to reduce unwanted effects
      let timeStep = Math.min(time - lastTime, 100) / 1000;
      if (frameFunc(timeStep) === false) return;
    }
    lastTime = time;
    // keeps calling as long as frameFunc(timeStamp) != false
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

State.prototype.displayActors = function(){
	console.log(this.actors);
}

State.prototype.setCoinHistory = function(){
	let coins = this.actors.filter(a => a.wobble);
	Coin.prototype.coinHistory = coins;
	console.log(Coin.prototype.coinHistory);
}

function runLevel(level, Display) {
  let display = new Display(game_div, level);
  let x = "TOTAL WIDTH: " + screen.width;
  console.log(x);
  let state = State.start(level);
  state.displayActors();
  state.setCoinHistory();

  let ending = 1;
  return new Promise(resolve => {
    runAnimation(time => {
      state = state.update(time, arrowKeys);
      display.syncState(state);
      if (state.status == "playing") {
        return true;
      } else if (ending > 0) {
        ending -= time;
        return true;
      } else {
        display.clear();
        resolve(state.status);
        return false;
      }
    });
  });
}

async function runGame(plans, Display) {
  for (let level = 0; level < plans.length;) {
    let status = await runLevel(new Level(plans[level]),
                                Display);
    if (status == "won") level++;
  }
  console.log("You've won!");
}

let welcome = document.createElement("h1");

welcome.setAttribute('class', 'directions');

welcome.textContent = "Use Arrow Keys To Move and Jump: <-, ^, ->";

runGame(simpleLevelPlan, DOMDisplay);

document.body.prepend(welcome);