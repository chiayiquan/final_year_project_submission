import React from "react";
import { Modal, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type ModalProps = {
  children?: React.ReactNode;
  isModalOpen: boolean;
  setModalState: () => void;
};

function index(props: ModalProps) {
  const { children, isModalOpen, setModalState } = props;

  return (
    <Modal open={isModalOpen} onClose={() => setModalState()}>
      <Box
        sx={{
          position: "absolute" as "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          height: "90%",
          backgroundColor: "#f5f5f5",
          border: "1px solid #000",
          boxShadow: 24,
          p: 4,
          overflow: "auto",
        }}
      >
        <div className="flex justify-end">
          <IconButton
            onClick={() => setModalState()}
            style={{ height: "40px", marginRight: "-10px" }}
          >
            <CloseIcon style={{ height: "40px" }} />
          </IconButton>
        </div>
        {children}
      </Box>
    </Modal>
  );
}

export default index;
