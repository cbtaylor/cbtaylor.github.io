export function detectCollision(ball, gameObject) {
  let bottomOfBall = ball.position.y + ball.size;
  let topOfBall = ball.position.y;
  let leftSideOfBall = ball.position.x;
  let rightSideOfBall = ball.position.x + ball.size;

  let topOfObject = gameObject.position.y;
  let leftSideOfObject = gameObject.position.x;
  let rightSideOfObject = gameObject.position.x + gameObject.width;
  let bottomOfObject = gameObject.position.y + gameObject.height;

  if (
    bottomOfBall >= topOfObject &&
    topOfBall <= bottomOfObject &&
    rightSideOfBall >= leftSideOfObject &&
    leftSideOfBall <= rightSideOfObject
  ) {
    if (
      (ball.speed.x >= 0 &&
        ball.speed.y < 0 &&
        bottomOfObject - topOfBall < rightSideOfBall - leftSideOfObject) ||
      (ball.speed.x <= 0 &&
        ball.speed.y < 0 &&
        bottomOfObject - topOfBall < rightSideOfObject - leftSideOfBall) ||
      (ball.speed.x >= 0 &&
        ball.speed.y > 0 &&
        bottomOfBall - topOfObject < rightSideOfBall - leftSideOfObject) ||
      (ball.speed.x <= 0 &&
        ball.speed.y > 0 &&
        bottomOfBall - topOfObject < rightSideOfObject - leftSideOfBall)
    ) {
      console.log("caso Y");
      return 1;
    } else if (
      (ball.speed.x > 0 &&
        ball.speed.y <= 0 &&
        bottomOfObject - topOfBall > rightSideOfBall - leftSideOfObject) ||
      (ball.speed.x < 0 &&
        ball.speed.y <= 0 &&
        bottomOfObject - topOfBall > rightSideOfObject - leftSideOfBall) ||
      (ball.speed.x > 0 &&
        ball.speed.y >= 0 &&
        bottomOfBall - topOfObject > rightSideOfBall - leftSideOfObject) ||
      (ball.speed.x < 0 &&
        ball.speed.y >= 0 &&
        bottomOfBall - topOfObject > rightSideOfObject - leftSideOfBall)
    ) {
      console.log("caso X");
      return 2;
    }
  }
}
