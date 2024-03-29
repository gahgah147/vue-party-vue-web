import { defaults } from 'lodash-es';
import {
  ArcRotateCamera,
  Engine, HemisphericLight, Scene, Vector3,
} from '@babylonjs/core';
import { onBeforeUnmount, onMounted, ref } from 'vue';

interface UseBabylonSceneParams {
  createEngine?: (canvas: HTMLCanvasElement) => Engine;
  createScene?: (engine: Engine) => Scene;
  createCamera?: (scene: Scene) => ArcRotateCamera;
  init?: (params: {
    canvas: HTMLCanvasElement;
    engine: Engine;
    scene: Scene;
    camera: ArcRotateCamera;
  }) => Promise<void>;
}
const defaultParams: Required<UseBabylonSceneParams> = {
  createEngine(canvas) {
    return new Engine(canvas, true);
  },
  createScene(engine) {
    const scene = new Scene(engine);
    /** 使用預設光源 */
    scene.createDefaultLight();
    const defaultLight = scene.lights.at(-1);
    if (defaultLight instanceof HemisphericLight) {
      defaultLight.direction = new Vector3(0.5, 1, 0);
    }

    return scene;
  },
  createCamera(scene: Scene) {
    const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 4,
      34,
      new Vector3(0, 0, 2),
      scene
    );

    return camera;
  },
  init: () => Promise.resolve(),
}

export function useBabylonScene(params?: UseBabylonSceneParams) {
  const canvas = ref<HTMLCanvasElement>();

  let engine: Engine | undefined;
  let scene: Scene | undefined;
  let camera: ArcRotateCamera | undefined;

  const {
    createEngine, createScene, createCamera, init
  } = defaults(params, defaultParams);

  onMounted(async () => {
    if (!canvas.value) {
      console.error('無法取得 canvas DOM');
      return;
    }
    engine = createEngine(canvas.value);
    scene = createScene(engine);
    camera = createCamera(scene);

    window.addEventListener('resize', handleResize);

    /** 反覆渲染場景，這樣畫面才會持續變化 */
    engine.runRenderLoop(() => {
      scene?.render();
    });

    await init({
      canvas: canvas.value, engine, scene, camera,
    });
  });

  onBeforeUnmount(() => {
    engine?.dispose();
    window.removeEventListener('resize', handleResize);
  });

  function handleResize() {
    engine?.resize();
  }

  return {
    canvas,
    engine,
    scene,
    camera,
  }
}