import React, { useState } from "react";

import { useSnackbar } from "notistack";

// HTTP Client
import { httpClient } from "../../client";
import { useSelector } from "react-redux";
// MUI
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import { Button } from "@mui/material";

import { styled } from "@mui/material/styles";

//CSV parser
import Papa from "papaparse";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const UploadFileCard = () => {
  const { user } = useSelector((state) => state.user);
  const { enqueueSnackbar } = useSnackbar();

  const [isApiWaiting, setIsApiWaiting] = useState(false);
  const [howdyFileData, setHowdyfileData] = useState("");
  const [canvasfileData, setCanvasFileData] = useState("");

  const sendCSVToServer = (csvData) => {
    setIsApiWaiting(true);
    httpClient
      .post("/howdycsv", csvData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "text/plain",
        },
      })
      .then((response) => {
        enqueueSnackbar(JSON.stringify(response?.data?.message), {
          variant: "success",
        });
      })
      .catch((err) =>
        enqueueSnackbar(err.message, {
          variant: "error",
        })
      )
      .finally(() => setIsApiWaiting(false));
  };

  const handleHowdyFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvString = e.target.result;
        var csvData = Papa.parse(csvString, {header:true});
        setHowdyfileData(csvData);
        event.target.value = '';
        enqueueSnackbar("Howdy file parsed", {
          variant: "info",
        });
      };
      reader.readAsText(file);
    }
  };

  const handleCanvasFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvString = e.target.result;
        var csvData = Papa.parse(csvString, {header:true});
        setCanvasFileData(csvData);
        event.target.value = '';
        enqueueSnackbar("Canvas file parsed", {
          variant: "info",
        });
      };
      reader.readAsText(file);
    }
  };

  const handleProcessDataClick = () => {
    const joinedData = []
    for (let i = 0; i < howdyFileData.data.length; i++){
      for (let j = 0; j < canvasfileData.data.length; j++){
        if(howdyFileData.data[i]["UIN"] == canvasfileData.data[j]["SIS Login ID"]){
          joinedData.push({...howdyFileData.data[i], "CanvasID":canvasfileData.data[j]["ID"], "Section":canvasfileData.data[j]["Section"]})
          continue;
        }
      }
    }
    enqueueSnackbar(`${joinedData.length} common records found`, {
      variant: "info",
    });
    sendCSVToServer(Papa.unparse(joinedData));
  };

  return (
    <div>
      <Button
        component="label"
        role={undefined}
        variant="contained"
        tabIndex={-1}
        disabled={isApiWaiting}
        startIcon={<CloudUploadIcon />}
      >
        Upload Howdy file
        <VisuallyHiddenInput type="file" onChange={handleHowdyFileChange} />
      </Button>
      <Button
        component="label"
        role={undefined}
        variant="contained"
        tabIndex={-1}
        disabled={isApiWaiting}
        startIcon={<CloudUploadIcon />}
      >
        Upload Canvas file
        <VisuallyHiddenInput type="file" onChange={handleCanvasFileChange} />
      </Button>
      <Button
        variant="contained"
        color="primary"
        disabled={isApiWaiting || !howdyFileData || !canvasfileData}
        onClick={handleProcessDataClick}
      >
        Process Data
      </Button>
    </div>
  );
};

export default UploadFileCard;
