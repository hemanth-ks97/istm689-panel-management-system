import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpClient } from "../../../client";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import LoadingSpinner from "../../widgets/LoadingSpinner";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  styled,
} from "@mui/material";

const StudentDashboardPage = ({ user }) => {
  const [panelDetails, setPanelDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  const DemoPaper = styled(Paper)(({ theme }) => ({
    width: 800,
    margin: theme.spacing(2),
    padding: theme.spacing(2),
    ...theme.typography.body2,
    textAlign: "center",
  }));

  const handleRowClick = (path) => {
    navigate(path);
  };

  useEffect(() => {
    setIsLoading(true);
    httpClient
      .get("/panel", { headers: headers })
      .then((response) => {
        const sortedPanels = [...response.data].sort((a, b) => {
          const deadlineA = new Date(a.QuestionStageDeadline);
          const deadlineB = new Date(b.QuestionStageDeadline);
          return deadlineA - deadlineB;
        });

        setPanelDetails(sortedPanels);
      })
      .catch((error) => {
        console.error("Error fetching panel details:", error);
        enqueueSnackbar(error.message, { variant: "error" });
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography
        variant="h4"
        mt={2}
        textAlign="center"
        sx={{ fontFamily: "monospace" }}
      >
        Student Dashboard
      </Typography>
      <Box
        display="flex"
        mt={2}
        alignItems="center"
        justifyContent="center"
        sx={{ flexGrow: 1 }}
      >
        <DemoPaper square={false}>
          <Typography variant="h6">Upcoming Assignments</Typography>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 280 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Panel Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Due Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {panelDetails.map((panel) => (
                  <>
                    <TableRow
                      hover
                      key={panel.PanelID}
                      onClick={() => handleRowClick(`panel/${panel.PanelID}`)}
                    >
                      <TableCell component="th" scope="row">
                        <Typography>{panel.PanelName}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {/* Empty cells to align with the table headers*/}
                        {user.role === "admin" && (
                          <Typography
                            sx={{
                              color:
                                panel.Visibility === "public" ? "green" : "red",
                            }}
                          >
                            {panel.Visibility}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow
                      hover
                      key={panel.PanelID}
                      onClick={() =>
                        handleRowClick(`panel/${panel.PanelID}/question`)
                      }
                    >
                      <TableCell component="th" scope="row" sx={{ pl: "40px" }}>
                        Submit Questions
                      </TableCell>
                      <TableCell align="right">
                        {new Date(
                          panel.QuestionStageDeadline
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow
                      hover
                      key={panel.PanelID}
                      onClick={() =>
                        handleRowClick(`panel/${panel.PanelID}/tagging`)
                      }
                    >
                      <TableCell component="th" scope="row" sx={{ pl: "40px" }}>
                        Tag Questions
                      </TableCell>
                      <TableCell align="right">
                        {new Date(panel.TagStageDeadline).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                          }
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow
                      hover
                      key={panel.PanelID}
                      onClick={() =>
                        handleRowClick(`panel/${panel.PanelID}/voting`)
                      }
                    >
                      <TableCell component="th" scope="row" sx={{ pl: "40px" }}>
                        Vote Questions
                      </TableCell>
                      <TableCell align="right">
                        {new Date(panel.VoteStageDeadline).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                          }
                        )}
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DemoPaper>
      </Box>
    </Box>
  );
};

export default StudentDashboardPage;
