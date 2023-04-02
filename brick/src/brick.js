import { detectCollision } from "./collisionDetection";
export default class Brick {
  constructor(game, position, str) {
    this.image3 = document.getElementById("img_brick3");
    this.image2 = document.getElementById("img_brick2");
    this.image1 = document.getElementById("img_brick");
    this.game = game;
    this.position = position;
    this.width = 80;
    this.height = 24;
    this.str = str;
    this.markedForDeletion = false;
  }
  update() {
    switch (detectCollision(this.game.ball, this)) {
      case 1:
        this.game.ball.speed.y = -this.game.ball.speed.y;
        if (this.str <= 1) {
          this.markedForDeletion = true;
        } else {
          this.str--;
        }
        break;
      case 2:
        this.game.ball.speed.x = -this.game.ball.speed.x;
        if (this.str <= 1) {
          this.markedForDeletion = true;
        } else {
          this.str--;
        }
        break;
    }
  }
  draw(ctx) {
    switch (this.str) {
      case 1:
        ctx.drawImage(
          this.image1,
          this.position.x,
          this.position.y,
          this.width,
          this.height
        );
        break;

      case 2:
        ctx.drawImage(
          this.image2,
          this.position.x,
          this.position.y,
          this.width,
          this.height
        );
        break;

      case 3:
        ctx.drawImage(
          this.image3,
          this.position.x,
          this.position.y,
          this.width,
          this.height
        );
        break;
    }
  }
}
