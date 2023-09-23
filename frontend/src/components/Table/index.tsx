import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
  Paper,
  IconButton,
  TableHead,
} from "@mui/material";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import { TableHeaderCell } from "./style";
import { useTheme } from "@mui/material/styles";

// https://mui.com/material-ui/react-table/
type TableProps = {
  rowsPerPage: number;
  page: number;
  totalNumberOfEntry: number;
  data: { [key: string]: string | number; id: string }[];
  columns: { columnName: string; columnKey: string }[];
  onPageChange: (newPage: number) => void;
  onClickRedirect: (row: {
    [key: string]: string | number;
    id: string;
  }) => void;
  onNumOfRowsChange: (numOfRows: number) => void;
  rowsPerPageOptions?: number[];
};
function index({
  rowsPerPage,
  page,
  totalNumberOfEntry,
  data,
  columns,
  onPageChange,
  onClickRedirect,
  onNumOfRowsChange,
  rowsPerPageOptions = [5, 10, 25],
}: TableProps) {
  const handleFirstPageButtonClick = () => {
    onPageChange(0);
  };

  const handleBackButtonClick = () => {
    onPageChange(page - 1);
  };

  const handleNextButtonClick = () => {
    onPageChange(page + 1);
  };

  const handleLastPageButtonClick = () => {
    onPageChange(Math.max(0, Math.ceil(totalNumberOfEntry / rowsPerPage) - 1));
  };

  const handleChangePage = (event: any, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onNumOfRowsChange(parseInt(event.target.value));
  };

  function TablePaginationActions() {
    const theme = useTheme();
    return (
      <Box sx={{ flexShrink: 0, ml: 2.5 }}>
        <IconButton
          onClick={handleFirstPageButtonClick}
          disabled={page === 0}
          aria-label="first page"
        >
          {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
        </IconButton>
        <IconButton
          onClick={handleBackButtonClick}
          disabled={page === 0}
          aria-label="previous page"
        >
          {theme.direction === "rtl" ? (
            <KeyboardArrowRight />
          ) : (
            <KeyboardArrowLeft />
          )}
        </IconButton>
        <IconButton
          onClick={handleNextButtonClick}
          disabled={page >= Math.ceil(totalNumberOfEntry / rowsPerPage) - 1}
          aria-label="next page"
        >
          {theme.direction === "rtl" ? (
            <KeyboardArrowLeft />
          ) : (
            <KeyboardArrowRight />
          )}
        </IconButton>
        <IconButton
          onClick={handleLastPageButtonClick}
          disabled={page >= Math.ceil(totalNumberOfEntry / rowsPerPage) - 1}
          aria-label="last page"
        >
          {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
        </IconButton>
      </Box>
    );
  }
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
        <TableHead>
          <TableRow>
            {columns.map(({ columnName }) => (
              <TableHeaderCell key={columnName}>{columnName}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={index}
              onClick={() => onClickRedirect(row)}
              sx={{ cursor: "pointer" }}
              hover
            >
              {columns.map(({ columnKey }) => (
                <TableCell component="td" key={columnKey}>
                  <span className="block w-40 overflow-hidden text-ellipsis whitespace-nowrap">
                    {row[columnKey]}
                  </span>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={rowsPerPageOptions}
              count={totalNumberOfEntry}
              page={page}
              rowsPerPage={rowsPerPage}
              SelectProps={{
                inputProps: {
                  "aria-label": "rows per page",
                },
                native: true,
              }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}

export default index;
