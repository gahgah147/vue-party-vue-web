import { Animation, Color3, CubicEase, EasingFunction, QuarticEase, Quaternion, Vector3 } from '@babylonjs/core';
import { defaults, flow, get, fill } from 'lodash-es';

export interface CreateAnimationOption {
  /** 總幀數
   * @default 60
   */
  frameRate?: number;
  /** 播放倍數
   * @default 1
   */
  speedRatio?: number;
  /** @default CubicEase */
  easingFunction?: EasingFunction;
}

const defaultEasingFunction = new CubicEase();
defaultEasingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

const defaultCreateAnimationOption: Required<CreateAnimationOption> = {
  frameRate: 60,
  speedRatio: 1,
  easingFunction: defaultEasingFunction,
}

/** 建立從目前狀態至目標狀態的動畫
 * 
 * @param target 目標物件
 * @param property 過度的目標屬性
 * @param to 目標狀態
 * @param option 參數
 * @returns 
 */
export function createAnimation(
  target: any,
  property: string,
  to: number | Vector3 | Color3 | Quaternion,
  option?: CreateAnimationOption
) {
  const {
    frameRate, speedRatio, easingFunction,
  } = defaults(option, defaultCreateAnimationOption);

  const keys = [
    {
      frame: 0, value: get(target, property),
    },
    {
      frame: frameRate, value: to,
    },
  ];

  let animationType = Animation.ANIMATIONTYPE_FLOAT;
  if (typeof to === 'number') {
    animationType = Animation.ANIMATIONTYPE_FLOAT
  } else if (to instanceof Vector3) {
    animationType = Animation.ANIMATIONTYPE_VECTOR3
  } else if (to instanceof Color3) {
    animationType = Animation.ANIMATIONTYPE_COLOR3
  } else if (to instanceof Quaternion) {
    animationType = Animation.ANIMATIONTYPE_QUATERNION
  }

  const animation = Animation.CreateAnimation(
    property,
    animationType,
    frameRate * speedRatio,
    easingFunction
  );
  animation.setKeys(keys);
  return { animation, frameRate };
}


const playerColorNames = [
  'red', 'deep-purple', 'light-blue',
  'green', 'amber', 'deep-orange',
  'blue-grey', 'brown',
];

/** 取得玩家顏色 */
export function getPlayerColor({ codeName }: { codeName: string }) {
  if (!codeName.includes('P')) {
    return 'grey';
  }

  try {
    const index = parseInt(codeName.replaceAll('P', ''), 10) - 1;
    return playerColorNames?.[index] ?? 'grey';
  } catch (error) {
    return 'grey';
  }
}

/** 取得指定數量方形矩陣，可用於排列登場角色
 * 
 * @param gap 間距
 * @param length 數量
 * @param origin 座標原點，預設 new Vector3(0, 0, 0)
 * @param plane 排列平面，預設 xz 平面
 */
export function getSquareMatrixPositions(
  gap: number,
  length: number,
  origin = new Vector3(0, 0, 0),
  plane: 'xy' | 'xz' | 'yz' = 'xz'
) {
  /** 最大 col 為 length 開根號後無條件進位 */
  const maxCol = Math.ceil(Math.sqrt(length));
  /** 最大 row 為 length 除以 maxCol 後無條件進位 */
  const maxRow = Math.ceil(length / maxCol);

  /** flow 可以依序執行指定的 function */
  const result: Vector3[] = flow([
    /** 產生指定長度的 0 矩陣 */
    () => fill(Array(length), 0),

    /** 依序計算每個座標位置  */
    (array: number[]) => {
      return array.map((value, index) => {
        /** 根據 index 取得對應 col、row */
        const col = index % maxCol;
        const row = Math.floor(index / maxCol);

        // 根據指定的平面計算座標
        switch (plane) {
          case 'xy':
            return new Vector3(col * gap, row * gap, 0);
          case 'yz':
            return new Vector3(0, col * gap, row * gap);
          case 'xz': default:
            return new Vector3(col * gap, 0, row * gap);
        }
      });
    },

    /** 將目前中心點平移至目前原點  */
    (positions: Vector3[]) => {
      /** -1 是因為偏移量要從 0 開始算 */
      const currentCenter = new Vector3((maxCol - 1) * gap / 2, 0, (maxRow - 1) * gap / 2);
      return positions.map((position) => position.subtract(currentCenter));
    },

    /** 將目前中心點平移至指定 origin */
    (positions: Vector3[]) => positions.map((position) => position.add(origin)),
  ])();

  return result;
}

/** 將 value 從 a 範圍映射至 b 範圍 */
export function mapRange(
  value: number,
  aMin: number, aMax: number,
  bMin: number, bMax: number
) {
  return bMin + ((value - aMin) * (bMax - bMin)) / (aMax - aMin);
}


