import React, { useState, useEffect } from "react";

// MUI
import {
  Typography,
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { httpClient } from "../../../client";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import LoadingSpinner from "../../widgets/LoadingSpinner";

const Row = ({ row }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.name}
        </TableCell>
        <TableCell>{row.total < 0 ? "N/A" : row.total}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Grade Breakdown
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Criteria</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Grade</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.grades.map((gradesRow) => (
                    <TableRow key={gradesRow.type}>
                      <TableCell component="th" scope="row">
                        {gradesRow.type}
                      </TableCell>
                      <TableCell>
                        {gradesRow.grade < 0 ? "N/A" : gradesRow.grade}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const GradesPage = () => {
  const { user } = useSelector((state) => state.user);
  const { enqueueSnackbar } = useSnackbar();
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    setIsLoading(true);
    httpClient
      .get("/my/metrics", { headers })
      .then((response) => {
        setMetrics(response.data);
      })
      .catch((error) => {
        enqueueSnackbar(error.message, { variant: "error" });
        console.log(error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScren />;
  }

  if (metrics.length === 0) {
    return <Typography>Did not fetch any grades</Typography>;
  }

  // Build rows for the panels!

  const grades = metrics.map((metric) => {
    return {
      name: metric?.PanelName || "Could not determine panel name",
      total: metric?.FinalTotalScore || -1,
      grades: [
        {
          type: "Question",
          grade: metric?.QuestionStageScore || -1,
        },
        {
          type: "Tagging",
          grade: metric?.TagStageScore || -1,
        },
        {
          type: "Voting",
          grade: metric?.VoteStageScore || -1,
        },
      ],
    };
  });

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography
        variant="h4"
        mt={2}
        textAlign="center"
        sx={{ fontFamily: "monospace", fontWeight: "bold" }}
      >
        Grades
      </Typography>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ flexGrow: 1 }}
      >
        <Paper
          square={false}
          style={{
            width: 800,
            margin: 2,
            padding: 2,
            textAlign: "center",
            typography: "body2",
          }}
        >
          <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell sx={{ fontWeight: "bold" }}>Panel</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Grade</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grades.map((grade, idx) => {
                  return <Row key={`header-${idx}`} row={grade} />;
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default GradesPage;
