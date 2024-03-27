import React from "react";

import * as yup from "yup";
import { useFormik } from "formik";
// MUI
import { Button, TextField, Typography } from "@mui/material";

import { httpClient } from "../../client";

const validationSchema = yup.object({
  UserID: yup.string("Enter UserID").required("UserID is required"),
  EmailID: yup
    .string("Enter the email")
    .email("Enter a valid email")
    .required("Email is required"),
  FName: yup.string("Enter FName").required("FName is required"),
  LName: yup.string("Enter LName").required("LName is required"),
  UIN: yup.number("Enter UIN").required("UIN is required"),
  Role: yup
    .string("Enter Role")
    .oneOf(["student", "panelist", "admin"])
    .required("Role is required"),
  CanvasID: yup.number("Enter CanvasID").required("CanvasID is required"),
  Section: yup.string("Enter Section").required("Section is required"),
});

const UserForm = ({ user }) => {
  const formik = useFormik({
    initialValues: {
      UserID: user?.UserID,
      EmailID: user?.EmailID,
      FName: user?.FName,
      LName: user?.LName,
      UIN: user?.UIN,
      Role: user?.Role,
      CanvasID: user?.CanvasID,
      Section: user?.Section,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      httpClient.patch(`/user/${user?.UserID}`, values, {
        headers: {
          Authorization: `Bearer adsfadsf`,
          "Content-Type": "application/json",
        },
      });
      alert(JSON.stringify(values, null, 2));
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
        <TextField
          style={{ margin: "5px" }}
          fullWidth
          id="Role"
          name="Role"
          label="Role"
          value={formik.values.Role}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.Role && Boolean(formik.errors.Role)}
          helperText={formik.touched.Role && formik.errors.Role}
        />
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
          type="submit"
        >
          Save
        </Button>
      </form>
    </>
  );
};

export default UserForm;
