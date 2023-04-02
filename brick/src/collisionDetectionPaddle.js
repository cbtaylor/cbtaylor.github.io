export function detectCollisionPaddle(ball, gameObject) {
  let bottomOfBall = ball.position.y + ball.size;
  let leftOfBall = ball.position.x;
  let hitPosition = 0;

  let topOfObject = gameObject.position.y;
  let leftSideOfObject = gameObject.position.x;
  let rightSideOfObject = gameObject.position.x + gameObject.width;

  if (
    bottomOfBall >= topOfObject &&
    ball.position.x + ball.size >= leftSideOfObject &&
    ball.position.x <= rightSideOfObject
  ) {
    hitPosition = leftOfBall - leftSideOfObject;
    if (hitPosition <= 20) {
      return 1;
    } else if (hitPosition > 20 && hitPosition <= 50) {
      return 2;
    } else if (hitPosition > 50 && hitPosition <= 75) {
      return 3;
    } else if (hitPosition > 75 && hitPosition <= 100) {
      return 4;
    } else if (hitPosition > 100 && hitPosition <= 130) {
      return 5;
    } else if (hitPosition >= 130) {
      return 6;
    }
  }
}
