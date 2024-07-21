<<<<<<< HEAD
import './style.scss';
import { useState, useEffect, useCallback } from 'react';
import useRequest from '../../../hooks/useRequest';
import { message } from '../../../utils/message';
import {timeNow, timestampToDate} from '../../../utils/timeToDate';
import { useLocation } from 'react-router-dom';
import Popover from '../../general/Popover';
import {
  defaultDataset,
} from '../../../types/dataset';
=======
import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Popover from '../../general/Popover';
import useRequest from '../../../hooks/useRequest';
import { message } from '../../../utils/message';
import { timeNow, timestampToDate } from '../../../utils/timeToDate';
import './style.scss';
import { defaultDataset } from '../../../types/dataset';
>>>>>>> 938b764 (Added dataset functionalities)
import {
  DatasetsResponseType,
  CreateDatasetResponseType,
  UpdateDatasetNameResponseType,
<<<<<<< HEAD
  DeleteExperimentResponseType,
=======
  UpdateDatasetDescriptionResponseType, 
  DeleteExperimentResponseType,
  DownloadResponseType
>>>>>>> 938b764 (Added dataset functionalities)
} from '../../../types/requests';

const Organization = () => {
  const [datasets, setDatasets] = useState([defaultDataset]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newDatasetName, setNewDatasetName] = useState('');
<<<<<<< HEAD

  const [showPopover, setShowPopover] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const isDatasetEmpty = datasets.length === 0;

  // make sure the expID is the same as the one in the url
  const projID = useLocation().pathname.split('/')[3];

  const { request: datasetsRequest } = useRequest<DatasetsResponseType>();
  const { request: createDatasetRequest } =
      useRequest<CreateDatasetResponseType>();
  const { request: updateDatasetNameRequest } =
    useRequest<UpdateDatasetNameResponseType>();
  const { request: deleteDatasetRequest } =
    useRequest<DeleteExperimentResponseType>();
=======
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
  const { request: updateDatasetNameRequest } = useRequest<UpdateDatasetNameResponseType>();
  const { request: updateDatasetDescriptionRequest } = useRequest<UpdateDatasetDescriptionResponseType>(); 
  const { request: deleteDatasetRequest } = useRequest<DeleteExperimentResponseType>();
  const { request: downloadDatasetRequest } = useRequest<DownloadResponseType>();
>>>>>>> 938b764 (Added dataset functionalities)

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
<<<<<<< HEAD
      (name: string) => {
        createDatasetRequest({
          url: `/exp/projects/${projID}/datasets/create`,
          method: 'POST',
          data: {
            dataset_name: name,
          },
        })
            .then(() => {
              getDatasets();
            })
            .catch((error) => {
              if (error.message) {
                message(error.message);
              }
            });
      },
      [projID, createDatasetRequest, getDatasets]
  );

  const handleNewDataset = () => {
    // TODO Orestis to refactor and add custom form for uploading files here
    postNewDataset(`dataset-${timeNow()}`);
=======
    (name: string, file: File | null, description: string, metadata: any) => {
      const formData = new FormData();
      formData.append('dataset_name', name);
      if (file) {
        formData.append('file', file);
      }
      formData.append('description', description);
      formData.append('metadata', JSON.stringify(metadata));

      createDatasetRequest({
        url: `/exp/projects/${projID}/datasets/create`,
        method: 'POST',
        data: formData,
      })
        .then(() => {
          getDatasets();
          setNewDatasetName('');
          setNewFile(null);
          setNewDescription('');
          setMetadata([{ name: '', value: '', description: '' }]);
        })
        .catch((error) => {
          if (error.message) {
            message(error.message);
          }
        });
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
>>>>>>> 938b764 (Added dataset functionalities)
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
<<<<<<< HEAD
      url: `/exp/projects/${projID}/datasets/${
        datasets[editingIndex!].id_dataset
      }/update/name`,
=======
      url: `/exp/projects/${projID}/datasets/${datasets[editingIndex!].id_dataset}/update/name`,
>>>>>>> 938b764 (Added dataset functionalities)
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

<<<<<<< HEAD
  const handleDownloadDataset = (index: number) => {
    // TODO Orestis/Ilias to implement this at the end
    console.log(index)
    message("TODO")
  };

  function handleOpenPopover(index: number) {
    setDeleteIndex(index);
    setShowPopover(true);
  }

  function closeMask() {
    setShowPopover(false);
    setDeleteIndex(null);
  }

  function handleCancelDelete() {
    closeMask();
  }
=======
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

  const handleDownloadDataset = (index: number) => {
    const datasetId = datasets[index].id_dataset;
    const datasetFileType = datasets[index].file_type || 'application/octet-stream'; 
    downloadDatasetRequest({
      url: `/exp/projects/${projID}/datasets/${datasetId}/download`,
      method: 'GET',
      responseType: 'blob', // Specify blob response type
    })
    .then((response: DownloadResponseType) => {
      console.log('Response:', response); // Log the entire response
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      // Extract filename from content-disposition header or create a default filename
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${datasetId}.${datasetFileType.split('/')[1]}`; // Default filename with file extension
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/"/g, '');
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // Clean up after download
      console.log({ type: 'success', message: 'File downloaded successfully.' });
    })
    .catch((error) => {
      console.error('Download error:', error); // Log the error
      console.log({ type: 'danger', message: error.response?.data?.message || error.message });
    });
  };
 

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
>>>>>>> 938b764 (Added dataset functionalities)

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

<<<<<<< HEAD
  return (
    <div className="specification">
      <div className="specification__functions" style={{width: 0}}>
        <button
          className="specification__functions__new"
          onClick={handleNewDataset}
        >
          new dataset
=======
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
>>>>>>> 938b764 (Added dataset functionalities)
        </button>
      </div>
      <div className="specification__contents">
        <div className="specification__contents__header">
<<<<<<< HEAD
          <div className="specification__contents__header__title">
            Dataset
          </div>
          <div className="specification__contents__header__create">
            Created At
          </div>
          <div className="specification__contents__header__update">
            Updated At
          </div>
=======
          <div className="specification__contents__header__title">Dataset</div>
          <div className="specification__contents__header__description">Description</div>
          <div className="specification__contents__header__file_type">Filetype</div>
          <div className="specification__contents__header__file_size">Filesize (Bytes)</div>
          <div className="specification__contents__header__create">Created At</div>
          <div className="specification__contents__header__update">Updated At</div>
>>>>>>> 938b764 (Added dataset functionalities)
          <div className="specification__contents__header__operations"></div>
        </div>
        {isDatasetEmpty ? (
          <div className="specification__contents__empty">
            <span className="iconfont">&#xe6a6;</span>
            <p>Empty Datasets</p>
          </div>
        ) : (
          <ul className="specification__contents__list">
<<<<<<< HEAD
            {datasets.map((specification, index) => (
=======
            {datasets.map((dataset, index) => (
>>>>>>> 938b764 (Added dataset functionalities)
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
<<<<<<< HEAD
                    <p>{specification.name}</p>
                  )}
                </div>
                <div className="specification__contents__list__item__create">
                  {timestampToDate(specification.create_at)}
                </div>
                <div className="specification__contents__list__item__update">
                  {timestampToDate(specification.update_at)}
                </div>
                <div className="specification__contents__list__item__operations">
                  <span
                    title="download graphical model"
=======
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
>>>>>>> 938b764 (Added dataset functionalities)
                    className="iconfont editable"
                    onClick={() => handleDownloadDataset(index)}
                  >
                    &#xe627;
                  </span>
                  <span
<<<<<<< HEAD
                    title="delete this specification"
=======
                    title="delete this dataset"
>>>>>>> 938b764 (Added dataset functionalities)
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
<<<<<<< HEAD
            {`Do you want to delete ${
              deleteIndex ? datasets[deleteIndex].name : 'the dataset'
            }?`}
          </div>
          <div className="popover__delete__buttons">
            <button
              className="popover__delete__buttons__cancel"
              onClick={handleCancelDelete}
            >
              cancel
            </button>
            <button
              className="popover__delete__buttons__confirm"
              onClick={handleDeleteDataset}
            >
=======
            {`Do you want to delete ${deleteIndex !== null ? datasets[deleteIndex].name : 'the dataset'}?`}
          </div>
          <div className="popover__delete__buttons">
            <button className="popover__delete__buttons__cancel" onClick={handleCancelDelete}>
              cancel
            </button>
            <button className="popover__delete__buttons__confirm" onClick={handleDeleteDataset}>
>>>>>>> 938b764 (Added dataset functionalities)
              confirm
            </button>
          </div>
        </div>
      </Popover>
<<<<<<< HEAD
=======
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
>>>>>>> 938b764 (Added dataset functionalities)
    </div>
  );
};

export default Organization;
