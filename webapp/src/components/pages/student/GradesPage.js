import React from "react";
// MUI
import { Typography, Box, Collapse, IconButton, Table, TableBody, TableCell, TableContainer, 
TableHead, TableRow, Paper, styled } from "@mui/material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

function createData(
  name,
  total,
) {
  return {
    name,
    total,
    grades: [
      {
        type: 'Question',
        grade: '95',
      },
      {
        type: 'Tagging',
        grade: '94',
      },
      {
        type: 'Voting',
        grade: '100',
      },
      {
        type: 'Engagement',
        grade: '100',
      },
    ],
  };
}

const rows = [
  createData('Anuja Panel', 97.25),
  createData('Panel frictionless', 95),
  createData('Panel cross-media', 100),
  createData('Panel compelling', 90),
  createData('Panel dynamic', 99),
];

function Row(props) {
  const { row } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
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
        <TableCell>
          {row.total}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Grade Breakdown
              </Typography>
              <Table size="small" aria-label="purchases">
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
                      <TableCell>{gradesRow.grade}</TableCell> 
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}


const DemoPaper = styled(Paper)(({ theme }) => ({
  width: 800,
  margin: theme.spacing(2),
  padding: theme.spacing(2),
  ...theme.typography.body2,
  textAlign: "center",
}));

const GradesPage = () => {

  return (

   <Box sx={{ flexGrow: 1 }}> 
    <Typography
        variant="h4"
        mt={2}
        textAlign="center"
        sx={{ fontFamily: "monospace", fontWeight:"bold"}}>
      Grades
    </Typography>
          <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{ flexGrow: 1 }}
        >
          <DemoPaper square={false}>
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
                {rows.map((row) => (
                <Row key={row.name} row={row} />               
                ))}
              </TableBody>
            </Table>
            </TableContainer>
          </DemoPaper>
        </Box>
    </Box>


  );
};

export default GradesPage;
