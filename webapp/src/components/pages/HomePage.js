import React from "react";
// MUI
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

const HomePage = () => {
  const DemoPaper = styled(Paper)(({ theme }) => ({
    width: 800,
    // height: 500,
    padding: theme.spacing(2),
    ...theme.typography.body2,
    textAlign: "center",
  }));

  const createData = (Assignment, Deadline) => {
    return { Assignment, Deadline };
  };

  const ThisWeekRows = [
    createData("Module 1 Video", "-"),
    createData("Module 1 Submit Questions", "March 1, 2023"),
  ];

  const NextWeekRows = [
    createData("Module 1 Tag Questions", "March 13, 2023"),
    createData("Module 1 Vote Questions", "March 17, 2023"),
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography
        variant="h4"
        mt={2}
        textAlign={"center"}
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
          <Typography variant="h6">Due This Week</Typography>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 280 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Assignment</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Due Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ThisWeekRows.map((row) => (
                  <TableRow
                    hover
                    key={row.Assignment}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {row.Assignment}
                    </TableCell>
                    <TableCell align="right">{row.Deadline}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="h6" padding={2}>
            Upcoming Assignments
          </Typography>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 280 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Assignment</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Due Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {NextWeekRows.map((row) => (
                  <TableRow
                    hover
                    key={row.Assignment}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {row.Assignment}
                    </TableCell>
                    <TableCell align="right">{row.Deadline}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DemoPaper>
      </Box>
    </Box>
  );
};

export default HomePage;
