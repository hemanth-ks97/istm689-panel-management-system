import { TextField, Button, CircularProgress } from "@mui/material";
import { useState } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { httpClient } from "../../client";
import { useSnackbar } from "notistack";
// Redux
import { useSelector } from "react-redux";
const NewPanelForm = () => {
  const { user } = useSelector((state) => state.user);
  const { enqueueSnackbar } = useSnackbar();
  const [isApiWaiting, setIsApiWaiting] = useState(false);
  const [formValues, setFormValues] = useState({
    panelName: "",
    panelist: "",
    numberOfQuestions: "",
    questionStageDeadline: null,
    voteStageDeadline: null,
    tagStageDeadline: null,
    panelVideoLink: "",
    panelPresentationDate: null,
    panelStartDate: null,
    visibility: "internal",
    panelDesc: "",
  });
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  const handleInputChange = (e) => {
    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value,
    });
  };

  const handleDateChange = (name, newValue) => {
    setFormValues({
      ...formValues,
      [name]: newValue.toISOString(),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // check for date inputs
    if (
      !formValues.voteStageDeadline ||
      !formValues.tagStageDeadline ||
      !formValues.questionStageDeadline ||
      !formValues.panelStartDate ||
      !formValues.panelPresentationDate
    ) {
      enqueueSnackbar("All Dates are required", { variant: "warning" });
      return;
    }
    setIsApiWaiting(true);
    httpClient
      .post("/panel", formValues, {
        headers: headers,
      })
      .then((response) => {
        enqueueSnackbar("Submited!", { variant: "success" });
        setFormValues({
          panelName: "",
          panelist: "",
          numberOfQuestions: "",
          questionStageDeadline: null,
          voteStageDeadline: null,
          tagStageDeadline: null,
          panelVideoLink: "",
          panelPresentationDate: null,
          panelStartDate: null,
          visibility: "internal",
          panelDesc: "",
        });
      })
      .catch((error) => enqueueSnackbar(error.message, { variant: "error" }))
      .finally(() => setIsApiWaiting(false));
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <TextField
          id="panelName"
          label="Panel Name"
          variant="outlined"
          name="panelName"
          value={formValues.panelName}
          onChange={handleInputChange}
          sx={{ my: 1 }}
          required
        />
        <TextField
          id="panelDesc"
          label="Description"
          variant="outlined"
          name="panelDesc"
          value={formValues.panelDesc}
          onChange={handleInputChange}
          sx={{ my: 1 }}
          required
        />
        <TextField
          id="panelist"
          label="Panelists"
          variant="outlined"
          name="panelist"
          value={formValues.panelist}
          onChange={handleInputChange}
          sx={{ my: 1 }}
          required
        />
        <TextField
          id="numberOfQuestions"
          label="Number of questions"
          type="number"
          name="numberOfQuestions"
          InputLabelProps={{
            shrink: true,
          }}
          value={formValues.numberOfQuestions}
          onChange={handleInputChange}
          sx={{ my: 1 }}
          required
        />
        <TextField
          id="videoLink"
          label="Link to video"
          variant="outlined"
          name="panelVideoLink"
          value={formValues.panelVideoLink}
          onChange={handleInputChange}
          sx={{ my: 1 }}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            name="panelStartDate"
            label="Panel Start Date"
            value={formValues.panelStartDate}
            onChange={(newValue) =>
              handleDateChange("panelStartDate", newValue)
            }
            sx={{ my: 1 }}
          />
          <DatePicker
            name="questionStageDeadline"
            label="Question stage deadline"
            value={formValues.questionStageDeadline}
            onChange={(newValue) =>
              handleDateChange("questionStageDeadline", newValue)
            }
            sx={{ my: 1 }}
          />
          <DatePicker
            name="voteStageDeadline"
            label="Vote stage deadline"
            value={formValues.voteStageDeadline}
            onChange={(newValue) =>
              handleDateChange("voteStageDeadline", newValue)
            }
            sx={{ my: 1 }}
          />
          <DatePicker
            name="tagStageDeadline"
            label="Tag stage deadline"
            value={formValues.tagStageDeadline}
            onChange={(newValue) =>
              handleDateChange("tagStageDeadline", newValue)
            }
            sx={{ my: 1 }}
          />
          <DatePicker
            name="panelPresentationDate"
            label="Panel Presentation Date"
            value={formValues.panelPresentationDate}
            onChange={(newValue) =>
              handleDateChange("panelPresentationDate", newValue)
            }
            sx={{ my: 1 }}
          />
        </LocalizationProvider>
        <TextField
          id="visibility"
          label="Set Visibility"
          variant="outlined"
          name="visibility"
          value={formValues.visibility}
          onChange={handleInputChange}
          sx={{ my: 1 }}
        />

        <Button sx={{ my: 1 }} type="submit">
          Submit
        </Button>
      </form>

      {isApiWaiting && <CircularProgress />}
    </div>
  );
};

export default NewPanelForm;
