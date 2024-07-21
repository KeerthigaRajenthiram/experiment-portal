// TODO Orestis to update this schema if needed

export interface DatasetType {
  id_dataset: string;
  project_id: string;
  name: string;
<<<<<<< HEAD
=======
  description: string;
  file_type: string;
  file_size: string;
>>>>>>> 938b764 (Added dataset functionalities)
  create_at: number;
  update_at: number;
}

export const defaultDataset = {
  id_dataset: '',
  project_id: '',
  name: '',
<<<<<<< HEAD
=======
  description: '',
  file_type: '',
  file_size: '',
>>>>>>> 938b764 (Added dataset functionalities)
  create_at: NaN,
  update_at: NaN,
};
