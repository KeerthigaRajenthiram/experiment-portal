import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Popover from '../../general/Popover';
import useRequest from '../../../hooks/useRequest';
import { message } from '../../../utils/message';
import { timeNow, timestampToDate } from '../../../utils/timeToDate';
import './style.scss';
import { defaultDataset } from '../../../types/dataset';
import {
  DatasetsResponseType,
  CreateDatasetResponseType,
  UpdateDatasetNameResponseType,
  UpdateDatasetDescriptionResponseType, 
  DeleteExperimentResponseType,
  DownloadResponseType
} from '../../../types/requests';
import axios from 'axios';

const Organization = () => {
  const [datasets, setDatasets] = useState([defaultDataset]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const [editingDescriptionIndex, setEditingDescriptionIndex] = useState<number | null>(null); 
  const [showPopover, setShowPopover] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [showAddPopover, setShowAddPopover] = useState(false);
  const [metadata, setMetadata] = useState([{ name: '', value: '', description: '' }]);

  const isDatasetEmpty = datasets.length === 0;
  const projID = useLocation().pathname.split('/')[3];

  const { request: datasetsRequest } = useRequest<DatasetsResponseType>();
  const { request: createDatasetRequest } = useRequest<CreateDatasetResponseType>();
  const { request: getDatasetRequest } = useRequest<DownloadResponseType>();
  const { request: updateDatasetNameRequest } = useRequest<UpdateDatasetNameResponseType>();
  const { request: updateDatasetDescriptionRequest } = useRequest<UpdateDatasetDescriptionResponseType>(); 
  const { request: deleteDatasetRequest } = useRequest<DeleteExperimentResponseType>();
 

  const getDatasets = useCallback(() => {
    datasetsRequest({
      url: `exp/projects/${projID}/datasets`,
    })
      .then((data) => {
        if (data.data.datasets) {
          const datasets = data.data.datasets;
          setDatasets(datasets);
        }
      })
      .catch((error) => {
        if (error.message) {
          message(error.message);
        }
      });
  }, [datasetsRequest, projID]);

  useEffect(() => {
    getDatasets();
  }, [getDatasets]);

  const postNewDataset = useCallback(
    async (name: string, file: File | null, description: string, metadata: any) => {
      const formData = new FormData();
      formData.append('dataset_name', name);
      if (file) {
        formData.append('file', file);
      }
      formData.append('description', description);
      formData.append('metadata', JSON.stringify(metadata));
      try {
        const response = await createDatasetRequest({
          url: `/exp/projects/${projID}/datasets/create`,
          method: 'POST',
          data: formData,
        });
        if (response.data && response.data.id_dataset) {
          getDatasets();
          setNewDatasetName('');
          setNewFile(null);
          setNewDescription('');
          setMetadata([{ name: '', value: '', description: '' }]);
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          // Handle AxiosError
          console.error('Axios error:', error.response?.data); // Use error.response?.data to access the response data
          message(`Error: ${error.response?.data.error || 'Server error'}`);
        } else if (error instanceof Error) {
          // Handle general Error
          console.error('General error:', error.message);
          message(`Error: ${error.message}`);
        } else {
          // Handle unexpected error types
          console.error('Unexpected error:', error);
          message('An unexpected error occurred');
        }
      }
    },
    [projID, createDatasetRequest, getDatasets, metadata]
  );
  
  const handleNewDataset = () => {
    const datasetName = `dataset-${timeNow()}`;
    if (!newDatasetName.trim()) {
      setNewDatasetName(datasetName);
    }
    postNewDataset(newDatasetName, newFile, newDescription, metadata);
    setShowAddPopover(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setNewFile(file);
  };

  const handleMetadataChange = (index: number, field: string, value: string) => {
    const newMetadata = [...metadata];
    newMetadata[index] = { ...newMetadata[index], [field]: value };
    setMetadata(newMetadata);
  };

  const addMetadataField = () => {
    setMetadata([...metadata, { name: '', value: '', description: '' }]);
  };

  const removeMetadataField = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index));
  };

  const handleStartEditingName = (index: number) => {
    setNewDatasetName(datasets[index].name);
    if (editingIndex === null) {
      setEditingIndex(index);
    } else {
      setEditingIndex(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (editingIndex === null) return;
      if (newDatasetName === '' || newDatasetName === datasets[editingIndex].name) {
        setEditingIndex(null);
        return;
      }
      renameDataset();
      setEditingIndex(null);
    }
  };

  const renameDataset = () => {
    if (newDatasetName === '' || editingIndex === null) return;
    if (newDatasetName === datasets[editingIndex].name) return;
    if (newDatasetName.length > 35) {
      message('The length of the name should be less than 35 characters.');
      return;
    }
    updateDatasetNameRequest({
      url: `/exp/projects/${projID}/datasets/${datasets[editingIndex!].id_dataset}/update/name`,
      method: 'PUT',
      data: {
        dataset_name: newDatasetName,
      },
    })
      .then(() => {
        getDatasets();
      })
      .catch((error) => {
        message(error.response.data?.message || error.message);
      });
  };

  const handleStartEditingDescription = (index: number) => {
    setNewDescription(datasets[index].description);
    if (editingDescriptionIndex === null) {
      setEditingDescriptionIndex(index);
    } else {
      setEditingDescriptionIndex(null);
    }
  };

  const handleDescriptionKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (editingDescriptionIndex === null) return;
      if (newDescription === '' || newDescription === datasets[editingDescriptionIndex].description) {
        setEditingDescriptionIndex(null);
        return;
      }
      updateDescription();
      setEditingDescriptionIndex(null);
    }
  };

  const updateDescription = () => {
    if (newDescription === '' || editingDescriptionIndex === null) return;
    if (newDescription === datasets[editingDescriptionIndex].description) return;
    updateDatasetDescriptionRequest({
      url: `/exp/projects/${projID}/datasets/${datasets[editingDescriptionIndex!].id_dataset}/update/description`,
      method: 'PUT',
      data: {
        description: newDescription,
      },
    })
      .then(() => {
        getDatasets();
      })
      .catch((error) => {
        message(error.response.data?.message || error.message);
      });
  };

  // // Define the type of the mimeTypesToExtensions dictionary
  // interface MimeTypesToExtensions {
  //   [key: string]: string;
  // }

  // // Initialize the dictionary with specific MIME types and extensions
  // const mimeTypesToExtensions: MimeTypesToExtensions = {
  //   'application/pdf': 'pdf',
  //   'application/msword': 'doc',
  //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  //   'application/vnd.ms-excel': 'xls',
  //   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  //   'application/vnd.ms-powerpoint': 'ppt',
  //   'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  //   'text/plain': 'txt',
  //   'text/html': 'html',
  //   'application/json': 'json',
  //   'image/jpeg': 'jpg',
  //   'image/png': 'png',
  //   'image/gif': 'gif',
  //   'application/zip': 'zip',
  //   'application/x-tar': 'tar',
  //   'application/x-rar-compressed': 'rar',
  //   // Add more MIME types and their extensions as needed
  // };

  const handleDownloadDataset = useCallback(
    async (index: number) => {
      const datasetId = datasets[index].id_dataset;
      try {
        // Perform the download request using the useRequest hook
        const response = await getDatasetRequest({
          url: `/exp/projects/${projID}/datasets/${datasetId}/download`,
          method: 'GET',
          responseType: 'blob', // Important for downloading files
        });
        console.log('Response:', response);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;e
        let filename = datasetId; // Default filename
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        // Clean up after download
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log({ type: 'success', message: 'File downloaded successfully.' });
      } catch (error: unknown) {
        if (error instanceof Error) {
          // Handle general Error
          console.error('General error:', error.message);
          message(`Error: ${error.message}`);
        } else {
          // Handle unexpected error types
          console.error('Unexpected error:', error);
          message('An unexpected error occurred');
        }
      }
    },
    [datasets, projID, getDatasetRequest]
  );
  
 
  const handleOpenPopover = (index: number) => {
    setDeleteIndex(index);
    setShowPopover(true);
  };

  const closeMask = () => {
    setShowPopover(false);
    setShowAddPopover(false);
  };

  const handleCancelDelete = () => {
    closeMask();
  };

  const handleDeleteDataset = () => {
    if (deleteIndex === null) return;
    deleteDatasetRequest({
      url: `/exp/projects/${projID}/datasets/${datasets[deleteIndex].id_dataset}/delete`,
      method: 'DELETE',
    })
      .then(() => {
        getDatasets();
      })
      .catch((error) => {
        message(error.response.data?.message || error.message);
      });
    closeMask();
  };

  const openAddDatasetPopover = () => {
    setShowAddPopover(true);
  };

  const handleCancelAddDataset = () => {
    setShowAddPopover(false);
  };

  return (
    <div className="specification">
      <div className="specification__functions" style={{ margin: 10 }}>
        <button className="specification__functions__new" onClick={openAddDatasetPopover}>
          Add Dataset
        </button>
      </div>
      <div className="specification__contents">
        <div className="specification__contents__header">
          <div className="specification__contents__header__title">Dataset</div>
          <div className="specification__contents__header__description">Description</div>
          <div className="specification__contents__header__file_type">Filetype</div>
          <div className="specification__contents__header__file_size">Filesize (Bytes)</div>
          <div className="specification__contents__header__create">Created At</div>
          <div className="specification__contents__header__update">Updated At</div>
          <div className="specification__contents__header__operations"></div>
        </div>
        {isDatasetEmpty ? (
          <div className="specification__contents__empty">
            <span className="iconfont">&#xe6a6;</span>
            <p>Empty Datasets</p>
          </div>
        ) : (
          <ul className="specification__contents__list">
            {datasets.map((dataset, index) => (
              <li className="specification__contents__list__item" key={index}>
                <div className="specification__contents__list__item__title">
                  <span
                    title="modify the name"
                    className="iconfont editable"
                    onClick={() => handleStartEditingName(index)}
                  >
                    &#xe63c;
                  </span>
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={newDatasetName}
                      onChange={(e) => setNewDatasetName(e.target.value)}
                      onKeyUp={handleKeyPress}
                    />
                  ) : (
                    <p>{dataset.name}</p>
                  )}
                </div>
                <div className="specification__contents__list__item__description">
                  <span
                      title="modify the description"
                      className="iconfont editable"
                      onClick={() => handleStartEditingDescription(index)}
                    >
                      &#xe63c;
                    </span>
                    {editingDescriptionIndex === index ? (
                      <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        onKeyUp={handleDescriptionKeyPress}
                      />
                    ) : (
                      <p>{dataset.description}</p>
                    )}
                </div>
                <div className="specification__contents__list__item__file_type">
                  {dataset.file_type || 'Unknown'}
                </div>
                <div className="specification__contents__list__item__file_size">
                  {dataset.file_size || 'Unknown'}
                </div>
                <div className="specification__contents__list__item__create">
                  {timestampToDate(dataset.create_at)}
                </div>
                <div className="specification__contents__list__item__update">
                  {timestampToDate(dataset.update_at)}
                </div>
                <div className="specification__contents__list__item__operations">
                  <span
                    title="download dataset"
                    className="iconfont editable"
                    onClick={() => handleDownloadDataset(index)}
                  >
                    &#xe627;
                  </span>
                  <span
                    title="delete this dataset"
                    className="iconfont editable"
                    onClick={() => handleOpenPopover(index)}
                  >
                    &#xe634;
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Popover show={showPopover} blankClickCallback={closeMask}>
        <div className="popover__delete">
          <div className="popover__delete__text">
            {`Do you want to delete ${deleteIndex !== null ? datasets[deleteIndex].name : 'the dataset'}?`}
          </div>
          <div className="popover__delete__buttons">
            <button className="popover__delete__buttons__cancel" onClick={handleCancelDelete}>
              cancel
            </button>
            <button className="popover__delete__buttons__confirm" onClick={handleDeleteDataset}>
              confirm
            </button>
          </div>
        </div>
      </Popover>
      <Popover show={showAddPopover} blankClickCallback={closeMask}>
        <div className="popover__add-dataset">
          <div className="popover__add-dataset__text">Add New Dataset</div>
          <input
            className="popover__add-dataset__input"
            type="text"
            placeholder="Enter dataset name"
            value={newDatasetName}
            onChange={(e) => setNewDatasetName(e.target.value)}
          />
          <input
            className="popover__add-dataset__input"
            type="text"
            placeholder="Enter description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <input
            className="popover__add-dataset__input"
            type="file"
            placeholder="Select file"
            onChange={handleFileChange}
          />
          <div className="popover__add-dataset__text">Add Metadata</div>
          {metadata.map((meta, index) => (
            <div key={index} className="popover__add-dataset__metadata">
              <button className="popover__add-dataset__metadata__remove-button" onClick={() => removeMetadataField(index)}>Remove</button>
              <input
                className="popover__add-dataset__metadata_input"
                type="text"
                placeholder="Name"
                value={meta.name}
                onChange={(e) => handleMetadataChange(index, 'name', e.target.value)}
              />
              <input
                className="popover__add-dataset__metadata_input"
                type="text"
                placeholder="Value"
                value={meta.value}
                onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
              />
              <input
                className="popover__add-dataset__metadata_input"
                type="text"
                placeholder="Description"
                value={meta.description}
                onChange={(e) => handleMetadataChange(index, 'description', e.target.value)}
              />
            </div>
          ))}
          <button className="popover__add-dataset__add-button" onClick={addMetadataField}>Add</button>
          <div className="popover__add-dataset__buttons">
            <button className="popover__add-dataset__buttons__cancel" onClick={handleCancelAddDataset}>
              Cancel
            </button>
            <button className="popover__add-dataset__buttons__confirm" onClick={handleNewDataset}>
              Confirm
            </button>
          </div>
        </div>
      </Popover>
    </div>
  );
};

export default Organization;
