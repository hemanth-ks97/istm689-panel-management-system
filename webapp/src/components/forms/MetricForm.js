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
  PanelID: yup.string("Enter PanelID").required("PanelID is required"),
  UserID: yup.string("Enter UserID").required("UserID is required"),
  UserFName: yup
    .string("Enter User First Name")
    .required("User First Name is required"),
  UserLName: yup
    .string("Enter User Last Name")
    .required("User Last Name is required"),
  QuestionStageScore: yup
    .number("Enter QuestionStageScore")
    .required("QuestionStageScore is required"),
  TagStageScore: yup
    .number("Enter TagStageScore")
    .required("TagStageScore is required"),
  VoteStageScore: yup
    .number("Enter VoteStageScore")
    .required("VoteStageScore is required"),
  FinalTotalScore: yup
    .number("Enter FinalTotalScore")
    .required("FinalTotalScore is required"),
  EnteredQuestionsTotalScore: yup
    .string("Enter EnteredQuestionsTotalScore")
    .required("EnteredQuestionsTotalScore is required"),
  TagStageInTime: yup.string("Enter TagStageInTime"),
  TagStageOutTime: yup.string("Enter TagStageOutTime"),
  TagStageSD: yup.string("Enter TagStageSD"),
  VoteStageSD: yup.string("Enter VoteStageSD"),
  VoteStageInTime: yup.string("Enter VoteStageInTime"),
  VoteStageOutTime: yup.string("Enter VoteStageOutTime"),
});

const MetricForm = ({ metric }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useSelector((state) => state.user);
  const formik = useFormik({
    initialValues: {
      PanelID: metric?.PanelID,
      UserID: metric?.UserID,
      UserFName: metric?.UserFName,
      UserLName: metric?.UserLName,
      QuestionStageScore: metric?.QuestionStageScore,
      TagStageScore: metric?.TagStageScore,
      VoteStageScore: metric?.VoteStageScore,
      FinalTotalScore: metric?.FinalTotalScore,
      EnteredQuestionsTotalScore: metric?.EnteredQuestionsTotalScore,
      TagStageInTime: metric?.TagStageInTime,
      TagStageOutTime: metric?.TagStageOutTime,
      TagStageSD: metric?.TagStageSD,
      VoteStageSD: metric?.VoteStageSD,
      VoteStageInTime: metric?.VoteStageInTime,
      VoteStageOutTime: metric?.VoteStageOutTime,
      CreatedAt: metric?.CreatedAt,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      setIsLoading(true);
      httpClient
        .patch(`/metric`, values, {
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

  if (!metric) {
    return <Typography>No metric provided</Typography>;
  }

  return (
    <>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="PanelID"
          name="PanelID"
          label="Panel ID"
          disabled={true}
          value={formik.values.PanelID}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.PanelID && Boolean(formik.errors.PanelID)}
          helperText={formik.touched.PanelID && formik.errors.PanelID}
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="UserID"
          name="UserID"
          label="User ID"
          disabled={true}
          value={formik.values.UserID}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.UserID && Boolean(formik.errors.UserID)}
          helperText={formik.touched.UserID && formik.errors.UserID}
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="UserFName"
          name="UserFName"
          label="User First Name"
          disabled={true}
          value={formik.values.UserFName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.UserFName && Boolean(formik.errors.UserFName)}
          helperText={formik.touched.UserFName && formik.errors.UserFName}
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="UserLName"
          name="UserLName"
          label="User Last Name"
          disabled={true}
          value={formik.values.UserLName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.UserLName && Boolean(formik.errors.UserLName)}
          helperText={formik.touched.UserLName && formik.errors.UserLName}
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="QuestionStageScore"
          name="QuestionStageScore"
          label="Question Stage Score"
          type="number"
          value={formik.values.QuestionStageScore}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.QuestionStageScore &&
            Boolean(formik.errors.QuestionStageScore)
          }
          helperText={
            formik.touched.QuestionStageScore &&
            formik.errors.QuestionStageScore
          }
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="TagStageScore"
          name="TagStageScore"
          label="Tag Stage Score"
          type="number"
          value={formik.values.TagStageScore}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.TagStageScore && Boolean(formik.errors.TagStageScore)
          }
          helperText={
            formik.touched.TagStageScore && formik.errors.TagStageScore
          }
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="VoteStageScore"
          name="VoteStageScore"
          label="Vote Stage Score"
          type="number"
          value={formik.values.VoteStageScore}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.VoteStageScore &&
            Boolean(formik.errors.VoteStageScore)
          }
          helperText={
            formik.touched.VoteStageScore && formik.errors.VoteStageScore
          }
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="FinalTotalScore"
          name="FinalTotalScore"
          label="Final Stage Score"
          type="number"
          value={formik.values.FinalTotalScore}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.FinalTotalScore &&
            Boolean(formik.errors.FinalTotalScore)
          }
          helperText={
            formik.touched.FinalTotalScore && formik.errors.FinalTotalScore
          }
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="EnteredQuestionsTotalScore"
          name="EnteredQuestionsTotalScore"
          label="Entered Questions Total Score"
          type="number"
          value={formik.values.EnteredQuestionsTotalScore}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.EnteredQuestionsTotalScore &&
            Boolean(formik.errors.EnteredQuestionsTotalScore)
          }
          helperText={
            formik.touched.EnteredQuestionsTotalScore &&
            formik.errors.EnteredQuestionsTotalScore
          }
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="TagStageSD"
          name="TagStageSD"
          label="Tag Stage Standard Deviaton"
          type="number"
          value={formik.values.TagStageSD}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.TagStageSD && Boolean(formik.errors.TagStageSD)}
          helperText={formik.touched.TagStageSD && formik.errors.TagStageSD}
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="VoteStageSD"
          name="VoteStageSD"
          label="Vote Stage Standard Deviaton"
          type="number"
          value={formik.values.VoteStageSD}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.VoteStageSD && Boolean(formik.errors.VoteStageSD)
          }
          helperText={formik.touched.VoteStageSD && formik.errors.VoteStageSD}
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="TagStageInTime"
          name="TagStageInTime"
          label="Tag Stage In Time"
          value={formik.values.TagStageInTime}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.TagStageInTime &&
            Boolean(formik.errors.TagStageInTime)
          }
          helperText={
            formik.touched.TagStageInTime && formik.errors.TagStageInTime
          }
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="TagStageOutTime"
          name="TagStageOutTime"
          label="Tag Stage Out Time"
          value={formik.values.TagStageOutTime}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.TagStageOutTime &&
            Boolean(formik.errors.TagStageOutTime)
          }
          helperText={
            formik.touched.TagStageOutTime && formik.errors.TagStageOutTime
          }
        />

        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="VoteStageInTime"
          name="VoteStageInTime"
          label="Vote Stage In Time"
          value={formik.values.VoteStageInTime}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.VoteStageInTime &&
            Boolean(formik.errors.VoteStageInTime)
          }
          helperText={
            formik.touched.VoteStageInTime && formik.errors.VoteStageInTime
          }
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="VoteStageOutTime"
          name="VoteStageOutTime"
          label="Vote Stage Out Time"
          value={formik.values.VoteStageOutTime}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.VoteStageOutTime &&
            Boolean(formik.errors.VoteStageOutTime)
          }
          helperText={
            formik.touched.VoteStageOutTime && formik.errors.VoteStageOutTime
          }
        />

        <Button
          style={{ margin: "5px" }}
          variant="contained"
          fullWidth
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? <LoadingSpinner /> : "Save"}
        </Button>
      </form>
    </>
  );
};

export default MetricForm;
