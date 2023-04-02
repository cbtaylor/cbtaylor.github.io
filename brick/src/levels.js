import Brick from "/src/brick";

export function buildLevel(game, level) {
  let bricks = [];

  level.forEach((row, rowIndex) => {
    row.forEach((brick, brickIndex) => {
      switch (brick) {
        case 1:
          let position = {
            x: 80 * brickIndex,
            y: 75 + 24 * rowIndex
          };
          let str = 1;
          bricks.push(new Brick(game, position, str));
          break;

        case 2:
          position = {
            x: 80 * brickIndex,
            y: 75 + 24 * rowIndex
          };
          str = 2;
          bricks.push(new Brick(game, position, str));
          break;

        case 3:
          position = {
            x: 80 * brickIndex,
            y: 75 + 24 * rowIndex
          };
          str = 3;
          bricks.push(new Brick(game, position, str));
          break;
      }
    });
  });
  return bricks;
}

export const level1 = [
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

export const level2 = [
  [3, 0, 0, 2, 2, 2, 2, 0, 0, 3],
  [1, 3, 0, 0, 2, 2, 0, 0, 3, 1],
  [1, 1, 3, 0, 0, 0, 0, 3, 1, 1],
  [1, 1, 1, 3, 0, 0, 3, 1, 1, 1],
  [1, 1, 1, 3, 0, 0, 3, 1, 1, 1],
  [1, 1, 1, 3, 0, 0, 3, 1, 1, 1],
  [1, 1, 3, 0, 0, 0, 0, 3, 1, 1],
  [1, 3, 0, 0, 2, 2, 0, 0, 3, 1],
  [3, 0, 0, 2, 2, 2, 2, 0, 0, 3]
];
