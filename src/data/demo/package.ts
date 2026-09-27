import rawFactors from '../factors/factors-demo-v1.json';
import {
  FactorDatasetSchema,
  estimated,
  unknown,
  type PackageInput,
  type PackageComponent,
} from '../../types/domain';
export const dataset = FactorDatasetSchema.parse(rawFactors);
export const demoPackage: PackageInput = {
  id: 'demo-shoes-v1',
  mode: 'demo',
  packageContext: 'received',
  item: { category: 'shoes' },
  components: [
    {
      id: 'outer',
      layerOrder: 0,
      type: 'shipping_box',
      material: estimated('corrugated_cardboard'),
      quantity: 1,
      massGrams: estimated(280),
      isUserEditable: true,
    },
    {
      id: 'inner',
      layerOrder: 1,
      type: 'product_box',
      material: estimated('corrugated_cardboard'),
      quantity: 1,
      massGrams: estimated(150),
      isUserEditable: true,
    },
    {
      id: 'filler',
      layerOrder: 2,
      type: 'paper_filler',
      material: estimated('kraft_paper'),
      quantity: 1,
      massGrams: estimated(40),
      isUserEditable: true,
    },
    {
      id: 'tape',
      layerOrder: 3,
      type: 'tape',
      material: estimated('adhesive_tape'),
      quantity: 1,
      massGrams: estimated(10),
      isUserEditable: true,
    },
  ],
  route: {
    origin: { label: '杭州' },
    destination: { label: '上海' },
    distanceKm: estimated(200, 'illustrative-route-v1'),
    transportMode: estimated('mixed_ground'),
  },
  regionContext: { dataRegion: 'demo', factorDatasetVersion: dataset.version, dataYear: 2026 },
};
export const newComponent = (
  type: PackageComponent['type'] = 'shipping_box',
): PackageComponent => ({
  id: crypto.randomUUID(),
  layerOrder: 0,
  type,
  material: unknown(),
  quantity: 1,
  massGrams: unknown(),
  isUserEditable: true,
});
export const newPackage = (): PackageInput => ({
  id: crypto.randomUUID(),
  mode: 'user',
  packageContext: 'received',
  item: { category: 'other' },
  components: [newComponent()],
  route: {
    origin: { label: '' },
    destination: { label: '' },
    distanceKm: unknown(),
    transportMode: unknown(),
  },
  regionContext: { dataRegion: 'demo', factorDatasetVersion: dataset.version, dataYear: 2026 },
});
