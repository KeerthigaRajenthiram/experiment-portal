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
  CreateFolderResponseType,
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
  const [showFolderPopover, setShowFolderPopover] = useState(false);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [folderMetadata, setFolderMetadata] = useState<{
    [filename: string]: {
      file_name: string;
      file_description: string;
      metadata: Array<{ name: string; value: string; description: string }>
    }
  }>({});
  
  const [pathFields, setPathFields] = useState([{ value: '' }]);

  const isDatasetEmpty = datasets.length === 0;
  const projID = useLocation().pathname.split('/')[3];

  const { request: datasetsRequest } = useRequest<DatasetsResponseType>();
  const { request: createDatasetRequest } = useRequest<CreateDatasetResponseType>();
  const { request: createFolderRequest } = useRequest<CreateFolderResponseType>();
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
          console.error('Axios error:', error.response?.data); 
          message(`Error: ${error.response?.data.error || 'Server error'}`);
        } else if (error instanceof Error) {
          console.error('General error:', error.message);
          message(`Error: ${error.message}`);
        } else {
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

  const handleDownloadDataset = useCallback(
    async (index: number) => {
      const datasetId = datasets[index].id_dataset;
      try {
        const response = await getDatasetRequest({
          url: `/exp/projects/${projID}/datasets/${datasetId}/download`,
          method: 'GET',
          responseType: 'blob', 
        });
        console.log('Response:', response);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        let filename = datasetId; 
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log({ type: 'success', message: 'File downloaded successfully.' });
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('General error:', error.message);
          message(`Error: ${error.message}`);
        } else {
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


  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setFolderFiles(fileArray);
      const newMetadata = fileArray.reduce((acc, file) => {
        acc[file.name] = {
          file_name: file.name.replace(/\.[^/.]+$/, ""),
          file_description: '',
          metadata: []
        };
        return acc;
      }, {} as typeof folderMetadata);
      setFolderMetadata(newMetadata);
    }
  };
  
  const handleFolderMetadataChange = (
    filename: string,
    index: number | null,
    field: 'name' | 'value' | 'description' | 'fileName' | 'fileDescription',
    value: string
  ) => {
    setFolderMetadata(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        ...(field === 'fileName' ? { file_name: value } : {}),
        ...(field === 'fileDescription' ? { file_description: value } : {}),
        metadata: field !== 'fileName' && field !== 'fileDescription'
          ? prev[filename]?.metadata.map((meta, i) =>
              i === index ? { ...meta, [field]: value } : meta
            ) || []
          : prev[filename]?.metadata || []
      }
    }));
  };
  
  const handleFileNameChange = (filename: string, value: string) => {
    handleFolderMetadataChange(filename, null, 'fileName', value);
  };
  
  const handleFileDescriptionChange = (filename: string, value: string) => {
    handleFolderMetadataChange(filename, null, 'fileDescription', value);
  };
  
  
  
  const addFolderMetadataField = (filename: string) => {
    setFolderMetadata(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        metadata: [
          ...(prev[filename]?.metadata || []),
          { name: '', value: '', description: '' }
        ]
      }
    }));
  };
  
  
  const removeFolderMetadataField = (filename: string, index: number) => {
    setFolderMetadata(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        metadata: (prev[filename]?.metadata || []).filter((_, i) => i !== index)
      }
    }));
  };
  
  const handleUploadFolder = async () => {
    const pathString = pathFields.map(field => field.value).join('/');
    console.log('Path String:', pathString);
  
    const formData = new FormData();
    formData.append('path', pathString);
  
    folderFiles.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
      formData.append(`file_name_${index}`, folderMetadata[file.name]?.file_name || '');
      formData.append(`file_description_${index}`, folderMetadata[file.name]?.file_description || '');
      console.log('Filename:', file.name);
      console.log('folderMetadata:', folderMetadata[file.name]);
    });
  
    folderFiles.forEach((file, index) => {
      const metadata = folderMetadata[file.name]?.metadata || [];
      const metadataJSON = JSON.stringify(metadata);
      formData.append(`metadata_${index}`, metadataJSON);
    });
  
    try {
      const response = await createFolderRequest({
        url: `/exp/projects/${projID}/folder/create`,
        method: 'POST',
        data: formData,
      });
  
      if (response.data && response.data.dataset_ids) {
        getDatasets();
        setShowFolderPopover(false);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data);
        message(`Error: ${error.response?.data.error || 'Server error'}`);
      } else if (error instanceof Error) {
        console.error('General error:', error.message);
        message(`Error: ${error.message}`);
      } else {
        console.error('Unexpected error:', error);
        message('An unexpected error occurred');
      }
    }
  };
  
  const addPathField = () => {
    setPathFields([...pathFields, { value: '' }]);
  };

  const removePathField = (index: number) => {
    setPathFields(pathFields.filter((_, i) => i !== index));
  };

  const handlePathFieldChange = (index: number, value: string) => {
    const newPathFields = [...pathFields];
    newPathFields[index].value = value;
    setPathFields(newPathFields);
  };

  const resetPopoverData = () => {
    setFolderFiles([]);
    setFolderMetadata({});
    setPathFields([{ value: '' }]);
  };
  

  
  return (
    <div className="specification">
      <div className="specification__functions" style={{ margin: 10 }}>
        <button className="specification__functions__new" onClick={openAddDatasetPopover}>
          Add Dataset
        </button>
        <button 
          className="specification__functions__new" 
          onClick={() => {
            resetPopoverData();
            setShowFolderPopover(true);
            }}
        >
          Add Folder
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
                    title="edit metadata"
                    className="iconfont editable"
                    onClick={() => handleOpenPopover(index)}
                  >
                    &#x270E;
                  </span>
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
          <div className="popover__add-dataset__label">File Name</div>
          <input
            className="popover__add-dataset__input"
            type="text"
            placeholder="Enter dataset name"
            value={newDatasetName}
            onChange={(e) => setNewDatasetName(e.target.value)}
          />
          <div className="popover__add-dataset__label">File Description</div>
          <input
            className="popover__add-dataset__input"
            type="text"
            placeholder="Enter description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <div className="popover__add-dataset__label">Select File</div>
          <input
            className="popover__add-dataset__input"
            type="file"
            placeholder="Select file"
            onChange={handleFileChange}
          />
          <div className="popover__add-dataset__text">Add Metadata</div>
          {metadata.map((meta, index) => (
            <div key={index} className="popover__add-dataset__metadata" data-index={index+1}>
              <button className="popover__add-dataset__metadata__remove-button" onClick={() => removeMetadataField(index)}>Remove</button>
              <div className="popover__add-dataset__metadata__label">Metadata Name</div>
              <input
                className="popover__add-dataset__metadata__input"
                type="text"
                placeholder="Name"
                value={meta.name}
                onChange={(e) => handleMetadataChange(index, 'name', e.target.value)}
              />
              <div className="popover__add-dataset__metadata__label">Metadata Value</div>
              <input
                className="popover__add-dataset__metadata__input"
                type="text"
                placeholder="Value"
                value={meta.value}
                onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
              />
              <div className="popover__add-dataset__metadata__label">Metadata Description</div>
              <input
                className="popover__add-dataset__metadata__input"
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
      <Popover show={showFolderPopover} blankClickCallback={() => setShowFolderPopover(false)}>
        <div className="popover__upload-folder">
          <div className="popover__upload-folder__text">Set Folder Path</div>
          <div className="popover__upload-folder__path-fields">
            {pathFields.map((field, index) => (
              <div key={index} className="popover__upload-folder__path-fields__item">
                <input
                  className="popover__upload-folder__path__input"
                  type="text"
                  placeholder={index === 0 ? 'Folder' : `Sub folder ${index}`}
                  value={field.value}
                  onChange={(e) => handlePathFieldChange(index, e.target.value)}
                  required={index === 0} // Make the first field required
                />
                <button
                  className="popover__upload-folder__path__input__remove-button"
                  onClick={() => removePathField(index)}
                  disabled={index === 0} // Disable the button for the first field
                >
                  Remove
                </button>
              </div>
            ))}
            <button className="popover__upload-folder__file_metadata__add-button" onClick={addPathField}>Add Path Part</button>
          </div>

          {/* File Input Section */}
          <div className="popover__upload-folder__text">Select Files</div>
          <input
            className="popover__upload-folder__input"
            type="file"
            placeholder="Select file"
            onChange={handleFolderChange}
            multiple
          />

          {/* Metadata Section */}
          <div className="popover__upload-folder__text">Select Metadata</div>
          {folderFiles.map((file) => {
            const fileData = folderMetadata[file.name] || {
              file_name: file.name.replace(/\.[^/.]+$/, ""),
              file_description: '',
              metadata: []
            };

            return (
              <div key={file.name} className="popover__upload-folder__file_metadata">
                <div className="popover__upload-folder__metadata">
                  <div className="popover__upload-folder__metadata__title">{file.name}</div>

                  <div className="popover__upload-folder__metadata__label">File Name</div>
                  <input
                    className="popover__upload-folder__input"
                    type="text"
                    placeholder="File name without extension"
                    value={fileData.file_name}
                    onChange={(e) => handleFileNameChange(file.name, e.target.value)}
                  />

                  <div className="popover__upload-folder__metadata__label">File Description</div>
                  <input
                    className="popover__upload-folder__input"
                    type="text"
                    placeholder="Enter description"
                    value={fileData.file_description}
                    onChange={(e) => handleFileDescriptionChange(file.name, e.target.value)}
                  />

                  <hr />

                  {fileData.metadata.map((meta, index) => (
                    <div key={index} className="popover__upload-folder__metadata__item" data-index={index+1}>
                      <div className="popover__upload-folder__metadata__label">Metadata Name</div>
                      <input
                        className="popover__upload-folder__metadata__input"
                        placeholder="Name"
                        value={meta.name}
                        onChange={(e) => handleFolderMetadataChange(file.name, index, 'name', e.target.value)}
                      />
                      <div className="popover__upload-folder__metadata__label">Metadata Value</div>
                      <input
                        className="popover__upload-folder__metadata__input"
                        type="text"
                        placeholder="Value"
                        value={meta.value}
                        onChange={(e) => handleFolderMetadataChange(file.name, index, 'value', e.target.value)}
                      />
                      <div className="popover__upload-folder__metadata__label">Metadata Description</div>
                      <input
                        className="popover__upload-folder__metadata__input"
                        type="text"
                        placeholder="Description"
                        value={meta.description}
                        onChange={(e) => handleFolderMetadataChange(file.name, index, 'description', e.target.value)}
                      />
                      <button
                        className="popover__upload-folder__metadata__remove-button"
                        onClick={() => removeFolderMetadataField(file.name, index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    className="popover__upload-folder__metadata__add-button"
                    onClick={() => addFolderMetadataField(file.name)}>
                    Add Metadata
                  </button>
                </div>
              </div>
            );
          })}

          {/* Action Buttons */}
          <div className="popover__upload-folder__buttons">
            <button className="popover__upload-folder__buttons__cancel" onClick={() => setShowFolderPopover(false)}>
              Cancel
            </button>
            <button className="popover__upload-folder__buttons__confirm" onClick={handleUploadFolder}>
              Upload
            </button>
          </div>
        </div>
      </Popover>

    </div>
  );
};

export default Organization;
