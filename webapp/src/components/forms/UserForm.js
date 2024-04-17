import React, { useState } from "react";

import * as yup from "yup";
import { useFormik } from "formik";
// MUI
import { Button, TextField, Typography, Select, MenuItem } from "@mui/material";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";

import LoadingSpinner from "../widgets/LoadingSpinner";

import { httpClient } from "../../client";

const validationSchema = yup.object({
  UserID: yup.string("Enter UserID").required("UserID is required"),
  EmailID: yup
    .string("Enter the email")
    .email("Enter a valid email")
    .required("Email is required"),
  FName: yup.string("Enter FName").required("FName is required"),
  LName: yup.string("Enter LName").required("LName is required"),
  UIN: yup.number("Enter UIN"),
  Role: yup
    .string("Enter Role")
    .oneOf(["student", "panelist", "admin"])
    .required("Role is required"),
  CanvasID: yup.number("Enter CanvasID"),
  Section: yup.string("Enter Section"),
});

const UserForm = ({ currentUser }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useSelector((state) => state.user);
  const formik = useFormik({
    initialValues: {
      UserID: currentUser?.UserID,
      EmailID: currentUser?.EmailID,
      FName: currentUser?.FName,
      LName: currentUser?.LName,
      UIN: currentUser?.UIN,
      Role: currentUser?.Role,
      CanvasID: currentUser?.CanvasID,
      Section: currentUser?.Section,
      CreatedAt: currentUser?.CreatedAt,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      setIsLoading(true);
      httpClient
        .patch(`/user/${currentUser?.UserID}`, values, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          enqueueSnackbar("User updated", { variant: "success" });
        })
        .catch((error) => {
          enqueueSnackbar("Updated failed", { variant: "error" });
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
  });

  if (!user) {
    return <Typography>No user provided</Typography>;
  }

  return (
    <>
      <form onSubmit={formik.handleSubmit}>
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
          id="EmailID"
          name="EmailID"
          label="Email"
          type="email"
          value={formik.values.EmailID}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.EmailID && Boolean(formik.errors.EmailID)}
          helperText={formik.touched.EmailID && formik.errors.EmailID}
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="FName"
          name="FName"
          label="First Name"
          value={formik.values.FName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.FName && Boolean(formik.errors.FName)}
          helperText={formik.touched.FName && formik.errors.FName}
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="LName"
          name="LName"
          label="Last Name"
          value={formik.values.LName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.LName && Boolean(formik.errors.LName)}
          helperText={formik.touched.LName && formik.errors.LName}
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="UIN"
          name="UIN"
          label="UIN"
          type="number"
          value={formik.values.UIN}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.UIN && Boolean(formik.errors.UIN)}
          helperText={formik.touched.UIN && formik.errors.UIN}
        />
        <Select
          style={{ margin: "5px" }}
          fullWidth
          id="Role"
          name="Role"
          label="Role"
          value={formik.values.Role}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.userType && Boolean(formik.errors.userType)}
        >
          <MenuItem value="student">Student</MenuItem>
          <MenuItem value="panelist">Panelist</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </Select>
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="CanvasID"
          name="CanvasID"
          label="Canvas ID"
          type="number"
          value={formik.values.CanvasID}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.CanvasID && Boolean(formik.errors.CanvasID)}
          helperText={formik.touched.CanvasID && formik.errors.CanvasID}
        />
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="Section"
          name="Section"
          label="Section"
          value={formik.values.Section}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.Section && Boolean(formik.errors.Section)}
          helperText={formik.touched.Section && formik.errors.Section}
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

export default UserForm;
