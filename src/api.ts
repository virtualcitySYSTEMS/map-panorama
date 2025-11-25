import type { Ref } from 'vue';
import { reactive, ref, watch } from 'vue';
import {
  createToggleAction,
  ToolboxType,
  type VcsAction,
  type VcsUiApp,
  WindowSlot,
} from '@vcmap/ui';
import {
  PanoramaDatasetLayer,
  PanoramaMap,
  PanoramaOverlayMode,
} from '@vcmap/core';
import { Color } from '@vcmap-cesium/engine';
import PanoramaComponent from './panoramaComponent.vue';
import { name } from '../package.json';
import depthSvgString from '../plugin-assets/depth.svg?raw';
import settingsSvgString from '../plugin-assets/settings.svg?raw';
import toggleSvgString from '../plugin-assets/layerVisibility.svg?raw';

const settingsIcon = `svgString:${settingsSvgString}`;
const depthIcon = `svgString:${depthSvgString}`;
const toggleIcon = `svgString:${toggleSvgString}`;

export function setupToolbox(app: VcsUiApp): () => void {
  const { action, destroy: destroyAction } = createToggleAction(
    {
      name: 'panorama',
      title: 'panorama.title',
      icon: settingsIcon,
    },
    {
      id: 'panorama',
      slot: WindowSlot.DYNAMIC_RIGHT,
      component: PanoramaComponent,
      state: {
        headerTitle: 'panorama.title',
        headerIcon: settingsIcon,
        infoUrlCallback: app.getHelpUrlCallback('tools/panoramaTool.html'),
      },
    },
    app.windowManager,
    name,
  );

  const toolbox = app.toolboxManager.add(
    { action, type: ToolboxType.SINGLE },
    name,
  );

  const setActiveMap = (): void => {
    action.disabled = !(app.maps.activeMap instanceof PanoramaMap);
  };
  const mapListener = app.maps.mapActivated.addEventListener(setActiveMap);
  setActiveMap();

  return (): void => {
    destroyAction();
    app.toolboxManager.remove(toolbox.id);
    mapListener();
  };
}

export function createLayerTypesAction(app: VcsUiApp): {
  action: VcsAction;
  destroy: () => void;
} {
  let defaultLayerTypes = PanoramaMap.getDefaultOptions().layerTypes!;
  let panoramaMap: PanoramaMap | undefined;
  let layerTypeListener = (): void => {};

  const action = reactive<VcsAction>({
    name: 'panorama.toggleLayers',
    title: 'panorama.toggleLayers',
    icon: toggleIcon,
    active: false,
    disabled: false,
    callback(): void {
      if (panoramaMap) {
        const map = panoramaMap;
        layerTypeListener();
        if (action.active) {
          map.layerTypes = defaultLayerTypes;
          layerTypeListener = map.layerTypesChanged.addEventListener(() => {
            defaultLayerTypes = map.layerTypes;
            action.active = false;
            action.disabled = map.layerTypes.length === 0;
          });
          action.active = false;
        } else {
          panoramaMap.layerTypes = [];
          action.active = true;
        }
      }
    },
  });

  const setActiveMap = (): void => {
    panoramaMap =
      app.maps.activeMap instanceof PanoramaMap
        ? app.maps.activeMap
        : undefined;
  };
  const mapListener = app.maps.mapActivated.addEventListener(setActiveMap);
  setActiveMap();

  return {
    action,
    destroy(): void {
      mapListener();
      layerTypeListener();
    },
  };
}

export function createHideCursorAction(panoramaMap: PanoramaMap): {
  action: VcsAction;
  destroy: () => void;
} {
  const { tilePrimitiveCollection } = panoramaMap.panoramaView;
  const hideCursor = ref(tilePrimitiveCollection.cursorColor.alpha === 0);

  const action = reactive<VcsAction>({
    name: 'panorama.hideCursor',
    icon: 'mdi-bullseye',
    title: 'panorama.hideCursor',
    callback(): void {
      hideCursor.value = !hideCursor.value;
      const currentColor = Color.clone(
        tilePrimitiveCollection.cursorColor,
        new Color(),
      );
      currentColor.alpha = hideCursor.value ? 0 : 1;
      tilePrimitiveCollection.cursorColor = currentColor;
    },
  });
  action.disabled = !panoramaMap.currentPanoramaImage?.hasDepth;

  const currentImageListener = panoramaMap.currentImageChanged.addEventListener(
    () => {
      action.disabled = !panoramaMap.currentPanoramaImage?.hasDepth;
    },
  );

  const activeWatcher = watch(
    hideCursor,
    () => {
      action.active = !hideCursor.value;
    },
    { immediate: true },
  );

  return {
    action,
    destroy(): void {
      activeWatcher();
      currentImageListener();
    },
  };
}

export function createMapMarkerAction(app: VcsUiApp): {
  action: VcsAction;
  destroy: () => void;
} {
  const hideFootprint = ref(false);

  const hideFootprintWatcher = watch(hideFootprint, () => {
    for (const layer of app.layers) {
      if (layer instanceof PanoramaDatasetLayer) {
        layer.hideInPanorama = hideFootprint.value;
      }
    }
  });

  const layerAdded = app.layers.added.addEventListener((layer) => {
    if (layer instanceof PanoramaDatasetLayer) {
      layer.hideInPanorama = hideFootprint.value;
    }
  });

  const action = reactive<VcsAction>({
    name: 'panorama.hideFootprint',
    title: 'panorama.hideFootprint',
    icon: 'mdi-map-marker-path',
    callback() {
      hideFootprint.value = !hideFootprint.value;
    },
  });

  const watcher = watch(
    hideFootprint,
    () => {
      action.active = !hideFootprint.value;
    },
    { immediate: true },
  );

  return {
    action,
    destroy(): void {
      hideFootprintWatcher();
      layerAdded();
      watcher();
    },
  };
}

export function createOverlayActions(panoramaMap: PanoramaMap): {
  actions: VcsAction[];
  destroy: () => void;
  currentOverlay: Ref<PanoramaOverlayMode>;
} {
  const currentOverlay = ref(
    panoramaMap.panoramaView.tilePrimitiveCollection.overlay,
  );

  const watchers: (() => void)[] = [];

  const createAction = (overlayType: 'depth' | 'intensity'): VcsAction => {
    const overlayMode =
      overlayType === 'depth'
        ? PanoramaOverlayMode.Depth
        : PanoramaOverlayMode.Intensity;

    const action = reactive<VcsAction>({
      name: `panorama.complementaryImages.${overlayType}`,
      title: `panorama.complementaryImages.${overlayType}Title`,
      icon: overlayType === 'depth' ? depthIcon : 'mdi-gradient-horizontal',
      callback(): void {
        if (currentOverlay.value === overlayMode) {
          currentOverlay.value = PanoramaOverlayMode.None;
        } else {
          currentOverlay.value = overlayMode;
        }
      },
    });

    watchers.push(
      watch(
        currentOverlay,
        () => {
          action.active = currentOverlay.value === overlayMode;
          panoramaMap.panoramaView.tilePrimitiveCollection.overlay =
            currentOverlay.value;
        },
        { immediate: true },
      ),
    );
    return action;
  };
  const depthAction = createAction('depth');
  const intensityAction = createAction('intensity');

  const setImage = (): void => {
    const image = panoramaMap.currentPanoramaImage;
    depthAction.disabled = !image?.hasDepth;
    intensityAction.disabled = !image?.hasIntensity;
  };
  const imageListener =
    panoramaMap.currentImageChanged.addEventListener(setImage);
  setImage();
  watchers.push(imageListener);

  return {
    actions: [depthAction, intensityAction],
    currentOverlay,
    destroy(): void {
      watchers.forEach((watcher) => {
        watcher();
      });
    },
  };
}
