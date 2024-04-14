import React, { useState } from "react";

import {
  TextField,
  Button,
  Card,
  CardHeader,
  CardContent,
  Select,
  MenuItem,
} from "@mui/material";

import LoadingSpinner from "../widgets/LoadingSpinner";

import { httpClient } from "../../client";
import { useSnackbar } from "notistack";
import * as yup from "yup";
import { useFormik } from "formik";

// Redux
import { useSelector } from "react-redux";

const validationSchema = yup.object({
  PanelName: yup.string().required("Panel Name is required"),
  PanelDesc: yup.string().required("Panel Description is required"),
  Panelist: yup.string().required("Panelist is required"),
  PanelStartDate: yup.string().required("PanelStart Date is required"),
  QuestionStageDeadline: yup
    .string()
    .required("Question Stage Deadline is required"),
  TagStageDeadline: yup.string().required("Tag Stage Deadline is required"),
  VoteStageDeadline: yup.string().required("Vote Stage Deadline is required"),
  PanelPresentationDate: yup
    .string()
    .required("Panel Presentation Date is required"),
  NumberOfQuestions: yup
    .number()
    .required("Number of Questions is required")
    .positive()
    .integer(),

  PanelVideoLink: yup.string().required("Panel Video Link is required"),
  Visibility: yup
    .string()
    .required("Section is required")
    .oneOf(["public", "internal"]),
});
const NewPanelForm = () => {
  const { user } = useSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  const formik = useFormik({
    initialValues: {
      PanelName: "",
      PanelDesc: "",
      Panelist: "",
      PanelStartDate: new Date().toISOString(),
      QuestionStageDeadline: new Date().toISOString(),
      TagStageDeadline: new Date().toISOString(),
      VoteStageDeadline: new Date().toISOString(),
      PanelPresentationDate: new Date().toISOString(),
      NumberOfQuestions: 10,
      PanelVideoLink: "",
      Visibility: "internal",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      setIsLoading(true);
      httpClient
        .post("/panel", values, { headers })
        .then((response) => {
          enqueueSnackbar("Panel created", { variant: "success" });
        })
        .catch((error) => {
          enqueueSnackbar("Creation Failed", { variant: "error" });
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
  });

  return (
    <>
      <Card sx={{ minWidth: 400, maxWidth: 800 }}>
        <CardHeader title="Add a new panel" />
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <TextField
              style={{ margin: "5px" }}
              fullWidth
              id="PanelID"
              name="PanelID"
              label="Panel ID"
              disabled={true}
              value="Generated after creation"
            />
            <Select
              style={{ margin: "5px" }}
              fullWidth
              id="Visibility"
              name="Visibility"
              label="Visibility"
              value={formik.values.Visibility}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.userType && Boolean(formik.errors.userType)}
            >
              <MenuItem value="internal">Internal</MenuItem>
              <MenuItem value="public">Public</MenuItem>
            </Select>
            <TextField
              style={{ margin: "5px" }}
              fullWidth
              id="PanelName"
              name="PanelName"
              label="Panel Name"
              value={formik.values.PanelName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.PanelName && Boolean(formik.errors.PanelName)
              }
              helperText={formik.touched.PanelName && formik.errors.PanelName}
            />
            <TextField
              style={{ margin: "5px" }}
              fullWidth
              id="PanelDesc"
              name="PanelDesc"
              label="Panel Description"
              value={formik.values.PanelDesc}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.PanelDesc && Boolean(formik.errors.PanelDesc)
              }
              helperText={formik.touched.PanelDesc && formik.errors.PanelDesc}
            />
            <TextField
              style={{ margin: "5px" }}
              fullWidth
              id="Panelist"
              name="Panelist"
              label="Panelist Name"
              value={formik.values.Panelist}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.Panelist && Boolean(formik.errors.Panelist)}
              helperText={formik.touched.Panelist && formik.errors.Panelist}
            />

            <TextField
              style={{ margin: "5px" }}
              fullWidth
              id="NumberOfQuestions"
              name="NumberOfQuestions"
              label="Number Of Questions"
              type="number"
              value={formik.values.NumberOfQuestions}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.NumberOfQuestions &&
                Boolean(formik.errors.NumberOfQuestions)
              }
              helperText={
                formik.touched.NumberOfQuestions &&
                formik.errors.NumberOfQuestions
              }
            />
            <TextField
              style={{ margin: "5px" }}
              fullWidth
              id="PanelVideoLink"
              name="PanelVideoLink"
              label="Video Link"
              value={formik.values.PanelVideoLink}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.PanelVideoLink &&
                Boolean(formik.errors.PanelVideoLink)
              }
              helperText={
                formik.touched.PanelVideoLink && formik.errors.PanelVideoLink
              }
            />
            <TextField
              style={{ margin: "5px" }}
              fullWidth
              id="PanelStartDate"
              name="PanelStartDate"
              label="Panel Start Date"
              value={formik.values.PanelStartDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.PanelStartDate &&
                Boolean(formik.errors.PanelStartDate)
              }
              helperText={
                formik.touched.PanelStartDate && formik.errors.PanelStartDate
              }
            />
            <TextField
              style={{ margin: "5px" }}
              fullWidth
              id="QuestionStageDeadline"
              name="QuestionStageDeadline"
              label="Question Stage Deadline"
              value={formik.values.QuestionStageDeadline}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.QuestionStageDeadline &&
                Boolean(formik.errors.QuestionStageDeadline)
              }
              helperText={
                formik.touched.QuestionStageDeadline &&
                formik.errors.QuestionStageDeadline
              }
            />
            <TextField
              style={{ margin: "5px" }}
              fullWidth
              id="TagStageDeadline"
              name="TagStageDeadline"
              label="Tag Stage Deadline"
              value={formik.values.TagStageDeadline}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.TagStageDeadline &&
                Boolean(formik.errors.TagStageDeadline)
              }
              helperText={
                formik.touched.TagStageDeadline &&
                formik.errors.TagStageDeadline
              }
            />
            <TextField
              style={{ margin: "5px" }}
              fullWidth
              id="VoteStageDeadline"
              name="VoteStageDeadline"
              label="Vote Stage Deadline"
              value={formik.values.VoteStageDeadline}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.VoteStageDeadline &&
                Boolean(formik.errors.VoteStageDeadline)
              }
              helperText={
                formik.touched.VoteStageDeadline &&
                formik.errors.VoteStageDeadline
              }
            />
            <TextField
              style={{ margin: "5px" }}
              fullWidth
              id="PanelPresentationDate"
              name="PanelPresentationDate"
              label="Panel Presentation Date"
              value={formik.values.PanelPresentationDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.PanelPresentationDate &&
                Boolean(formik.errors.PanelPresentationDate)
              }
              helperText={
                formik.touched.PanelPresentationDate &&
                formik.errors.PanelPresentationDate
              }
            />

            <Button
              style={{ margin: "5px" }}
              variant="contained"
              fullWidth
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? <LoadingSpinner /> : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default NewPanelForm;
