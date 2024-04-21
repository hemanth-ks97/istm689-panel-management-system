import React, { useState } from "react";

import * as yup from "yup";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

import { httpClient } from "../../client";
import LoadingSpinner from "../widgets/LoadingSpinner";
// MUI
import { Button, TextField, Typography, Select, MenuItem } from "@mui/material";

const validationSchema = yup.object({
  PanelID: yup.string().required("PanelID is required"),
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

const PanelForm = ({ panel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useSelector((state) => state.user);
  const formik = useFormik({
    initialValues: {
      PanelID: panel?.PanelID,
      PanelName: panel?.PanelName,
      PanelDesc: panel?.PanelDesc,
      Panelist: panel?.Panelist,
      PanelStartDate: dayjs(panel?.PanelStartDate),
      QuestionStageDeadline: dayjs(panel?.QuestionStageDeadline),
      TagStageDeadline: dayjs(panel?.TagStageDeadline),
      VoteStageDeadline: dayjs(panel?.VoteStageDeadline),
      PanelPresentationDate: dayjs(panel?.PanelPresentationDate),
      NumberOfQuestions: panel?.NumberOfQuestions,
      PanelVideoLink: panel?.PanelVideoLink,
      Visibility: panel?.Visibility,
      CreatedAt: panel?.CreatedAt,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      setIsLoading(true);
      httpClient
        .patch(`/panel/${panel?.PanelID}`, values, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          enqueueSnackbar("Panel updated", { variant: "success" });
        })
        .catch((error) => {
          enqueueSnackbar("Update failed", { variant: "error" });
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
  });

  if (!panel) {
    return <Typography>No panel provided</Typography>;
  }

  return (
    <>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          disabled={true}
          id="PanelID"
          name="PanelID"
          label="Panel ID"
          value={formik.values.PanelID}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.PanelID && Boolean(formik.errors.PanelID)}
          helperText={formik.touched.PanelID && formik.errors.PanelID}
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
          error={formik.touched.PanelName && Boolean(formik.errors.PanelName)}
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
          error={formik.touched.PanelDesc && Boolean(formik.errors.PanelDesc)}
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
            formik.touched.NumberOfQuestions && formik.errors.NumberOfQuestions
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

        <DateTimePicker
          sx={{ margin: "5px", width: "100%" }}
          id="PanelStartDate"
          name="PanelStartDate"
          label="Panel Start Date"
          value={formik.values.PanelStartDate}
          minDateTime={dayjs(Date.now())}
          helperText={
            formik.touched.PanelStartDate && formik.errors.PanelStartDate
          }
          error={
            formik.touched.PanelStartDate &&
            Boolean(formik.errors.PanelStartDate)
          }
          onChange={(newValue) => {
            formik.setFieldValue("PanelStartDate", newValue);
            formik.setFieldTouched("PanelStartDate", true);
          }}
        />

        <DateTimePicker
          sx={{ margin: "5px", width: "100%" }}
          id="QuestionStageDeadline"
          name="QuestionStageDeadline"
          label="Question Stage Deadline"
          minDateTime={formik.values.PanelStartDate}
          value={formik.values.QuestionStageDeadline}
          helperText={
            formik.touched.QuestionStageDeadline &&
            formik.errors.QuestionStageDeadline
          }
          error={
            formik.touched.QuestionStageDeadline &&
            Boolean(formik.errors.QuestionStageDeadline)
          }
          onChange={(newValue) => {
            formik.setFieldValue("QuestionStageDeadline", newValue);
            formik.setFieldTouched("QuestionStageDeadline", true);
          }}
        />

        <DateTimePicker
          sx={{ margin: "5px", width: "100%" }}
          id="TagStageDeadline"
          name="TagStageDeadline"
          label="Tag Stage Deadline"
          value={formik.values.TagStageDeadline}
          minDateTime={formik.values.QuestionStageDeadline}
          helperText={
            formik.touched.TagStageDeadline && formik.errors.TagStageDeadline
          }
          error={
            formik.touched.TagStageDeadline &&
            Boolean(formik.errors.TagStageDeadline)
          }
          onChange={(newValue) => {
            formik.setFieldValue("TagStageDeadline", newValue);
            formik.setFieldTouched("TagStageDeadline", true);
          }}
        />

        <DateTimePicker
          sx={{ margin: "5px", width: "100%" }}
          id="VoteStageDeadline"
          name="VoteStageDeadline"
          label="Vote Stage Deadline"
          value={formik.values.VoteStageDeadline}
          minDateTime={formik.values.TagStageDeadline}
          helperText={
            formik.touched.VoteStageDeadline && formik.errors.VoteStageDeadline
          }
          error={
            formik.touched.VoteStageDeadline &&
            Boolean(formik.errors.VoteStageDeadline)
          }
          onChange={(newValue) => {
            formik.setFieldValue("VoteStageDeadline", newValue);
            formik.setFieldTouched("VoteStageDeadline", true);
          }}
        />

        <DateTimePicker
          sx={{ margin: "5px", width: "100%" }}
          id="PanelPresentationDate"
          name="PanelPresentationDate"
          label="Panel Presentation Date"
          minDateTime={formik.values.VoteStageDeadline}
          value={formik.values.PanelPresentationDate}
          error={
            formik.touched.PanelPresentationDate &&
            Boolean(formik.errors.PanelPresentationDate)
          }
          helperText={
            formik.touched.PanelPresentationDate &&
            formik.errors.PanelPresentationDate
          }
          onChange={(newValue) => {
            formik.setFieldValue("PanelPresentationDate", newValue);
            formik.setFieldTouched("PanelPresentationDate", true);
          }}
        />

        <Button
          style={{ margin: "5px" }}
          variant="contained"
          disabled={isLoading}
          fullWidth
          type="submit"
        >
          {isLoading ? <LoadingSpinner /> : "Save"}
        </Button>
      </form>
    </>
  );
};

export default PanelForm;
