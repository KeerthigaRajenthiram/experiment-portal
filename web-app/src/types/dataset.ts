// TODO Orestis to update this schema if needed
export interface MetadataItem {
  name: string;
  value: string;
  description: string;
}

export const defaultMetadataItem ={
  name: '',
  value: '',
  description: ''
}

export interface DatasetType {
  id_dataset: string;
  project_id: string;
  name: string;
  description: string;
  file_type: string;
  file_size: string;
  create_at: number;
  update_at: number;
  zenoh_key_expr: string;
  metadata: MetadataItem[]; 
}

export const defaultDataset = {
  id_dataset: '',
  project_id: '',
  name: '',
  description: '',
  file_type: '',
  file_size: '',
  create_at: NaN,
  update_at: NaN,
  zenoh_key_expr:'',
  metadata: [defaultMetadataItem]
};
