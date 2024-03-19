import { React } from "react";

import { Typography } from "@mui/material";
import UploadFileCard from "../../widgets/UploadFileCard";

const AdminImportPage = () => {
  return (
    <Typography>
      Upload the files to create or update students
      <UploadFileCard />
    </Typography>
  );
};

export default AdminImportPage;
