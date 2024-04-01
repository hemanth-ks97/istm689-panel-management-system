import React, { useState } from "react";

import * as yup from "yup";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";

import { httpClient } from "../../client";
import LoadingSpinner from "../widgets/LoadingSpinner";
// MUI
import { Button, TextField, Typography } from "@mui/material";

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
      PanelStartDate: panel?.PanelStartDate,
      QuestionStageDeadline: panel?.QuestionStageDeadline,
      TagStageDeadline: panel?.TagStageDeadline,
      VoteStageDeadline: panel?.VoteStageDeadline,
      PanelPresentationDate: panel?.PanelPresentationDate,
      NumberOfQuestions: panel?.NumberOfQuestions,
      PanelVideoLink: panel?.PanelVideoLink,
      Visibility: panel?.Visibility,
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
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="Visibility"
          name="Visibility"
          label="Visibility"
          value={formik.values.Visibility}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.Visibility && Boolean(formik.errors.Visibility)}
          helperText={formik.touched.Visibility && formik.errors.Visibility}
        />
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
          label="First Name"
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
          label="Last Name"
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
          id="PanelStartDate"
          name="PanelStartDate"
          label="PanelStartDate"
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
          label="QuestionStageDeadline"
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
          label="Canvas ID"
          value={formik.values.TagStageDeadline}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.TagStageDeadline &&
            Boolean(formik.errors.TagStageDeadline)
          }
          helperText={
            formik.touched.TagStageDeadline && formik.errors.TagStageDeadline
          }
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="VoteStageDeadline"
          name="VoteStageDeadline"
          label="VoteStageDeadline"
          value={formik.values.VoteStageDeadline}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.VoteStageDeadline &&
            Boolean(formik.errors.VoteStageDeadline)
          }
          helperText={
            formik.touched.VoteStageDeadline && formik.errors.VoteStageDeadline
          }
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="PanelPresentationDate"
          name="PanelPresentationDate"
          label="PanelPresentationDate"
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

        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="PanelVideoLink"
          name="PanelVideoLink"
          label="PanelVideoLink"
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
