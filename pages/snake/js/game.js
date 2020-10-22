class Vec {
  constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
  }
}

class Rect { 
  constructor(w, h) {
      this.pos = new Vec;
      this.size = new Vec(w, h);
  }
}

class Snake extends Rect {
  constructor(w, h) {
      super(w, h);
      this.vel = new Vec;
      this.direction = new Vec;
      this.currentTailSize = 0;
      this.currentSegment = -1;
      this.maxTailSize = 10;
      this.tail = [];
  }

  addTailSegment() {
      this.currentSegment++;
      this.currentTailSize++;
      this.tail.push(new Rect(this.size.x, this.size.y));
  }
  
  setPosition(coordinate, position) {
      this.pos[coordinate] = position;
  }

  setTailSegmentPosition(segment, coordinate, position) {
      this.tail[segment].pos[coordinate] = position;
  }

  changeMovementDirection(movement) {
      switch(movement) {
          case 'up':
              this.direction.y = -1;
              this.direction.x = 0;
              break;
          case 'down':
              this.direction.y = 1;
              this.direction.x = 0;
              break;
          case 'left':
              this.direction.x = -1;
              this.direction.y = 0;
              break;
          case 'right':
              this.direction.x = 1;
              this.direction.y = 0;
              break;
          default:
              throw new Error('Inappropriate value');
      }
  }
}

class Food extends Rect {
  constructor(size, canvasWidth, canvasHeight, cellSize) {
      super(size, size);
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      this._cellSize = cellSize;
  }

  _getRandomInt(min, max, num) {
      return Math.floor(Math.floor(Math.random() * (max - min) + min) / num) * num;
  }

  generateRandomPos() {
      // this.pos.x = 0;
      // this.pos.y = 0;
      this.pos.x = this._getRandomInt(0, this.canvasWidth - this.size.x, this._cellSize);
      this.pos.y = this._getRandomInt(0, this.canvasHeight - this.size.y, this._cellSize);
  }
}

class Game {
  constructor() {
      this._canvas = document.querySelector('#canvas');
      this._ctx = this._canvas.getContext('2d');
      this._canvasWidth = this._canvas.width;
      this._canvasHeight = this._canvas.height;
      this.over = false;

      this.snake = new Snake(10, 10);
      this.food = new Food(this.snake.size.x, this._canvasWidth, this._canvasHeight, 10);
      
      this.snakeVelocity = 10;
      this.stepDelay = 100;
      
      this.snake.vel.x = this.snakeVelocity;
      this.snake.vel.y = this.snakeVelocity;

      this.start = () => {
          if(!this.over) {
              this.update();
              setTimeout(() => {
                  window.requestAnimationFrame(this.start)
              }, this.stepDelay);
          } else {
              this.showGameOverText() 
          }
      }
  }

  draw() {
      this._ctx.fillStyle = '#000';
      this._ctx.fillRect(0, 0, this._canvasWidth, this._canvasHeight);
      
      this._ctx.fillStyle = '#fff';
      this._ctx.fillRect(this.snake.pos.x, this.snake.pos.y, this.snake.size.x, this.snake.size.y);    
      
      this.drawSnakeTail();
      // this.showGrid();
      this._ctx.fillStyle = '#30e861';
      this._ctx.fillRect(this.food.pos.x, this.food.pos.y, this.food.size.x, this.food.size.y);
  }
  
  drawSnakeTail() {
      this.snake.tail.forEach((segment) => {
          this._ctx.fillStyle = '#fff';
          this._ctx.fillRect(segment.pos.x, segment.pos.y, segment.size.x, segment.size.y);
      })
  }

  moveTailTo(direction) {
      this.tailDelay = 0;
      this.snake.tail.forEach((segment, i) => {
          setTimeout(() => {
              switch(direction) {
                  case 'left':
                      segment.pos.x -= this.snake.vel.x;
                      break;
                  case 'right':
                      segment.pos.x += this.snake.vel.x;
                      break;
                  case 'top':
                      segment.pos.y -= this.snake.vel.y;
                      break;
                  case 'bottom':    
                      segment.pos.y += this.snake.vel.y;
                      break;
                  case 'leftEdge':
                      segment.pos.x = this._canvasWidth;
                      break;
                  case 'rightEdge':
                      segment.pos.x = -this.snake.size.x;
                      break;
                  case 'topEdge':
                      segment.pos.y = -this.snake.size.y;
                      break;
                  case 'bottomEdge':
                      segment.pos.y = this._canvasHeight;
                      break;
                  default:
                      return;
              }
          }, this.tailDelay += this.stepDelay);
      });
  }

  moveSnakeTo(direction) {
      switch(direction) {
          case 'right':
              this.snake.pos.x += this.snake.vel.x;
              break;
          case 'left':
              this.snake.pos.x -= this.snake.vel.x;
              break;
          case 'top':
              this.snake.pos.y -= this.snake.vel.y;
              break;
          case 'bottom':
              this.snake.pos.y += this.snake.vel.y;
              break;
          default:
              break;
      }
  }

  edgeToEdgeMovement() {
      if(this.snake.pos.x > this._canvasWidth - this.snake.size.x && this.snake.direction.x === 1) {
          this.snake.setPosition('x', -this.snake.size.x);
          this.moveTailTo('rightEdge');
      } else if(this.snake.pos.x < 0 && this.snake.direction.x === -1) {
          this.snake.setPosition('x', this._canvasWidth);
          this.moveTailTo('leftEdge');
      } else if(this.snake.pos.y > this._canvasHeight - this.snake.size.y && this.snake.direction.y === 1) {
          this.snake.setPosition('y', -this.snake.size.y);
          this.moveTailTo('topEdge');
      } else if(this.snake.pos.y < 0 && this.snake.direction.y === -1) {
          this.snake.setPosition('y', this._canvasHeight);
          this.moveTailTo('bottomEdge');
      } else {
          return null;
      }
  }

  controlSnakeMovement() {
      if(Math.sign(this.snake.direction.x) === 1) {
          this.moveSnakeTo('right');
          this.moveTailTo('right');
      } else if(Math.sign(this.snake.direction.x) === -1) {
          this.moveSnakeTo('left');
          this.moveTailTo('left');
      } else if(Math.sign(this.snake.direction.y) === 1) {
          this.moveSnakeTo('bottom');
          this.moveTailTo('bottom');
      } else if(Math.sign(this.snake.direction.y) === -1) {
          this.moveSnakeTo('top');
          this.moveTailTo('top');
      }
  }

  update() {
      this.edgeToEdgeMovement();
      this.controlSnakeMovement();

      if(!this.defineCollisionWithFood()) {
          this.defineCollisionWithSnake();
      } else {
          this.defineCollisionWithFood()
      }
      
      this.draw();
  }

  defineCollisionWithFood() {
      if(this.snake.pos.x === this.food.pos.x && this.snake.pos.y === this.food.pos.y) {
          this.snake.addTailSegment();
          this.snake.setTailSegmentPosition(this.snake.currentSegment, 'x', this.snake.pos.x);
          this.snake.setTailSegmentPosition(this.snake.currentSegment, 'y', this.snake.pos.y);
          this.food.generateRandomPos();
          return true;
      } else {
          return false;
      }
  }

  defineCollisionWithSnake() {
      let tail = this.snake.tail;
      for(let i = 0; i < tail.length; i++) {
          if((this.snake.pos.x === tail[i].pos.x && this.snake.pos.y === tail[i].pos.y)) {
              console.log('Game over!');
              this.over = true;
          }
      }
  }

  //Decore methods
  showGrid() {
      this.rows = this._canvasWidth / this.snakeVelocity;
      this.cols = this._canvasHeight / this.snakeVelocity;

      const createRows = () => {
          for(let i = 0; i < this._canvasHeight; i += this.snakeVelocity) {
              this._ctx.beginPath();
              this._ctx.moveTo(0, i);
              this._ctx.lineTo(this._canvasWidth, i);
              this._ctx.strokeStyle = 'red';
              this._ctx.stroke();
          }
      }
      
      const createCols = () => {
          for(let i = 0; i < this._canvasWidth; i += this.snakeVelocity) {
              this._ctx.beginPath();
              this._ctx.moveTo(i, 0);
              this._ctx.lineTo(i, this._canvasHeight);
              this._ctx.strokeStyle = 'red'
              this._ctx.stroke();
          }
      }

      createRows();
      createCols();
  }

  showGameOverText() {
      const textSize = 40;
      const fontFamily = 'Arial'
      const text = 'Game Over!';
      this._ctx.fillStyle = 'red';
      this._ctx.font = `${textSize}px ${fontFamily}`;
      this._ctx.fillText(text, this._canvasWidth / 2 - Math.ceil(this._ctx.measureText(text).width / 2), this._canvasHeight / 2 + Math.ceil(textSize / 3));
  }

  restart() {
      if(this.over) {
          this.over = false;
          this.snake.tail = [];
          this.snake.setPosition('x', 0);
          this.snake.setPosition('y', 0);
          this.snakeVelocity = 10;
          this.snake.direction = new Vec;
          this.snake.currentTailSize = 0;
          this.snake.currentSegment = -1;
          this.snake.maxTailSize = 10;
          
          this.food.generateRandomPos();
          this.start()
      }
  }
}

const game = new Game;
game.food.generateRandomPos();
game.start();

const restartBtn = document.querySelector('.restart');

document.addEventListener('keypress', (event) => {
  switch(event.code) {
      case 'KeyW': //w
          game.snake.changeMovementDirection('up');
          break;
      case 'KeyS': //s
          game.snake.changeMovementDirection('down');
          break;
      case 'KeyA': //a
          game.snake.changeMovementDirection('left');
          break;
      case 'KeyD': //d
          game.snake.changeMovementDirection('right');
          break;
      default:
          break;
  }
});

restartBtn.addEventListener('click', (event) => {
  game.restart();
})