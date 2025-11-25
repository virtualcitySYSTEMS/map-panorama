import type { VcsAction, VcsPlugin, VcsUiApp } from '@vcmap/ui';
import { name, version, mapVersion } from '../package.json';
import { createLayerTypesAction, setupToolbox } from './api';

type PluginConfig = Record<never, never>;
type PluginState = Record<never, never>;

export type PanoramaPlugin = VcsPlugin<PluginConfig, PluginState> & {
  readonly layerTypesAction: VcsAction;
};

export default function plugin(): PanoramaPlugin {
  let destroy: () => void = () => {};
  let layerTypesAction: VcsAction | undefined;

  return {
    get name(): string {
      return name;
    },
    get version(): string {
      return version;
    },
    get mapVersion(): string {
      return mapVersion;
    },
    get layerTypesAction(): VcsAction {
      if (!layerTypesAction) {
        throw new Error('Panorama plugin not initialized');
      }
      return layerTypesAction;
    },
    initialize(vcsUiApp: VcsUiApp): Promise<void> {
      const destroyToolbox = setupToolbox(vcsUiApp);
      const { action, destroy: destroyLayerTypes } =
        createLayerTypesAction(vcsUiApp);
      layerTypesAction = action;

      destroy = (): void => {
        destroyToolbox();
        destroyLayerTypes();
      };

      return Promise.resolve();
    },
    i18n: {
      en: {
        panorama: {
          title: 'Panorama tool',
          visibility: 'Visibility',
          imageEnhancement: {
            title: 'Image enhancement',
            brightness: 'Brightness',
            contrast: 'Contrast',
            reset: 'Reset',
            hdr: 'HDR',
            gamma: 'Gamma',
            exposure: 'Exposure',
          },
          complementaryImages: {
            title: 'Complementary images',
            opacity: 'Opacity',
            intensity: 'Intensity image',
            depth: 'Depth image',
            depthTitle: 'Toggle depth image',
            intensityTitle: 'Toggle intensity image',
          },
          imageMetadata: {
            title: 'Image metadata',
            name: 'Name',
            time: 'Time',
            position: 'Position',
            positionTooltip: 'WGS84 Coordinates',
            orientation: 'Orientation',
            orientationTooltip: 'Heading, Pitch, Roll in Degrees',
            cameraOffset: 'Camera offset',
            tileSize: 'Tile size',
            hasIntensity: 'Has intensity',
            hasDepth: 'Has depth',
            noImage: 'No image available',
          },
          notPanoramaMap: 'Not a panorama map',
          hideCursor: 'Toggle depth cursor',
          hideFootprint: 'Toggle footprints',
          toggleLayers: 'Toggle additional layers',
        },
      },
      de: {
        panorama: {
          title: 'Panoramawerkzeug',
          visibility: 'Sichtbarkeit',
          imageEnhancement: {
            title: 'Bildverbesserung',
            brightness: 'Helligkeit',
            contrast: 'Kontrast',
            reset: 'Zurücksetzen',
            hdr: 'HDR',
            gamma: 'Gamma',
            exposure: 'Belichtung',
          },
          complementaryImages: {
            title: 'Ergänzende Bilder',
            opacity: 'Deckkraft',
            intensity: 'Intensitätsbild',
            depth: 'Tiefenbild',
            depthTitle: 'Tiefenbild umschalten',
            intensityTitle: 'Intensitätsbild umschalten',
          },
          imageMetadata: {
            title: 'Bildmetadaten',
            name: 'Name',
            time: 'Zeit',
            position: 'Position',
            positionTooltip: 'WGS84 Koordinaten',
            orientation: 'Ausrichtung',
            orientationTooltip: 'Gier-, Nick-, Rollwinkel in Grad',
            cameraOffset: 'Kameraversatz',
            tileSize: 'Kachelgröße',
            hasIntensity: 'Enthält Intensitätsbild',
            hasDepth: 'Enthält Tiefenbild',
            noImage: 'Kein Bild verfügbar',
          },
          notPanoramaMap: 'Keine Panorama-Karte',
          hideCursor: 'Tiefenbild-Cursor umschalten',
          hideFootprint: 'Standorte umschalten',
          toggleLayers: 'Zusätzliche Ebenen umschalten',
        },
      },
    },
    destroy(): void {
      destroy();
    },
  };
}
