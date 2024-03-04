import { Box, Typography } from "@mui/material";
import PanelForm from "../forms/PanelForm";

const AdminPanelPage = () => {
  return (
    <div>
      <Typography variant="h3" sx={{ my: 1 }}>
        Add a new panel
      </Typography>
      <Box p={2} sx={{ border: "2px solid grey" }}>
        <PanelForm />
      </Box>
    </div>
  );
};

export default AdminPanelPage;
