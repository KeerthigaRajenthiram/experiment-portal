import { create } from 'zustand';
import { DatasetType, defaultDataset } from '../types/dataset';

type DatasetState = {
  datasets: DatasetType[];
  currentDataset: DatasetType;
};

export const useDatasetStore = create<DatasetState>(() => ({
  datasets: [defaultDataset],
  currentDataset: defaultDataset,
}));

export const setDatasets = (datasets: DatasetType[]) => {
  useDatasetStore.setState({ datasets: datasets });
};

export const setCurrentDataset = (currentDataset: DatasetType) => {
  useDatasetStore.setState({ currentDataset: currentDataset });
};
