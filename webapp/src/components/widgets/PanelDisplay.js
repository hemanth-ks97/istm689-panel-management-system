import { React } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Edit as EditIcon } from '@mui/icons-material';
/**
 We can re use this component to display list of upcoming panels on student dashboard
 The edit option is shown only when isAdmin is passed as true
 While rendering this component for student, we can make it false 
 */
const PanelDisplay = ({ data, isAdmin }) => {

  const columns = [
    { field: "PanelName", headerName: "Panel", width: 200 },
    { field: "NumberOfQuestions", headerName: "# of questions" },
    { field: "Panelist", headerName: "Panelists", width: 200 },
    {
      field: "QuestionStageDeadline",
      headerName: "Question deadline",
      width: 200,
    },
    {
      field: "PanelPresentationDate",
      headerName: "Presentation Date",
      width: 200,
    },
  ];

  if (isAdmin) {
    columns.push({
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 100,
      renderCell: (params) => {
        const onClick = (e) => {
          e.stopPropagation(); 
          //TODO: handle edit action          
        };

        return <EditIcon onClick={onClick} style={{ cursor: 'pointer' }} />;
      },
    });
  }
  return (
    <div>
      <DataGrid rows={data} columns={columns} getRowId={(row) => row.PanelID} />
    </div>
  );
};

export default PanelDisplay;
