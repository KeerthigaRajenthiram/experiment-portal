import './style.scss';
import {memo, useCallback, useEffect, useState} from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import {setDatasets, useDatasetStore} from "../../../../../stores/datasetStore";
import useRequest from "../../../../../hooks/useRequest";
import {DatasetsResponseType} from "../../../../../types/requests";
import { message } from '../../../../../utils/message';
import DropDown from '../../../ConfigPanel/SupportComponents/DropDown';
import {useLocation} from "react-router-dom";

const Data = ({
  data,
  isConnectable,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
}: NodeProps) => {
  const [name, setName] = useState(data.name);
  const [dataset, setDataset] = useState(data.dataset);

  const projID = useLocation().pathname.split('/')[3];
  const datasets = useDatasetStore((state) => state.datasets);
  const { request: datasetsRequest } = useRequest<DatasetsResponseType>();

  const handleSelectTask = (datasetName: string) => {
    setDataset(datasetName);
    data.dataset = datasetName;
  };

  const getDatasets = useCallback(() => {
    datasetsRequest({
      url: `exp/projects/${projID}/datasets`
    })
        .then((data) => {
          if (data.data.datasets) {
            setDatasets(data.data.datasets);
          }
        })
        .catch((error) => {
          if (error.name === 'AxiosError') {
            message('Please login first');
          }
        });
  }, [datasetsRequest, datasets]);

  useEffect(() => {
    getDatasets();
  }, []);

  return (
    <>
      <div className="node-data">
        <label className="node-data__name">
          <input
            className="node-data__input nodrag"
            type="text"
            defaultValue="dataset"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              data.name = e.target.value;
            }}
          />
        </label>
        <p className="node-data__title"></p>
        <label className="node-data__field">
          <DropDown
              options={datasets.map((dataset) => dataset.name)}
              className="node-data__dropdown nodrag"
              onOptionSelected={handleSelectTask}
              value={dataset}
          />
        </label>
        <Handle
          type="source"
          position={sourcePosition}
          isConnectable={isConnectable}
        />
        <Handle
          type="target"
          position={targetPosition}
          isConnectable={isConnectable}
        />
      </div>
    </>
  );
};

export default memo(Data);
